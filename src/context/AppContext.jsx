import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { dayData as initialDayData, mockApi } from '../mockData'
import { auth, tasksApi, settingsApi } from '../api'

// ─── Toggle this to switch between mock and real API ─────────────────────────
const USE_MOCK = true
// ─────────────────────────────────────────────────────────────────────────────

const SKILL_ID = 'apm-foundations'
const CURRENT_DAY = 3

const STORAGE_KEYS = {
  USER: 'sf_user',
  TASKS: 'sf_tasks_d3',
  GROQ_KEY: 'sf_groq_key',
  GROQ_KEY_SET: 'sf_groq_key_set',
  TRACKING: 'sf_tracking',
  PENDING_SKILL: 'sf_pending_skill',
}

const AppContext = createContext(null)

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.TASKS)
    if (saved) return JSON.parse(saved)
  } catch {}
  return initialDayData.tasks
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (!USE_MOCK) return null // loaded async
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER)) } catch { return null }
  })
  // userLoading is only true in real mode while /auth/me is in-flight
  const [userLoading, setUserLoading] = useState(!USE_MOCK)
  const [tasks, setTasks] = useState(loadTasks)
  const [groqKey, setGroqKeyState] = useState(() => localStorage.getItem(STORAGE_KEYS.GROQ_KEY) || '')
  const [groqKeySet, setGroqKeySet] = useState(() =>
    USE_MOCK
      ? !!localStorage.getItem(STORAGE_KEYS.GROQ_KEY)
      : localStorage.getItem(STORAGE_KEYS.GROQ_KEY_SET) === 'true'
  )
  const [isTracking, setIsTracking] = useState(() => localStorage.getItem(STORAGE_KEYS.TRACKING) === 'true')
  const [pendingSkill, setPendingSkillState] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING_SKILL)) } catch { return null }
  })

  // In-flight task IDs — prevents duplicate API calls on rapid clicks
  const pendingTaskIds = useRef(new Set())

  // Real mode: extract OAuth token from URL, then load user via /auth/me
  useEffect(() => {
    if (USE_MOCK) return

    // Handle OAuth callback token in URL
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      auth.handleCallback(token)
      window.history.replaceState({}, '', window.location.pathname)
    }

    const fetchUser = async () => {
      try {
        if (auth.isLoggedIn()) {
          const me = await auth.getMe()
          setUser(me)
          const settings = await settingsApi.get()
          setGroqKeySet(settings.groqKeySet)
        }
      } catch {
        setUser(null)
      } finally {
        setUserLoading(false)
      }
    }
    fetchUser()
  }, [])

  // Persist tasks to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks))
  }, [tasks])

  // Persist groq key (mock mode only — real mode stores server-side)
  const setGroqKey = (key) => {
    setGroqKeyState(key)
    localStorage.setItem(STORAGE_KEYS.GROQ_KEY, key)
    setGroqKeySet(true)
  }

  // Save Groq key — sends to server in real mode, persists locally in mock mode
  const saveGroqKey = async (key) => {
    if (USE_MOCK) {
      setGroqKey(key)
      return
    }
    await settingsApi.saveGroqKey(key)
    // Store only a flag — actual key is server-side, NOT in localStorage
    localStorage.setItem(STORAGE_KEYS.GROQ_KEY_SET, 'true')
    setGroqKeySet(true)
  }

  const loginWithGoogle = () => {
    if (USE_MOCK) {
      const mockUser = {
        name: 'Pranav Vekar',
        email: 'divmaharshi@gmail.com',
        avatar: 'PV',
        uid: 'mock-uid-001',
      }
      setUser(mockUser)
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(mockUser))
    } else {
      auth.loginWithGoogle()
    }
  }

  const logout = () => {
    setUser(null)
    setTasks(initialDayData.tasks)
    setGroqKeyState('')
    setGroqKeySet(false)
    setIsTracking(false)
    setPendingSkillState(null)
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k))
    if (!USE_MOCK) {
      // Defer so React can flush state before the page reloads
      setTimeout(() => auth.logout(), 0)
    }
  }

  // Toggle task — one-way (completed tasks cannot be un-completed)
  // Debounced: rapid clicks on the same task are ignored until the API responds
  const toggleTask = async (id) => {
    if (pendingTaskIds.current.has(id)) return
    const task = tasks.find(t => t.id === id)
    if (!task || task.completed) return // one-way: no un-completing

    pendingTaskIds.current.add(id)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: true } : t))

    try {
      if (USE_MOCK) {
        await mockApi.completeTask(id, SKILL_ID, CURRENT_DAY, task.type)
      } else {
        await tasksApi.complete(id, SKILL_ID, CURRENT_DAY, task.type)
      }
    } catch {
      // Revert on API failure
      setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: false } : t))
    } finally {
      pendingTaskIds.current.delete(id)
    }
  }

  const startTracking = () => {
    setIsTracking(true)
    localStorage.setItem(STORAGE_KEYS.TRACKING, 'true')
  }

  const setPendingSkill = (skill) => {
    setPendingSkillState(skill)
    if (skill) {
      localStorage.setItem(STORAGE_KEYS.PENDING_SKILL, JSON.stringify(skill))
    } else {
      localStorage.removeItem(STORAGE_KEYS.PENDING_SKILL)
    }
  }

  const getCarriedOverTasks = () => tasks.filter(t => !t.completed && t.carriedOver)

  return (
    <AppContext.Provider value={{
      user, userLoading, loginWithGoogle, logout,
      tasks, toggleTask,
      groqKey, setGroqKey, groqKeySet, saveGroqKey,
      isTracking, startTracking,
      pendingSkill, setPendingSkill,
      getCarriedOverTasks,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
