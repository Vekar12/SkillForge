import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const NAV_ITEMS = [
  { path: '/skills', icon: '⊞', label: 'Skills' },
  { path: '/',      icon: '☀', label: 'Today'  },
  { path: '/roadmap', icon: '◎', label: 'Roadmap' },
]

export default function LeftSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { dayData, progress, activeDay, activeSkillId, skills, toggleTheme, theme } = useApp()

  const tasks = dayData?.tasks || []
  const doneCount = tasks.filter(t => progress?.taskCompletions?.[activeDay]?.includes(t.id)).length
  const totalTasks = tasks.length
  const todayDone = totalTasks > 0 && doneCount === totalTasks

  const activeSkill = skills.find(s => s.id === activeSkillId)
  const totalDays = activeSkill?.totalDays || 21
  const overallPct = Math.round(((activeDay - 1) / totalDays) * 100)

  return (
    <aside
      className="hidden lg:flex flex-col w-52 flex-shrink-0"
      style={{
        borderRight: '1px solid var(--border-2)',
        background: 'var(--surface-2)',
        overflowY: 'auto',
        minHeight: '100%',
      }}
    >
      <div className="p-4 flex flex-col gap-6 flex-1">

        {/* Primary navigation */}
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ path, icon, label }) => {
            const active = location.pathname === path
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
                style={{
                  background: active ? 'rgba(99,102,241,0.12)' : 'transparent',
                  color: active ? 'var(--blue)' : 'var(--text-2)',
                  border: active ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
                  cursor: 'pointer',
                }}
              >
                <span className="text-base leading-none">{icon}</span>
                {label}
              </button>
            )
          })}
        </nav>

        <div style={{ borderTop: '1px solid var(--border-2)' }} />

        {/* Today's progress */}
        <div>
          <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-4)', letterSpacing: '0.1em' }}>TODAY</p>
          <div className="rounded-xl p-3" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-2)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs" style={{ color: 'var(--text-3)' }}>Tasks</span>
              <span className="text-xs font-semibold" style={{ color: todayDone ? 'var(--green)' : 'var(--blue)' }}>
                {doneCount}/{totalTasks}
              </span>
            </div>
            <div className="rounded-full h-1 overflow-hidden" style={{ background: 'var(--border-2)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0}%`,
                  background: todayDone ? 'var(--green)' : 'var(--blue)',
                }}
              />
            </div>
            {todayDone && <p className="text-xs mt-2" style={{ color: 'var(--green)' }}>✓ All done!</p>}
          </div>
        </div>

        {/* Roadmap progress */}
        <div>
          <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-4)', letterSpacing: '0.1em' }}>ROADMAP</p>
          <div className="rounded-xl p-3" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-2)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs" style={{ color: 'var(--text-3)' }}>Day {activeDay} of {totalDays}</span>
              <span className="text-xs font-semibold" style={{ color: 'var(--blue)' }}>{overallPct}%</span>
            </div>
            <div className="rounded-full h-1 overflow-hidden" style={{ background: 'var(--border-2)' }}>
              <div className="h-full rounded-full" style={{ width: `${overallPct}%`, background: 'linear-gradient(90deg, var(--blue), var(--green))' }} />
            </div>
          </div>
        </div>

        {/* Theme toggle at bottom */}
        <div className="mt-auto">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all hover:opacity-80"
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border-2)', color: 'var(--text-3)', cursor: 'pointer' }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>
        </div>

      </div>
    </aside>
  )
}
