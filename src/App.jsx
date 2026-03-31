import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import Header from './components/Header'
import Footer from './components/Footer'
import RightSidebar from './components/RightSidebar'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback'
import Settings from './pages/Settings'
import SkillsDashboard from './pages/SkillsDashboard'
import Dashboard from './pages/Dashboard'
import TaskDetail from './pages/TaskDetail'
import Assessment from './pages/Assessment'
import Roadmap from './pages/Roadmap'

function ProtectedRoute({ children }) {
  const { user, userLoading } = useApp()
  if (userLoading) return null
  if (!user) return <Navigate to="/login" replace />
  return children
}

function BottomTabBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const isDetail = location.pathname.startsWith('/task/') || location.pathname === '/assessment' || location.pathname === '/login' || location.pathname === '/auth/callback' || location.pathname === '/settings'
  const { user } = useApp()

  if (!user || isDetail) return null

  const tabs = [
    { path: '/skills', icon: '⊞', label: 'Skills' },
    { path: '/', icon: '☀', label: 'Today' },
    { path: '/roadmap', icon: '◎', label: 'Roadmap' },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 xl:hidden z-50"
      style={{
        background: 'rgba(0,0,0,0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex max-w-sm mx-auto">
        {tabs.map(tab => {
          const active = location.pathname === tab.path
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex-1 flex flex-col items-center py-3 gap-0.5 transition-all"
              style={{ opacity: active ? 1 : 0.4, border: 'none', background: 'transparent', cursor: 'pointer' }}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              <span style={{ fontSize: '10px', fontWeight: 600, color: active ? '#0A84FF' : 'rgba(255,255,255,0.55)' }}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

function AppLayout() {
  const { user } = useApp()
  const location = useLocation()
  const isLogin = location.pathname === '/login'

  if (isLogin) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  const showRightSidebar = location.pathname === '/' || location.pathname === '/roadmap'

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#000' }}>
      <Header />
      <div className="flex flex-1 pt-14">
        {/* Main content */}
        <div className="flex-1 flex min-w-0">
          <div className="flex-1 min-w-0 overflow-y-auto pb-20 xl:pb-0">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/skills" element={<ProtectedRoute><SkillsDashboard /></ProtectedRoute>} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/task/:id" element={<ProtectedRoute><TaskDetail /></ProtectedRoute>} />
              <Route path="/assessment" element={<ProtectedRoute><Assessment /></ProtectedRoute>} />
              <Route path="/roadmap" element={<ProtectedRoute><Roadmap /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to={user ? '/skills' : '/login'} replace />} />
            </Routes>
          </div>
          {/* Right sidebar — only on today/roadmap */}
          {showRightSidebar && <RightSidebar />}
        </div>
      </div>
      <Footer />
      <BottomTabBar />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AppProvider>
  )
}
