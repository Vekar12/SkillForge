import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  initProgress, markTaskComplete, markTaskIncomplete,
  isTaskComplete, areDayTasksDone, saveAssessment,
} from '../utils/progress'
import { loadSkillsCatalog, loadRoadmap, loadDayData } from '../utils/dataLoader'

const AppContext = createContext(null)

function decodeJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch { return null }
}

export function AppProvider({ children }) {
  const [user, setUser]                   = useState(null)
  const [userLoading, setUserLoading]     = useState(true)
  const [skills, setSkills]               = useState([])
  const [activeSkillId, setActiveSkillId] = useState('apm-foundations')
  const [roadmap, setRoadmap]             = useState([])
  const [dayData, setDayData]             = useState(null)
  const [dayLoading, setDayLoading]       = useState(false)
  const [progress, setProgress]           = useState(null)
  const [groqKeySet, setGroqKeySet]       = useState(() => !!localStorage.getItem('sf_groq_key'))
  const [activeDay, setActiveDay]         = useState(1)

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('sf_token')
    if (token) {
      const payload = decodeJwtPayload(token)
      if (payload) {
        setUser({
          uid: payload.sub, name: payload.name, email: payload.email,
          photo: payload.picture || null,
          avatar: payload.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U',
          token,
        })
      } else {
        localStorage.removeItem('sf_token')
      }
    }
    setUserLoading(false)
  }, [])

  const loginWithGoogle = useCallback((credential) => {
    if (!credential) {
      setUser({ uid: 'demo-uid-001', name: 'Demo User', email: 'demo@example.com', photo: null, avatar: 'DU', token: null })
      return
    }
    const payload = decodeJwtPayload(credential)
    if (!payload) return
    const u = {
      uid: payload.sub, name: payload.name, email: payload.email,
      photo: payload.picture || null,
      avatar: payload.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U',
      token: credential,
    }
    localStorage.setItem('sf_token', credential)
    setUser(u)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('sf_token')
    setUser(null); setProgress(null); setDayData(null)
  }, [])

  // ── Skills catalog ────────────────────────────────────────────────────────
  useEffect(() => {
    loadSkillsCatalog().then(setSkills).catch(() => setSkills([]))
  }, [])

  // ── Progress + roadmap ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !activeSkillId) return
    const p = initProgress(user.uid, activeSkillId)
    setProgress(p)
    setGroqKeySet(!!localStorage.getItem('sf_groq_key'))
    // Eagerly set activeDay here so the day-loader effect always runs with the
    // correct day for this skill immediately. Without this the day-loader fires
    // once with the previous skill's stale activeDay before the separate
    // progress→activeDay effect can update it, wasting a fetch on the wrong day.
    setActiveDay(Math.min(p.currentDay || 1, 21))
    loadRoadmap(activeSkillId).then(setRoadmap).catch(() => setRoadmap([]))
  }, [user, activeSkillId])

  // ── Active day from progress.currentDay ───────────────────────────────────
  useEffect(() => {
    if (!progress) return
    setActiveDay(Math.min(progress.currentDay || 1, 21))
  }, [progress])

  // ── Load day data when activeDay changes ──────────────────────────────────
  useEffect(() => {
    if (!activeSkillId || !activeDay) return
    setDayLoading(true)
    loadDayData(activeSkillId, activeDay)
      .then(setDayData)
      .catch(() => setDayData(null))
      .finally(() => setDayLoading(false))
  }, [activeSkillId, activeDay])

  // ── Load a specific day for viewing ──────────────────────────────────────
  const loadDay = useCallback(async (day) => {
    setDayLoading(true)
    try {
      const d = await loadDayData(activeSkillId, day)
      setDayData(d)
    } finally {
      setDayLoading(false)
    }
  }, [activeSkillId])

  // ── Snap back to current active day ──────────────────────────────────────
  const resetToActiveDay = useCallback(() => {
    loadDay(activeDay)
  }, [activeDay, loadDay])

  // ── Task toggle ───────────────────────────────────────────────────────────
  const toggleTask = useCallback((taskId) => {
    if (!user || !progress || !dayData) return
    const day = dayData.day
    const alreadyDone = isTaskComplete(progress, day, taskId)
    const newProgress = alreadyDone
      ? markTaskIncomplete(user.uid, activeSkillId, day, taskId)
      : markTaskComplete(user.uid, activeSkillId, day, taskId)
    setProgress({ ...newProgress })
  }, [user, progress, dayData, activeSkillId])

  const isTaskDone = useCallback((taskId) => {
    if (!progress || !dayData) return false
    return isTaskComplete(progress, dayData.day, taskId)
  }, [progress, dayData])

  const isDayComplete = useCallback((day) => {
    if (!progress || !dayData) return false
    const tasks = dayData.day === day ? (dayData.tasks || []) : []
    return tasks.length > 0 && areDayTasksDone(progress, day, tasks)
  }, [progress, dayData])

  // ── Assessment ────────────────────────────────────────────────────────────
  const submitAssessment = useCallback((result) => {
    if (!user || !dayData) return
    const newProgress = saveAssessment(user.uid, activeSkillId, dayData.day, result)
    setProgress({ ...newProgress })
  }, [user, dayData, activeSkillId])

  // ── Groq key ──────────────────────────────────────────────────────────────
  const saveGroqKey = useCallback((key) => {
    try {
      localStorage.setItem('sf_groq_key', key)
      setGroqKeySet(true)
    } catch (err) {
      console.error('Failed to save Groq key:', err)
    }
  }, [])

  const getGroqKey = useCallback(() => localStorage.getItem('sf_groq_key') || '', [])

  // ── Sidebar helpers ───────────────────────────────────────────────────────
  const getPendingTasksForSidebar = useCallback(() => {
    if (!dayData || !progress) return []
    // Guard: loadDay() can set dayData to a past/future day for review without
    // changing activeDay. When the two diverge, don't show the reviewed day's
    // tasks as "pending today" — return empty until the user is back on their
    // real current day.
    if (dayData.day !== activeDay) return []
    return (dayData.tasks || []).filter(t => !isTaskComplete(progress, activeDay, t.id))
  }, [dayData, progress, activeDay])

  return (
    <AppContext.Provider value={{
      user, userLoading, loginWithGoogle, logout,
      skills, activeSkillId, setActiveSkillId,
      roadmap,
      dayData, dayLoading, activeDay, loadDay, resetToActiveDay,
      progress,
      toggleTask, isTaskDone, isDayComplete,
      submitAssessment,
      groqKeySet, saveGroqKey, getGroqKey,
      getPendingTasksForSidebar,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
