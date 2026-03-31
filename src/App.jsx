import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import Dashboard from './pages/Dashboard'
import TaskDetail from './pages/TaskDetail'
import Assessment from './pages/Assessment'
import Roadmap from './pages/Roadmap'
import Settings from './pages/Settings'
import AuthCallback from './pages/AuthCallback'
import { keysConfigured } from './lib/api'

function RequireKeys({ children }) {
  if (!keysConfigured()) return <Navigate to="/settings" replace />
  return children
}

function BottomTabBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const isDetail = location.pathname.startsWith('/task/') || location.pathname === '/assessment' || location.pathname === '/settings' || location.pathname === '/auth/callback'

  const tabs = [
    { path: '/', icon: '⊞', label: 'Today' },
    { path: '/roadmap', icon: '◎', label: 'Roadmap' },
  ]

  if (isDetail) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 lg:hidden z-50"
      style={{
        background: 'rgba(28,28,30,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex">
        {tabs.map(tab => {
          const active = location.pathname === tab.path
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex-1 flex flex-col items-center py-3 gap-1 transition-opacity"
              style={{ opacity: active ? 1 : 0.4 }}
            >
              <span className="text-xl leading-none">{tab.icon}</span>
              <span style={{ color: active ? '#0A84FF' : 'rgba(255,255,255,0.55)', fontSize: '10px', fontWeight: 500 }}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

function DesktopSidebar() {
  const location = useLocation()
  const navigate = useNavigate()

  const tabs = [
    { path: '/', icon: '⊞', label: 'Today' },
    { path: '/roadmap', icon: '◎', label: 'Roadmap' },
  ]

  return (
    <aside
      className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-60 z-40"
      style={{
        background: 'rgba(28,28,30,0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: '#0A84FF', letterSpacing: '-0.3px' }}>
          SkillForge
        </h1>
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>APM Foundations</p>
      </div>
      <nav className="flex-1 px-3 mt-2">
        {tabs.map(tab => {
          const active = location.pathname === tab.path
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all text-left"
              style={{
                background: active ? 'rgba(10,132,255,0.15)' : 'transparent',
                color: active ? '#0A84FF' : 'rgba(255,255,255,0.55)',
              }}
            >
              <span className="text-base w-5 text-center">{tab.icon}</span>
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          )
        })}
      </nav>
      <div className="px-6 pb-8">
        <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.3)' }}>STREAK</p>
          <p className="text-lg font-bold mt-1">🔥 Day 3 of 21</p>
        </div>
      </div>
    </aside>
  )
}

function Layout({ children }) {
  return (
    <div className="min-h-screen" style={{ background: '#000' }}>
      <DesktopSidebar />
      <div className="lg:pl-60">
        <main className="has-tab-bar">
          {children}
        </main>
      </div>
      <BottomTabBar />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/settings" element={<Settings />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/" element={<RequireKeys><Dashboard /></RequireKeys>} />
            <Route path="/task/:id" element={<RequireKeys><TaskDetail /></RequireKeys>} />
            <Route path="/assessment" element={<RequireKeys><Assessment /></RequireKeys>} />
            <Route path="/roadmap" element={<RequireKeys><Roadmap /></RequireKeys>} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AppProvider>
  )
}
