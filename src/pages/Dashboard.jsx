import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const TYPE_CONFIG = {
  read: { icon: '📖', label: 'READ', color: '#0A84FF' },
  search: { icon: '🔍', label: 'SEARCH', color: '#30D158' },
  activity: { icon: '⚡', label: 'ACTIVITY', color: '#BF5AF2' },
}

function Badge({ children, color }) {
  return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold" style={{ color, background: color + '20' }}>{children}</span>
}

function TaskCard({ task, onToggle, isLocked, isDone }) {
  const navigate = useNavigate()
  const cfg = TYPE_CONFIG[task.type]
  return (
    <div className="rounded-2xl p-4 transition-all"
      style={{ background: '#1C1C1E', border: `1px solid ${task.carriedOver ? 'rgba(255,159,10,0.2)' : 'rgba(255,255,255,0.06)'}`, opacity: isLocked ? 0.35 : 1, cursor: isLocked ? 'not-allowed' : 'pointer' }}
      onClick={() => !isLocked && navigate(`/task/${task.id}`)}>
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
          style={{ borderColor: isDone ? cfg.color : 'rgba(255,255,255,0.2)', background: isDone ? cfg.color : 'transparent', cursor: isLocked ? 'not-allowed' : 'pointer' }}
          onClick={e => { e.stopPropagation(); if (!isLocked) onToggle(task.id) }}>
          {isDone && <svg width="12" height="9" viewBox="0 0 12 9" fill="none"><path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span style={{ fontSize: '13px' }}>{cfg.icon}</span>
            <span className="text-xs font-bold tracking-wider" style={{ color: cfg.color, letterSpacing: '0.08em' }}>{cfg.label}</span>
            {task.carriedOver && <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(255,159,10,0.12)', color: '#FF9F0A' }}>Carried Over</span>}
            {isLocked && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>🔒</span>}
          </div>
          <p className="text-sm font-medium leading-snug" style={{ color: isDone ? 'rgba(255,255,255,0.3)' : '#fff', textDecoration: isDone ? 'line-through' : 'none' }}>
            {task.title || task.keyword || task.promptTitle}
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{task.minutes}m</span>
          {!isLocked && !isDone && <div className="mt-1"><span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>›</span></div>}
        </div>
      </div>
    </div>
  )
}

function BonusCard({ task }) {
  const navigate = useNavigate()
  const cfg = TYPE_CONFIG[task.type] || TYPE_CONFIG.read
  return (
    <div className="rounded-2xl p-4 cursor-pointer transition-all" style={{ background: '#1C1C1E', border: '1px solid rgba(255,159,10,0.1)' }} onClick={() => navigate(`/task/${task.id}`)}>
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span style={{ fontSize: '13px' }}>{cfg.icon}</span>
            <span className="text-xs font-bold tracking-wider" style={{ color: cfg.color, letterSpacing: '0.08em' }}>{cfg.label}</span>
            <Badge color="#FF9F0A">BONUS</Badge>
          </div>
          <p className="text-sm font-medium" style={{ color: '#fff' }}>{task.title}</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{task.minutes} min</p>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>›</span>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { dayData, dayLoading, toggleTask, isTaskDone, activeDay, progress, roadmap } = useApp()
  const navigate = useNavigate()
  const [bonusExpanded, setBonusExpanded] = useState(false)
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  if (dayLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-4" style={{ borderColor: '#0A84FF', borderTopColor: 'transparent' }} />
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Loading today's content...</p>
        </div>
      </div>
    )
  }

  if (!dayData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>Could not load day content.</p>
          <button onClick={() => window.location.reload()} className="text-sm px-4 py-2 rounded-xl" style={{ background: '#0A84FF', color: '#fff', border: 'none', cursor: 'pointer' }}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  const tasks = dayData.tasks || []
  const bonusTasks = dayData.bonusTasks || []

  const readsDone = tasks.filter(t => t.type === 'read' && isTaskDone(t.id)).length
  const totalReads = tasks.filter(t => t.type === 'read').length
  const allReadAndSearchDone = tasks.filter(t => (t.type === 'read' || t.type === 'search') && !isTaskDone(t.id)).length === 0
  const allDone = tasks.every(t => isTaskDone(t.id))
  const doneCount = tasks.filter(t => isTaskDone(t.id)).length
  const remainingCount = tasks.filter(t => !isTaskDone(t.id)).length
  const totalDays = roadmap?.totalDays || 21
  const progress_pct = Math.round(((activeDay - 1) / totalDays) * 100)

  const isLocked = (task) => {
    if (task.type === 'read') return false
    if (task.type === 'search') return readsDone === 0
    if (task.type === 'activity') return !allReadAndSearchDone
    return false
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto lg:px-8 lg:py-10">
      <div className="flex items-center justify-between mb-6 xl:hidden">
        <div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{today}</p>
          <p className="text-lg font-bold" style={{ letterSpacing: '-0.3px' }}>🔥 Day {activeDay} of 21</p>
        </div>
        <Link to="/skills" className="text-xs font-medium transition-opacity hover:opacity-70" style={{ color: '#0A84FF' }}>All Skills</Link>
      </div>

      <div className="hidden xl:block mb-8">
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{today}</p>
        <h2 className="text-3xl font-bold mt-1" style={{ letterSpacing: '-0.5px' }}>Today's Work</h2>
      </div>

      {/* Challenge Card */}
      <div className="rounded-2xl p-5 mb-4" style={{ background: 'linear-gradient(135deg, #0A84FF18 0%, #BF5AF218 100%)', border: '1px solid rgba(10,132,255,0.2)' }}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs font-bold tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>APM FOUNDATIONS</p>
            <h2 className="text-lg font-bold leading-tight" style={{ letterSpacing: '-0.2px' }}>Day {dayData.day}: {dayData.theme}</h2>
          </div>
          <Link to="/roadmap" className="text-xs font-medium transition-opacity hover:opacity-70 flex-shrink-0 ml-3" style={{ color: '#0A84FF' }}>Roadmap ›</Link>
        </div>
        <div className="rounded-full h-1.5 mb-4 overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress_pct}%`, background: 'linear-gradient(90deg, #0A84FF, #BF5AF2)' }} />
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {(dayData.competenciesCovered || []).map(c => <Badge key={c} color="#0A84FF">{c}</Badge>)}
        </div>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{dayData.teamContext}</p>
      </div>

      {/* Anchor */}
      {dayData.realWorldAnchor && (
        <div className="rounded-2xl p-4 mb-6" style={{ background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs font-bold tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>TODAY'S ANCHOR</p>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>
            <span className="font-semibold" style={{ color: '#0A84FF' }}>{dayData.realWorldAnchor.company}</span>
            {' — '}{dayData.realWorldAnchor.example}
          </p>
        </div>
      )}

      {/* Tasks */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold tracking-widest" style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em' }}>TODAY'S TASKS</h3>
          <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>{doneCount}/{tasks.length} done</span>
        </div>
        <div className="flex flex-col gap-2.5">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} onToggle={toggleTask} isLocked={isLocked(task)} isDone={isTaskDone(task.id)} />
          ))}
        </div>
      </div>

      {/* Assessment */}
      <div className="mb-6">
        <h3 className="text-xs font-bold tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em' }}>ASSESSMENT</h3>
        {allDone ? (
          <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, #0A84FF15, #30D15815)', border: '1px solid rgba(10,132,255,0.25)' }}>
            <p className="text-xs font-bold tracking-widest mb-1.5" style={{ color: '#0A84FF', letterSpacing: '0.08em' }}>READY</p>
            <p className="text-base font-semibold mb-1">{dayData.assessmentTask?.taskDescription}</p>
            <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>{dayData.assessmentTask?.minutes} min</p>
            <Link to="/assessment" className="inline-flex items-center justify-center w-full h-12 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] hover:opacity-90"
              style={{ background: '#0A84FF', color: '#fff', textDecoration: 'none' }}>
              Start Assessment
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl p-5" style={{ background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.06)', opacity: 0.5 }}>
            <div className="flex items-center gap-3">
              <span style={{ fontSize: '20px' }}>🔒</span>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>Complete all tasks to unlock</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{remainingCount} task{remainingCount !== 1 ? 's' : ''} remaining</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bonus */}
      {bonusTasks.length > 0 && (
        <div>
          <button onClick={() => setBonusExpanded(!bonusExpanded)}
            className="w-full rounded-2xl p-4 flex items-center justify-between transition-all active:scale-[0.98]"
            style={{ background: '#1C1C1E', border: '1px solid rgba(255,159,10,0.12)', cursor: 'pointer' }}>
            <div className="flex items-center gap-3">
              <span style={{ color: '#FF9F0A' }}>✦</span>
              <span className="text-sm font-semibold">Bonus Tasks</span>
              <Badge color="#FF9F0A">{bonusTasks.length} available</Badge>
            </div>
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.3)', display: 'inline-block', transform: bonusExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
          </button>
          {bonusExpanded && (
            <div className="flex flex-col gap-2.5 mt-2.5">
              {bonusTasks.map(t => <BonusCard key={t.id} task={t} />)}
            </div>
          )}
        </div>
      )}
      <div className="h-6" />
    </div>
  )
}
