import { createContext, useContext, useState, useEffect } from 'react'
import { dayData as initialDayData } from '../mockData'

const AppContext = createContext(null)

const STORAGE_KEYS = {
  USER: 'sf_user',
  TASKS: 'sf_tasks_d3',
  GROQ_KEY: 'sf_groq_key',
  TRACKING: 'sf_tracking',
  ONBOARDED: 'sf_onboarded',
}

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.TASKS)
    if (saved) return JSON.parse(saved)
  } catch {}
  return initialDayData.tasks
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER)) } catch { return null }
  })
  const [tasks, setTasks] = useState(loadTasks)
  const [groqKey, setGroqKeyState] = useState(() => localStorage.getItem(STORAGE_KEYS.GROQ_KEY) || '')
  const [isTracking, setIsTracking] = useState(() => localStorage.getItem(STORAGE_KEYS.TRACKING) === 'true')
  const [pendingSkill, setPendingSkill] = useState(null)

  // Persist tasks
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks))
  }, [tasks])

  // Persist groq key
  const setGroqKey = (key) => {
    setGroqKeyState(key)
    localStorage.setItem(STORAGE_KEYS.GROQ_KEY, key)
  }

  // Mock Google login
  const loginWithGoogle = () => {
    const mockUser = {
      name: 'Pranav Vekar',
      email: 'divmaharshi@gmail.com',
      avatar: 'PV',
      uid: 'mock-uid-001',
    }
    setUser(mockUser)
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(mockUser))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEYS.USER)
  }

  const toggleTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  }

  const startTracking = () => {
    setIsTracking(true)
    localStorage.setItem(STORAGE_KEYS.TRACKING, 'true')
  }

  // Carry-over: tasks not completed from previous days get a carriedOver flag
  const getCarriedOverTasks = () => tasks.filter(t => !t.completed && t.carriedOver)

  return (
    <AppContext.Provider value={{
      user, loginWithGoogle, logout,
      tasks, toggleTask,
      groqKey, setGroqKey,
      isTracking, startTracking,
      pendingSkill, setPendingSkill,
      getCarriedOverTasks,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
