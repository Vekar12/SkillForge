import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { getProgress } from '../utils/progress'

export default function RightSidebar() {
  const navigate = useNavigate()
  const { getPendingTasksForSidebar, skills, groqKeySet, activeSkillId, setActiveSkillId, user } = useApp()

  const pendingTasks = getPendingTasksForSidebar()
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
            TODAY'S TASKS
          </p>
          <div className="rounded-2xl p-4" style={{ background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.06)' }}>
            {pendingTasks.length > 0 ? (
              <div className="space-y-2">
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
            ) : (
              <p className="text-xs" style={{ color: '#30D158' }}>✓ All tasks done!</p>
            )}
          </div>
        </div>

        {/* Enrolled Skills */}
        <div>
          <p className="text-xs font-bold tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
            YOUR SKILLS
          </p>
          <div className="space-y-2">
            {skills.filter(s => s.enrolled).map(skill => {
              const skillProgressData = getProgress(user?.uid, skill.id)
              const skillCurrentDay = skillProgressData?.currentDay || 1
              const skillPct = Math.round(((skillCurrentDay - 1) / skill.totalDays) * 100)
              return (
                <button
                  key={skill.id}
                  onClick={() => { setActiveSkillId(skill.id); navigate('/') }}
                  className="w-full rounded-xl p-3 text-left transition-all hover:opacity-80"
                  style={{ background: '#1C1C1E', border: `1px solid ${activeSkillId === skill.id ? skill.color + '40' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer' }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span>{skill.icon}</span>
                    <span className="text-xs font-semibold truncate">{skill.title}</span>
                  </div>
                  <div className="rounded-full h-1 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full" style={{ width: `${skillPct}%`, background: skill.color }} />
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    Day {skillCurrentDay} of {skill.totalDays}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Groq key warning */}
        {!groqKeySet && (
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
