import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const TYPE = {
  read:     { label: 'Read',     color: 'var(--blue)' },
  search:   { label: 'Research', color: 'var(--green)' },
  activity: { label: 'Do',       color: '#8B5CF6' },
}

function TaskRow({ task, isDone, isLocked, onToggle }) {
  const navigate = useNavigate()
  const cfg = TYPE[task.type] || TYPE.read
  const title = task.title || task.keyword || task.promptTitle || ''
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px', borderRadius: 14, marginBottom: 8,
        background: isDone ? 'var(--border-1)' : 'var(--surface-2)',
        border: `1px solid ${isDone ? 'var(--border-1)' : 'var(--border-3)'}`,
        opacity: isLocked ? 0.38 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      <button
        onClick={e => { e.stopPropagation(); if (!isLocked) onToggle(task.id) }}
        disabled={isLocked}
        aria-pressed={isDone}
        aria-label={`Toggle completion for ${title}`}
        style={{
          flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
          border: `2px solid ${isDone ? cfg.color : 'var(--text-6)'}`,
          background: isDone ? cfg.color : 'transparent',
          cursor: isLocked ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s', padding: 0,
        }}
      >
        {isDone && <svg width="11" height="8" viewBox="0 0 11 8" fill="none"><path d="M1 3.5L4 6.5L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </button>
      <button
        onClick={() => !isLocked && navigate(`/task/${task.id}`)}
        disabled={isLocked}
        style={{ flex: 1, minWidth: 0, background: 'none', border: 'none', padding: 0, cursor: isLocked ? 'default' : 'pointer', textAlign: 'left' }}
      >
        <div style={{ display: 'flex', gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: isDone ? 'var(--text-6)' : cfg.color, textTransform: 'uppercase' }}>{cfg.label}</span>
          {isLocked && <span style={{ fontSize: 10, color: 'var(--text-6)' }}>locked</span>}
        </div>
        <p style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.4, color: isDone ? 'var(--text-5)' : 'var(--text-primary)', textDecoration: isDone ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
          {title}
        </p>
      </button>
      <span style={{ flexShrink: 0, fontSize: 12, color: 'var(--text-5)' }}>{task.minutes}m</span>
    </div>
  )
}

export default function Dashboard() {
  const { dayData, dayLoading, toggleTask, isTaskDone, activeDay, loadDay, skills, activeSkillId } = useApp()
  const navigate = useNavigate()
  const [showBonus, setShowBonus] = useState(false)

  const activeSkill = skills.find(s => s.id === activeSkillId)
  const totalDays   = activeSkill?.totalDays || 21
  const skillTitle  = activeSkill?.title     || 'APM Foundations'

  // Snap back to current active day on mount
  useEffect(() => {
    if (activeDay && dayData && dayData.day !== activeDay) loadDay(activeDay)
  }, [activeDay]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setShowBonus(false) }, [dayData?.day])

  if (dayLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #3B82F6', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  if (!dayData) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
      <div>
        <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 16 }}>Could not load content.</p>
        <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', borderRadius: 10, background: 'var(--blue)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Retry</button>
      </div>
    </div>
  )

  const tasks      = dayData.tasks || []
  const bonusTasks = dayData.bonusTasks || []
  const today      = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  const allReadsDone      = tasks.filter(t => t.type === 'read').every(t => isTaskDone(t.id)) && tasks.some(t => t.type === 'read')
  const allReadSearchDone = tasks.filter(t => t.type === 'read' || t.type === 'search').every(t => isTaskDone(t.id))

  const isLocked = (task) => {
    if (task.type === 'read')     return false
    if (task.type === 'search')   return !allReadsDone
    if (task.type === 'activity') return !allReadSearchDone
    return false
  }

  const doneCount    = tasks.filter(t => isTaskDone(t.id)).length
  const allCoreDone  = tasks.length > 0 && tasks.every(t => isTaskDone(t.id))
  const allBonusDone = bonusTasks.length > 0 && bonusTasks.every(t => isTaskDone(t.id))
  const overallPct   = Math.round(((activeDay - 1) / totalDays) * 100)

  const s = {
    label: { fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-4)', marginBottom: 10, display: 'block' },
  }

  return (
    <div style={{ maxWidth: 620, margin: '0 auto', padding: '24px 16px 100px' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 12, color: 'var(--text-4)', marginBottom: 6 }}>{today}</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1.2, margin: 0 }}>Day {dayData.day}</h1>
            <p style={{ fontSize: 15, color: 'var(--text-2)', marginTop: 4 }}>{dayData.theme || dayData.title}</p>
          </div>
          <Link to="/roadmap" style={{ fontSize: 13, color: 'var(--blue)', textDecoration: 'none', fontWeight: 500 }}>Roadmap →</Link>
        </div>
        <div style={{ marginTop: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-5)' }}>{skillTitle}</span>
            <span style={{ fontSize: 11, color: 'var(--text-5)' }}>Day {activeDay} of {totalDays}</span>
          </div>
          <div style={{ height: 3, borderRadius: 2, background: 'var(--border-3)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${overallPct}%`, background: 'var(--blue)', borderRadius: 2, transition: 'width 0.5s ease' }} />
          </div>
        </div>
      </div>

      {/* Context anchor */}
      {dayData.realWorldAnchor && (
        <div style={{ padding: '16px', borderRadius: 14, marginBottom: 24, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--blue)' }}>Today's context</span>
          <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55, marginTop: 6 }}>
            <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{dayData.realWorldAnchor.company}</strong>
            {' — '}{dayData.realWorldAnchor.example}
          </p>
        </div>
      )}

      {/* Tasks */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={s.label}>Tasks</span>
          <span style={{ fontSize: 12, color: 'var(--text-4)', marginBottom: 10 }}>{doneCount} / {tasks.length}</span>
        </div>
        {tasks.map(task => <TaskRow key={task.id} task={task} isDone={isTaskDone(task.id)} isLocked={isLocked(task)} onToggle={toggleTask} />)}
      </div>

      {/* Assessment */}
      <div style={{ marginBottom: 24 }}>
        <span style={s.label}>Assessment</span>
        {allCoreDone ? (
          <div style={{ padding: '18px 20px', borderRadius: 14, background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.18)' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>{dayData.assessmentTask?.taskDescription || 'Submit your assessment'}</p>
            <p style={{ fontSize: 12, color: 'var(--text-4)', margin: '0 0 16px' }}>{dayData.assessmentTask?.minutes || 20} min · with Groq AI</p>
            <button onClick={() => navigate('/assessment')} style={{ width: '100%', padding: '12px 0', borderRadius: 10, background: 'var(--blue)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Start Assessment
            </button>
          </div>
        ) : (
          <div style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--surface-3)', border: '1px solid var(--border-2)', display: 'flex', alignItems: 'center', gap: 12, opacity: 0.45 }}>
            <span style={{ fontSize: 16 }}>🔒</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', margin: 0 }}>Complete all tasks to unlock</p>
              <p style={{ fontSize: 12, color: 'var(--text-5)', margin: '2px 0 0' }}>{tasks.filter(t => !isTaskDone(t.id)).length} remaining</p>
            </div>
          </div>
        )}
      </div>

      {/* Bonus */}
      {allCoreDone && bonusTasks.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          {!showBonus ? (
            <button
              onClick={() => setShowBonus(true)}
              style={{ width: '100%', padding: '13px 16px', borderRadius: 12, background: 'transparent', border: '1px dashed var(--border-4)', color: 'var(--text-3)', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Load more tasks for today
            </button>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={s.label}>Bonus tasks</span>
                {allBonusDone && <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600, marginBottom: 10 }}>All done!</span>}
              </div>
              {bonusTasks.map(task => <TaskRow key={task.id} task={task} isDone={isTaskDone(task.id)} isLocked={false} onToggle={toggleTask} />)}
              {allBonusDone && dayData.day < 21 && (
                <div style={{ marginTop: 12, padding: '14px 16px', borderRadius: 12, background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.12)' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--green)', marginBottom: 6 }}>Amazing work</p>
                  <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>You finished everything early. Submit the assessment to officially advance to Day {dayData.day + 1}.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
