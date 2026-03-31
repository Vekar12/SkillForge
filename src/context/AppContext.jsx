import { createContext, useContext, useState, useEffect } from 'react'
import {
  auth, googleProvider, signInWithPopup, signOut,
  onAuthStateChanged, hasConfig
} from '../firebase'
import {
  getProgress, initProgress, markTaskComplete, markTaskIncomplete,
  isTaskComplete, areDayTasksDone, saveAssessment, isDayUnlocked
} from '../utils/progress'
import { loadSkillsCatalog, loadRoadmap, loadDayData } from '../utils/dataLoader'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userLoading, setUserLoading] = useState(true)
  const [skills, setSkills] = useState([])
  const [activeSkillId, setActiveSkillId] = useState('apm-foundations')
  const [roadmap, setRoadmap] = useState([])
  const [dayData, setDayData] = useState(null)
  const [dayLoading, setDayLoading] = useState(false)
  const [progress, setProgress] = useState(null)
  const [groqKeySet, setGroqKeySet] = useState(() => !!localStorage.getItem('sf_groq_key'))
  const [activeDay, setActiveDay] = useState(1)

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasConfig) {
      // Mock mode — check localStorage
      const stored = localStorage.getItem('sf_user')
      if (stored) {
        try { setUser(JSON.parse(stored)) } catch {}
      }
      setUserLoading(false)
      return
    }

    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const u = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName,
          email: firebaseUser.email,
          avatar: firebaseUser.displayName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U',
          photo: firebaseUser.photoURL,
        }
        setUser(u)
        localStorage.setItem('sf_user', JSON.stringify(u))
      } else {
        setUser(null)
        localStorage.removeItem('sf_user')
      }
      setUserLoading(false)
    })
    return () => unsub()
  }, [])

  const loginWithGoogle = async () => {
    if (!hasConfig) {
      // Mock login
      const mockUser = { uid: 'mock-uid-001', name: 'Pranav Vekar', email: 'divmaharshi@gmail.com', avatar: 'PV', photo: null }
      setUser(mockUser)
      localStorage.setItem('sf_user', JSON.stringify(mockUser))
      return
    }
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      console.error('Login failed', err)
    }
  }

  const logout = async () => {
    if (hasConfig) await signOut(auth)
    setUser(null)
    localStorage.removeItem('sf_user')
  }

  // ── Load skills catalog ───────────────────────────────────────────────────
  useEffect(() => {
    loadSkillsCatalog().then(setSkills).catch(() => setSkills([]))
  }, [])

  // ── Load progress + roadmap + active day when user + skillId set ──────────
  useEffect(() => {
    if (!user || !activeSkillId) return
    const p = initProgress(user.uid, activeSkillId)
    setProgress(p)

    loadRoadmap(activeSkillId).then(rm => {
      setRoadmap(rm)
      // Determine active day: lowest day where not all tasks done
      // We'll refine this after loading day data
    }).catch(() => setRoadmap([]))
  }, [user, activeSkillId])

  // ── Determine active day from progress ───────────────────────────────────
  useEffect(() => {
    if (!user || !progress) return
    // Find the current active day: lowest incomplete day
    // Start from day 1, find first day where tasks aren't all done
    let found = 1
    const completions = progress.taskCompletions || {}
    // We check sequentially — unlock logic: day N open if day N-1 has completions
    for (let d = 1; d <= 21; d++) {
      const dayCompletions = completions[d] || []
      if (dayCompletions.length === 0) { found = d; break }
      found = d + 1
    }
    setActiveDay(Math.min(found, 21))
  }, [progress, user])

  // ── Load day data ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeSkillId || !activeDay) return
    setDayLoading(true)
    loadDayData(activeSkillId, activeDay)
      .then(setDayData)
      .catch(() => setDayData(null))
      .finally(() => setDayLoading(false))
  }, [activeSkillId, activeDay])

  // ── Load a specific day (for review) ─────────────────────────────────────
  const loadDay = async (day) => {
    setDayLoading(true)
    try {
      const data = await loadDayData(activeSkillId, day)
      setDayData(data)
      setActiveDay(day)
    } finally {
      setDayLoading(false)
    }
  }

  // ── Task completion ───────────────────────────────────────────────────────
  const toggleTask = (taskId) => {
    if (!user || !progress || !dayData) return
    const day = dayData.day
    const alreadyDone = isTaskComplete(progress, day, taskId)
    let newProgress
    if (alreadyDone) {
      newProgress = markTaskIncomplete(user.uid, activeSkillId, day, taskId)
    } else {
      newProgress = markTaskComplete(user.uid, activeSkillId, day, taskId)
    }
    setProgress({ ...newProgress })
  }

  const isTaskDone = (taskId) => {
    if (!progress || !dayData) return false
    return isTaskComplete(progress, dayData.day, taskId)
  }

  const isDayComplete = (day) => {
    if (!progress || !dayData) return false
    const tasks = dayData.day === day ? (dayData.tasks || []) : []
    return tasks.length > 0 && areDayTasksDone(progress, day, tasks)
  }

  const isCurrentDayUnlocked = (day) => {
    if (day === 1) return true
    return (progress?.taskCompletions?.[day - 1]?.length || 0) > 0
  }

  // ── Assessment ────────────────────────────────────────────────────────────
  const submitAssessment = (result) => {
    if (!user || !dayData) return
    const newProgress = saveAssessment(user.uid, activeSkillId, dayData.day, result)
    setProgress({ ...newProgress })
    // Advance to next day
    const nextDay = dayData.day + 1
    if (nextDay <= 21) {
      setTimeout(() => loadDay(nextDay), 500)
    }
  }

  // ── Groq key ──────────────────────────────────────────────────────────────
  const saveGroqKey = (key) => {
    localStorage.setItem('sf_groq_key', key)
    setGroqKeySet(true)
  }

  const getGroqKey = () => localStorage.getItem('sf_groq_key') || ''

  // ── Tasks for sidebar (current day tasks with completion state) ───────────
  const getPendingTasksForSidebar = () => {
    if (!dayData || !progress) return []
    return (dayData.tasks || []).filter(t => !isTaskComplete(progress, dayData.day, t.id))
  }

  return (
    <AppContext.Provider value={{
      user, userLoading, loginWithGoogle, logout,
      skills,
      activeSkillId, setActiveSkillId,
      roadmap,
      dayData, dayLoading, activeDay, loadDay,
      progress,
      toggleTask, isTaskDone, isDayComplete, isCurrentDayUnlocked,
      submitAssessment,
      groqKeySet, saveGroqKey, getGroqKey,
      getPendingTasksForSidebar,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
