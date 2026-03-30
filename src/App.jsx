import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import TaskDetail from './pages/TaskDetail'
import Assessment from './pages/Assessment'
import Roadmap from './pages/Roadmap'
import Settings from './pages/Settings'
import { keysConfigured } from './lib/api'

function RequireKeys({ children }) {
  if (!keysConfigured()) return <Navigate to="/settings" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen" style={{ backgroundColor: '#0F0F0F', color: '#F9FAFB', fontFamily: 'Inter, sans-serif' }}>
        <Routes>
          <Route path="/settings" element={<Settings />} />
          <Route path="/" element={<RequireKeys><Dashboard /></RequireKeys>} />
          <Route path="/task/:id" element={<RequireKeys><TaskDetail /></RequireKeys>} />
          <Route path="/assessment" element={<RequireKeys><Assessment /></RequireKeys>} />
          <Route path="/roadmap" element={<RequireKeys><Roadmap /></RequireKeys>} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
