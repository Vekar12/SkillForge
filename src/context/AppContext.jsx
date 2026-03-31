import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { isTaskComplete, areDayTasksDone, isDayUnlocked } from '../utils/progress'
import { loadSkillsCatalog, loadRoadmap, loadDayData } from '../utils/dataLoader'
import api from '../lib/api'

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
  const [groqKeySet, setGroqKeySet]       = useState(false)
  const [activeDay, setActiveDay]         = useState(1)

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('sf_token')
    if (token) {
      const payload = decodeJwtPayload(token)
      if (payload) {
        setUser({
          uid:    payload.sub,
          name:   payload.name,
          email:  payload.email,
          photo:  payload.picture || null,
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
      const demoUser = { uid: 'demo-uid-001', name: 'Demo User', email: 'demo@example.com', photo: null, avatar: 'DU', token: null }
      setUser(demoUser)
      return
    }
    const payload = decodeJwtPayload(credential)
    if (!payload) return
    const u = {
      uid:    payload.sub,
      name:   payload.name,
      email:  payload.email,
      photo:  payload.picture || null,
      avatar: payload.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U',
      token:  credential,
    }
    localStorage.setItem('sf_token', credential)
    setUser(u)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('sf_token')
    setUser(null)
    setProgress(null)
    setGroqKeySet(false)
  }, [])

  // ── Load skills catalog ───────────────────────────────────────────────────
  useEffect(() => {
    loadSkillsCatalog().then(setSkills).catch(() => setSkills([]))
  }, [])

  // ── Load progress + groq key status + roadmap when user + skill ready ─────
  useEffect(() => {
    if (!user || !activeSkillId) return

    // Load progress from backend
    api.get(`/api/progress/${activeSkillId}`)
      .then(({ data }) => {
        const { currentDay, streak, adjustments, completedTaskIds } = data.data
        // Build a progress shape compatible with utils/progress helpers
        const taskCompletions = {}
        for (const taskId of completedTaskIds || []) {
          if (!taskCompletions[currentDay]) taskCompletions[currentDay] = []
          taskCompletions[currentDay].push(taskId)
        }
        setProgress({ currentDay: currentDay || 1, streak: streak || 0, adjustments, taskCompletions })
      })
      .catch(() => {
        // Backend not running — fall back to localStorage
        const raw = localStorage.getItem(`sf_progress_${user.uid}_${activeSkillId}`)
        if (raw) setProgress(JSON.parse(raw))
        else setProgress({ currentDay: 1, streak: 0, adjustments: null, taskCompletions: {} })
      })

    // Check if Groq key is saved on backend
    api.get('/api/settings')
      .then(({ data }) => setGroqKeySet(data.data.groqKeySet))
      .catch(() => setGroqKeySet(!!localStorage.getItem('sf_groq_key')))

    loadRoadmap(activeSkillId).then(setRoadmap).catch(() => setRoadmap([]))
  }, [user, activeSkillId])

  // ── Derive active day ─────────────────────────────────────────────────────
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

  const loadDay = useCallback(async (day) => {
    setDayLoading(true)
    try {
      const data = await loadDayData(activeSkillId, day)
      setDayData(data)
    } finally {
      setDayLoading(false)
    }
  }, [activeSkillId])

  // ── Task completion ───────────────────────────────────────────────────────
  const toggleTask = useCallback(async (taskId) => {
    if (!user || !progress || !dayData) return
    const day = dayData.day
    const alreadyDone = isTaskComplete(progress, day, taskId)
    const task = (dayData.tasks || []).find(t => t.id === taskId)
    const type = task?.type || 'READ'

    // Optimistic update
    const updated = { ...progress, taskCompletions: { ...progress.taskCompletions } }
    if (!updated.taskCompletions[day]) updated.taskCompletions[day] = []
    if (alreadyDone) {
      updated.taskCompletions[day] = updated.taskCompletions[day].filter(id => id !== taskId)
    } else {
      updated.taskCompletions[day] = [...updated.taskCompletions[day], taskId]
    }
    setProgress(updated)

    // Sync to backend (best-effort)
    try {
      await api.post(`/api/progress/${activeSkillId}/task`, {
        taskId, day, type, completed: !alreadyDone,
      })
    } catch (err) {
      console.warn('Progress sync failed (offline?):', err.message)
      // Keep optimistic update — will sync on next session
      localStorage.setItem(`sf_progress_${user.uid}_${activeSkillId}`, JSON.stringify(updated))
    }
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
  const submitAssessment = useCallback(async (rawFeedback) => {
    if (!user || !dayData) return
    const day = dayData.day

    try {
      const { data } = await api.post('/api/assessment', {
        skillId: activeSkillId, day, rawFeedback,
      })
      const { parsed } = data.data

      // Advance progress locally
      const updated = {
        ...progress,
        currentDay: day + 1,
        assessments: { ...(progress.assessments || {}), [day]: { ...parsed, submittedAt: new Date().toISOString() } },
      }
      setProgress(updated)
      const nextDay = day + 1
      if (nextDay <= 21) setTimeout(() => loadDay(nextDay), 500)
      return data.data
    } catch (err) {
      console.error('Assessment submission failed:', err.message)
      throw err
    }
  }, [user, dayData, activeSkillId, progress, loadDay])

  // ── Groq key ──────────────────────────────────────────────────────────────
  const saveGroqKey = useCallback(async (key) => {
    // Save to backend (encrypted in CSV)
    await api.post('/api/settings/groq-key', { groqKey: key })
    setGroqKeySet(true)
  }, [])

  // ── Sidebar helpers ───────────────────────────────────────────────────────
  const getPendingTasksForSidebar = useCallback(() => {
    if (!dayData || !progress) return []
    const day = dayData.day
    return (dayData.tasks || []).filter(t => !isTaskComplete(progress, day, t.id))
  }, [dayData, progress])

  return (
    <AppContext.Provider value={{
      user, userLoading, loginWithGoogle, logout,
      skills,
      activeSkillId, setActiveSkillId,
      roadmap,
      dayData, dayLoading, activeDay, loadDay,
      progress,
      toggleTask, isTaskDone, isDayComplete,
      submitAssessment,
      groqKeySet, saveGroqKey,
      getPendingTasksForSidebar,
      isDayUnlocked: (day) => isDayUnlocked(progress, day),
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
