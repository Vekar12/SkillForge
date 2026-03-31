import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { roadmapDays, currentDay, skillsCatalog } from '../mockData'

export default function RightSidebar() {
  const navigate = useNavigate()
  const { tasks, groqKey } = useApp()

  const pendingTasks = tasks.filter(t => !t.completed)
  const completedCount = tasks.filter(t => t.completed).length
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

  const upcomingDays = roadmapDays.filter(d => !d.completed && d.day !== currentDay).slice(0, 3)

  const TYPE_ICONS = { read: '📖', search: '🔍', activity: '⚡' }

  return (
    <aside
      className="hidden xl:flex flex-col w-72 flex-shrink-0"
      style={{
        borderLeft: '1px solid rgba(255,255,255,0.05)',
        background: '#000',
        overflowY: 'auto',
      }}
    >
      <div className="p-5 space-y-5">

        {/* Today's progress */}
        <div>
          <p className="text-xs font-bold tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
            TODAY'S PROGRESS
          </p>
          <div className="rounded-2xl p-4" style={{ background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">{completedCount}/{tasks.length} tasks</span>
              <span className="text-sm font-bold" style={{ color: '#0A84FF' }}>{progress}%</span>
            </div>
            {/* Progress ring placeholder — linear bar */}
            <div className="rounded-full h-1.5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #0A84FF, #30D158)' }}
              />
            </div>
            {pendingTasks.length > 0 && (
              <div className="mt-3 space-y-2">
                {pendingTasks.map(t => (
                  <button
                    key={t.id}
                    onClick={() => navigate(`/task/${t.id}`)}
                    className="w-full flex items-center gap-2 text-left transition-opacity hover:opacity-70"
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <span className="text-xs">{TYPE_ICONS[t.type]}</span>
                    <span className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>{t.title || t.keyword}</span>
                  </button>
                ))}
              </div>
            )}
            {pendingTasks.length === 0 && (
              <p className="text-xs mt-2" style={{ color: '#30D158' }}>✓ All tasks done!</p>
            )}
          </div>
        </div>

        {/* Enrolled Skills */}
        <div>
          <p className="text-xs font-bold tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
            YOUR SKILLS
          </p>
          <div className="space-y-2">
            {skillsCatalog.map(skill => {
              const skillProgress = skill.currentDay > 0 ? Math.round(((skill.currentDay - 1) / skill.totalDays) * 100) : 0
              return (
                <div key={skill.id} className="rounded-xl p-3" style={{ background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span>{skill.icon}</span>
                    <span className="text-xs font-semibold truncate">{skill.title}</span>
                  </div>
                  <div className="rounded-full h-1 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full" style={{ width: `${skillProgress}%`, background: skill.color }} />
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    {skill.currentDay > 0 ? `Day ${skill.currentDay} of ${skill.totalDays}` : 'Not started'}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Coming up */}
        <div>
          <p className="text-xs font-bold tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
            COMING UP
          </p>
          <div className="space-y-2">
            {upcomingDays.map(day => (
              <div key={day.day} className="rounded-xl p-3" style={{ background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.3)' }}>Day {day.day}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>{day.theme}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Groq key warning */}
        {!groqKey && (
          <div className="rounded-xl p-3" style={{ background: 'rgba(255,159,10,0.08)', border: '1px solid rgba(255,159,10,0.15)' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: '#FF9F0A' }}>⚠ No Groq Key</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Assessment scoring requires a Groq API key. Add it via the header.
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}
