import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import {
  initProgress, markTaskComplete, markTaskIncomplete,
  isTaskComplete, areDayTasksDone, saveAssessment,
} from '../utils/progress'
import { loadSkillsCatalog, loadRoadmap, loadDayData } from '../utils/dataLoader'
import { githubEnabled, syncUser, loadProgress, saveProgressDebounced } from '../utils/githubStorage'

const AppContext = createContext(null)

// ── Remedial task builder ─────────────────────────────────────────────────────
function buildRemedialTask(prevDay, theme, assessment) {
  const prompt = `You are a PM coach. A student studied "${theme}" and scored ${assessment.score ?? '?'}/10 on their assessment.

Gaps identified:
- Needs correction: ${assessment.needsCorrection || 'General review needed'}
- Blind spots: ${assessment.blindSpots || 'None identified'}
- Open questions: ${assessment.openPoints || 'None'}

Please explain the weak concepts clearly and simply, as if teaching them for the first time. Focus only on the gaps listed above. Use plain language, concrete examples from Indian startup contexts where possible, and keep it under 400 words. Do not ask questions — just explain.`

  return {
    id: `remedial-day-${prevDay}`,
    type: 'revisit',
    isRemedial: true,
    title: `Revisit: ${theme}`,
    promptTitle: `Revisit: ${theme}`,
    minutes: 20,
    claudePrompt: prompt,
  }
}

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
  const progressRef                       = useRef(null)
  const roadmapRef                        = useRef([])
  const [groqKeySet, setGroqKeySet]       = useState(() => !!localStorage.getItem('sf_groq_key'))
  const [theme, setTheme]                 = useState(() => localStorage.getItem('sf_theme') || 'dark')
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
      const demoUser = { uid: 'demo-uid-001', name: 'Demo User', email: 'demo@example.com', photo: null, avatar: 'DU', token: null }
      setUser(demoUser)
      syncUser(demoUser).catch(() => {})
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
    syncUser(u).catch(err => console.warn('syncUser failed:', err.message))
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('sf_token')
    setUser(null); setProgress(null); setDayData(null)
  }, [])

  // ── Theme ────────────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('sf_theme', theme)
  }, [theme])

  const toggleTheme = useCallback(() => setTheme(t => t === 'dark' ? 'light' : 'dark'), [])

  // ── Skills catalog ────────────────────────────────────────────────────────
  useEffect(() => {
    loadSkillsCatalog().then(setSkills).catch(() => setSkills([]))
  }, [])

  // ── Progress + roadmap ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !activeSkillId) return
    setGroqKeySet(!!localStorage.getItem('sf_groq_key'))
    loadRoadmap(activeSkillId).then(data => setRoadmap(data.days || [])).catch(() => setRoadmap([]))

    // Try GitHub first, fall back to localStorage
    const initLocal = () => {
      const p = initProgress(user.uid, activeSkillId)
      setProgress(p)
      setActiveDay(Math.min(p.currentDay || 1, 21))
    }

    if (githubEnabled()) {
      loadProgress(user.uid, activeSkillId).then(remote => {
        if (remote) {
          // Merge remote into localStorage so utils still work
          localStorage.setItem(`sf_progress_${user.uid}_${activeSkillId}`, JSON.stringify(remote))
        }
        initLocal()
      }).catch(initLocal)
    } else {
      initLocal()
    }
  }, [user, activeSkillId])

  // ── Keep refs in sync so loadDay always reads latest values ─────────────
  useEffect(() => { progressRef.current = progress }, [progress])
  useEffect(() => { roadmapRef.current = roadmap }, [roadmap])

  // ── Active day from progress.currentDay ───────────────────────────────────
  useEffect(() => {
    if (!progress) return
    setActiveDay(Math.min(progress.currentDay || 1, 21))
  }, [progress])

  // ── Load a specific day for viewing ──────────────────────────────────────
  const loadDay = useCallback(async (day) => {
    setDayLoading(true)
    try {
      const d = await loadDayData(activeSkillId, day)

      // Use refs to always access latest progress/roadmap — avoids stale closure
      const p = progressRef.current
      const rm = roadmapRef.current
      if (day > 1 && p) {
        const prevAssessment = p.assessments?.[day - 1]
        if (prevAssessment?.competencyLevel === 'Needs Focus') {
          const remedialId = `remedial-day-${day - 1}`
          const alreadyDone = isTaskComplete(p, day, remedialId)
          const alreadyInjected = d.tasks?.some(t => t.id === remedialId)
          if (!alreadyDone && !alreadyInjected) {
            const prevDayInfo = rm.find(r => r.day === day - 1)
            const remedialTask = buildRemedialTask(day - 1, prevDayInfo?.theme || `Day ${day - 1}`, prevAssessment)
            d.tasks = [remedialTask, ...(d.tasks || [])]
          }
        }
      }

      setDayData(d)
    } catch {
      setDayData(null)
    } finally {
      setDayLoading(false)
    }
  }, [activeSkillId]) // refs are stable — no need to list progress/roadmap here

  // ── Load day data when activeDay changes ──────────────────────────────────
  useEffect(() => {
    if (!activeSkillId || !activeDay) return
    loadDay(activeDay)
  }, [activeSkillId, activeDay]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Snap back to current active day ──────────────────────────────────────
  const resetToActiveDay = useCallback(() => {
    loadDay(activeDay)
  }, [activeDay, loadDay])

  // ── Reset a skill back to Day 1 ───────────────────────────────────────────
  const resetSkill = useCallback((skillId) => {
    if (!user) return
    localStorage.removeItem(`sf_progress_${user.uid}_${skillId}`)
    const fresh = initProgress(user.uid, skillId)
    if (skillId === activeSkillId) {
      setProgress({ ...fresh })
      setActiveDay(1)
    }
    saveProgressDebounced(user.uid, skillId, fresh, 0)
  }, [user, activeSkillId])

  // ── Task toggle ───────────────────────────────────────────────────────────
  const toggleTask = useCallback((taskId) => {
    if (!user || !progress || !dayData) return
    const day = dayData.day
    const alreadyDone = isTaskComplete(progress, day, taskId)
    const newProgress = alreadyDone
      ? markTaskIncomplete(user.uid, activeSkillId, day, taskId)
      : markTaskComplete(user.uid, activeSkillId, day, taskId)
    setProgress({ ...newProgress })
    saveProgressDebounced(user.uid, activeSkillId, newProgress)
  }, [user, progress, dayData, activeSkillId])

  const isTaskDone = useCallback((taskId) => {
    if (!progress || !dayData) return false
    return isTaskComplete(progress, dayData.day, taskId)
  }, [progress, dayData])

  const isDayComplete = useCallback((day) => {
    if (!progress) return false
    // Assessment submission is the authoritative day-completion signal;
    // works for any day without needing its task list loaded.
    return !!progress.assessments?.[day]
  }, [progress])

  // ── Assessment ────────────────────────────────────────────────────────────
  const submitAssessment = useCallback((result) => {
    if (!user || !dayData) {
      console.error('submitAssessment: user or dayData not ready')
      return
    }
    const newProgress = saveAssessment(user.uid, activeSkillId, dayData.day, result)
    setProgress({ ...newProgress })
    saveProgressDebounced(user.uid, activeSkillId, newProgress, 0)  // immediate for assessments
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
      theme, toggleTheme,
      getPendingTasksForSidebar,
      resetSkill,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
