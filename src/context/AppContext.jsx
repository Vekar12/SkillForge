import { createContext, useContext, useState, useEffect } from 'react'
import { dayData as initialDayData, mockApi } from '../mockData'
import { auth, tasksApi, settingsApi } from '../api'

// ─── Toggle this to switch between mock and real API ─────────────────────────
const USE_MOCK = true
// ─────────────────────────────────────────────────────────────────────────────

const AppContext = createContext(null)
const SKILL_ID = 'apm-foundations'
const CURRENT_DAY = 3

function loadTasks() {
  try {
    const saved = localStorage.getItem('sf_tasks_d3')
    if (saved) return JSON.parse(saved)
  } catch {}
  return initialDayData.tasks
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userLoading, setUserLoading] = useState(true)
  const [tasks, setTasks] = useState(loadTasks)
  const [groqKeySet, setGroqKeySet] = useState(false)
  const [isTracking, setIsTracking] = useState(() => localStorage.getItem('sf_tracking') === 'true')

  // Handle OAuth callback — read ?token= from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      if (!USE_MOCK) auth.handleCallback(token)
      // Remove token from URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  // Load user on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Check if we have a stored mock user (for mock mode persistence)
        if (USE_MOCK) {
          const stored = localStorage.getItem('sf_user')
          if (stored) {
            setUser(JSON.parse(stored))
          }
        } else {
          if (auth.isLoggedIn()) {
            const me = await auth.getMe()
            setUser(me)
          }
        }
      } catch {
        setUser(null)
      } finally {
        setUserLoading(false)
      }
    }
    fetchUser()
  }, [])

  // Load groq key status from server
  useEffect(() => {
    if (!user) return
    const fetchSettings = async () => {
      try {
        const settings = USE_MOCK
          ? await mockApi.getSettings()
          : await settingsApi.get()
        setGroqKeySet(settings.groqKeySet)
      } catch {}
    }
    fetchSettings()
  }, [user])

  // Persist tasks locally (cache)
  useEffect(() => {
    localStorage.setItem('sf_tasks_d3', JSON.stringify(tasks))
  }, [tasks])

  const loginWithGoogle = () => {
    if (USE_MOCK) {
      const mockUser = { name: 'Pranav Vekar', email: 'divmaharshi@gmail.com', avatar: 'PV', uid: 'mock-uid-001', isAdmin: false }
      setUser(mockUser)
      localStorage.setItem('sf_user', JSON.stringify(mockUser))
    } else {
      auth.loginWithGoogle()
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('sf_user')
    if (!USE_MOCK) auth.logout()
  }

  const toggleTask = async (id) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t))

    // API call
    try {
      if (!task.completed) {
        // Marking as complete
        USE_MOCK
          ? await mockApi.completeTask(id, SKILL_ID, CURRENT_DAY, task.type)
          : await tasksApi.complete(id, SKILL_ID, CURRENT_DAY, task.type)
      }
    } catch {
      // Revert on failure
      setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: task.completed } : t))
    }
  }

  const saveGroqKey = async (key) => {
    try {
      USE_MOCK
        ? await mockApi.saveGroqKey(key)
        : await settingsApi.saveGroqKey(key)
      setGroqKeySet(true)
    } catch {
      throw new Error('Failed to save Groq key')
    }
  }

  const startTracking = () => {
    setIsTracking(true)
    localStorage.setItem('sf_tracking', 'true')
  }

  return (
    <AppContext.Provider value={{
      user, userLoading, loginWithGoogle, logout,
      tasks, toggleTask,
      groqKeySet, saveGroqKey,
      isTracking, startTracking,
      skillId: SKILL_ID,
      currentDay: CURRENT_DAY,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
