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
  } catch {
    return null
  }
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

  // ── Auth — Google ID token decoded client-side, stored in localStorage ────
  useEffect(() => {
    const token = localStorage.getItem('sf_token')
    if (token) {
      const payload = decodeJwtPayload(token)
      if (payload) {
        setUser({ uid: payload.sub, name: payload.name, email: payload.email, photo: payload.picture || null, avatar: payload.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U', token })
      } else {
        localStorage.removeItem('sf_token')
      }
    }
    setUserLoading(false)
  }, [])

  // Called by <GoogleLogin onSuccess> with the credential (Google ID token)
  const loginWithGoogle = useCallback((credential) => {
    if (!credential) {
      // Demo mode — no real Google Client ID configured
      setUser({ uid: 'demo-uid-001', name: 'Demo User', email: 'demo@example.com', photo: null, avatar: 'DU', token: null })
      return
    }
    const payload = decodeJwtPayload(credential)
    if (!payload) return
    const u = { uid: payload.sub, name: payload.name, email: payload.email, photo: payload.picture || null, avatar: payload.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U', token: credential }
    localStorage.setItem('sf_token', credential)
    setUser(u)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('sf_token')
    setUser(null)
    setProgress(null)
    setDayData(null)
  }, [])

  // ── Load skills catalog ───────────────────────────────────────────────────
  useEffect(() => {
    loadSkillsCatalog().then(setSkills).catch(() => setSkills([]))
  }, [])

  // ── Load progress + roadmap from localStorage when user + skill ready ─────
  useEffect(() => {
    if (!user || !activeSkillId) return
    const p = initProgress(user.uid, activeSkillId)
    setProgress(p)
    // Eagerly set activeDay so the day-loader below doesn't fire with a stale day
    setActiveDay(Math.min(p.currentDay || 1, 21))
    setGroqKeySet(!!localStorage.getItem('sf_groq_key'))
    loadRoadmap(activeSkillId).then(setRoadmap).catch(() => setRoadmap([]))
  }, [user, activeSkillId])

  // Keep activeDay in sync whenever progress advances (e.g. after assessment)
  useEffect(() => {
    if (!progress) return
    setActiveDay(Math.min(progress.currentDay || 1, 21))
  }, [progress])

  // ── Load day data ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeSkillId || !activeDay) return
    setDayLoading(true)
    loadDayData(activeSkillId, activeDay)
      .then(setDayData)
      .catch(() => setDayData(null))
      .finally(() => setDayLoading(false))
  }, [activeSkillId, activeDay])

  // Load a specific day for viewing without changing the learner's active day
  const loadDay = useCallback(async (day) => {
    setDayLoading(true)
    try { const d = await loadDayData(activeSkillId, day); setDayData(d) }
    finally { setDayLoading(false) }
  }, [activeSkillId])

  // Snap back to the learner's current day (Today tab)
  const resetToActiveDay = useCallback(() => {
    if (!dayData || dayData.day !== activeDay) loadDay(activeDay)
  }, [dayData, activeDay, loadDay])

  // ── Task completion ───────────────────────────────────────────────────────
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
  // Receives the structured result (already parsed by Assessment.jsx via Groq)
  const submitAssessment = useCallback((result) => {
    if (!user || !dayData) return
    const newProgress = saveAssessment(user.uid, activeSkillId, dayData.day, result)
    setProgress({ ...newProgress })
    const nextDay = dayData.day + 1
    if (nextDay <= 21) setTimeout(() => loadDay(nextDay), 500)
  }, [user, dayData, activeSkillId, loadDay])

  // ── Groq key ──────────────────────────────────────────────────────────────
  const saveGroqKey = useCallback((key) => {
    try { localStorage.setItem('sf_groq_key', key); setGroqKeySet(true) }
    catch (err) { console.error('Failed to save Groq key', err) }
  }, [])

  const getGroqKey = useCallback(() => localStorage.getItem('sf_groq_key') || '', [])

  // ── Sidebar helpers ───────────────────────────────────────────────────────
  const getPendingTasksForSidebar = useCallback(() => {
    if (!dayData || !progress) return []
    // Only show pending tasks when viewing the current active day
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
      isDayUnlocked: (day) => (day === 1 || (progress?.currentDay || 1) >= day),
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
