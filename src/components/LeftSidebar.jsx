// LeftSidebar — visible on lg (1024px+) desktops as the primary nav panel.
// On mobile/tablet the BottomTabBar handles navigation instead (xl:hidden).
// This sidebar is always rendered inside the layout but hidden below lg via
// "hidden lg:flex" so no JS visibility toggling is needed.

import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { currentDay, roadmapDays } from '../mockData'

const NAV_ITEMS = [
  { path: '/skills', icon: '⊞', label: 'Skills' },
  { path: '/',      icon: '☀', label: 'Today'  },
  { path: '/roadmap', icon: '◎', label: 'Roadmap' },
]

export default function LeftSidebar() {
  const location  = useLocation()
  const navigate  = useNavigate()
  const { tasks } = useApp()

  // Derive quick-glance stats shown below nav
  const completedCount = tasks.filter(t => t.completed).length
  const totalTasks     = tasks.length
  const todayDone      = completedCount === totalTasks && totalTasks > 0

  const completedDays  = roadmapDays.filter(d => d.completed).length
  const overallPct     = Math.round((completedDays / roadmapDays.length) * 100)

  return (
    <aside
      // Hidden on mobile — lg:flex shows it at 1024px+.
      // w-52 keeps it narrow so the main content still has plenty of room.
      className="hidden lg:flex flex-col w-52 flex-shrink-0"
      style={{
        borderRight:  '1px solid var(--border-2)',
        background:   '#000',
        overflowY:    'auto',
        // Stretch from below the fixed header (pt-14 handled by parent) to bottom
        minHeight:    '100%',
      }}
    >
      <div className="p-4 flex flex-col gap-6 flex-1">

        {/* ── Primary navigation ── */}
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ path, icon, label }) => {
            const active = location.pathname === path
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
                style={{
                  // Highlight active route with a subtle blue tint; others are
                  // dimmed to avoid visual competition with the main content.
                  background: active ? 'rgba(10,132,255,0.12)' : 'transparent',
                  color:      active ? '#0A84FF' : 'var(--text-2)',
                  border:     active ? '1px solid rgba(10,132,255,0.2)' : '1px solid transparent',
                  cursor:     'pointer',
                }}
              >
                <span className="text-base leading-none">{icon}</span>
                {label}
              </button>
            )
          })}
        </nav>

        {/* ── Divider ── */}
        <div style={{ borderTop: '1px solid var(--border-2)' }} />

        {/* ── Today's progress snapshot ── */}
        <div>
          <p
            className="text-xs font-bold mb-2"
            style={{ color: 'var(--text-5)', letterSpacing: '0.1em' }}
          >
            TODAY
          </p>

          <div
            className="rounded-xl p-3"
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border-2)' }}
          >
            {/* Task completion line */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs" style={{ color: 'var(--text-2)' }}>
                Tasks
              </span>
              <span
                className="text-xs font-semibold"
                style={{ color: todayDone ? '#30D158' : '#0A84FF' }}
              >
                {completedCount}/{totalTasks}
              </span>
            </div>

            {/* Linear progress bar */}
            <div
              className="rounded-full h-1 overflow-hidden"
              style={{ background: 'var(--border-2)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width:      `${totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0}%`,
                  background: todayDone ? '#30D158' : '#0A84FF',
                }}
              />
            </div>

            {todayDone && (
              // All-done celebration line — only shows when every task is ticked
              <p className="text-xs mt-2" style={{ color: '#30D158' }}>
                ✓ All done!
              </p>
            )}
          </div>
        </div>

        {/* ── Overall roadmap progress ── */}
        <div>
          <p
            className="text-xs font-bold mb-2"
            style={{ color: 'var(--text-5)', letterSpacing: '0.1em' }}
          >
            ROADMAP
          </p>

          <div
            className="rounded-xl p-3"
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border-2)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs" style={{ color: 'var(--text-2)' }}>
                Day {currentDay} of {roadmapDays.length}
              </span>
              <span className="text-xs font-semibold" style={{ color: '#0A84FF' }}>
                {overallPct}%
              </span>
            </div>

            {/* Overall progress bar */}
            <div
              className="rounded-full h-1 overflow-hidden"
              style={{ background: 'var(--border-2)' }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width:      `${overallPct}%`,
                  background: 'linear-gradient(90deg, #0A84FF, #30D158)',
                }}
              />
            </div>
          </div>
        </div>

      </div>
    </aside>
  )
}
