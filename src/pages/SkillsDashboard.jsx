import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { addSkillPrompt } from '../mockData'
import { getProgress } from '../utils/progress'
import { appendSkillRequest } from '../utils/githubStorage'

function ProgressRing({ progress, color, size = 52 }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (progress / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border-2)" strokeWidth="4" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
    </svg>
  )
}

function AddSkillModal({ onClose, onSubmit, user }) {
  const [step, setStep] = useState('prompt')
  const [copied, setCopied] = useState(false)
  const [output, setOutput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handleSubmit = async () => {
    if (!output.trim()) return
    setSubmitting(true)
    setSubmitError('')
    try {
      await appendSkillRequest({
        userEmail: user?.email || 'unknown',
        userName: user?.name || 'unknown',
        rawJson: output.trim(),
      })
      onSubmit(output)
      onClose()
    } catch (err) {
      // GitHub token not configured — still accept locally
      console.warn('Could not save to GitHub:', err.message)
      onSubmit(output)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-lg rounded-3xl p-6" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-3)', maxHeight: '85vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold" style={{ letterSpacing: '-0.3px' }}>Add New Skill</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
              {step === 'prompt' ? 'Step 1 of 2 — Generate with Claude' : 'Step 2 of 2 — Paste output'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/10" style={{ color: 'var(--text-2)', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>

        {step === 'prompt' ? (
          <>
            <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(10,132,255,0.08)', border: '1px solid rgba(10,132,255,0.15)' }}>
              <p className="text-xs font-bold mb-2" style={{ color: 'var(--blue)', letterSpacing: '0.08em' }}>HOW IT WORKS</p>
              <ol className="space-y-1.5">
                {['Copy the prompt below','Open Claude.ai and paste it','Answer Claude\'s questions','Copy Claude\'s JSON output','Come back and paste it here'].map((s,i) => (
                  <li key={i} className="flex gap-2 text-xs" style={{ color: 'var(--text-2)' }}>
                    <span className="w-4 h-4 rounded-full flex items-center justify-center font-bold flex-shrink-0" style={{ background: 'rgba(10,132,255,0.2)', color: 'var(--blue)', fontSize: '10px' }}>{i+1}</span>{s}
                  </li>
                ))}
              </ol>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { navigator.clipboard.writeText(addSkillPrompt); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                className="flex-1 font-semibold py-3 rounded-xl transition-all"
                style={{ background: copied ? 'rgba(48,209,88,0.15)' : 'var(--blue)', color: copied ? 'var(--green)' : '#fff', border: copied ? '1px solid rgba(48,209,88,0.3)' : 'none', cursor: 'pointer' }}>
                {copied ? '✓ Copied!' : 'Copy Prompt'}
              </button>
              <a href="https://claude.ai" target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center font-semibold py-3 rounded-xl text-sm"
                style={{ background: 'rgba(191,90,242,0.12)', color: 'var(--purple)', border: '1px solid rgba(191,90,242,0.2)', textDecoration: 'none' }}>
                Open Claude.ai ↗
              </a>
            </div>
            <button onClick={() => setStep('paste')} className="w-full mt-3 py-3 rounded-xl text-sm font-medium"
              style={{ background: 'transparent', color: 'var(--text-3)', border: '1px solid var(--border-3)', cursor: 'pointer' }}>
              I have Claude's output →
            </button>
          </>
        ) : (
          <>
            <p className="text-sm mb-3" style={{ color: 'var(--text-2)' }}>Paste the JSON output from Claude. Our team will review and set up your skill track.</p>
            <textarea value={output} onChange={e => setOutput(e.target.value)}
              placeholder={'{\n  "skillId": "...",\n  "title": "...",\n  ...\n}'}
              rows={8} className="w-full rounded-xl p-4 text-sm mb-4 resize-none focus:outline-none"
              style={{ background: 'var(--bg)', border: `1px solid ${output.trim() ? 'rgba(10,132,255,0.4)' : 'var(--border-2)'}`, color: 'var(--text-1)', fontFamily: 'ui-monospace, monospace', lineHeight: '1.6' }} />
            <div className="flex gap-2">
              <button onClick={() => setStep('prompt')} className="px-4 py-3 rounded-xl text-sm"
                style={{ background: 'var(--border-2)', color: 'var(--text-2)', border: 'none', cursor: 'pointer' }}>← Back</button>
              <button onClick={handleSubmit} disabled={!output.trim() || submitting}
                className="flex-1 py-3 rounded-xl font-semibold text-sm"
                style={{ background: output.trim() && !submitting ? 'var(--blue)' : 'var(--border-2)', color: output.trim() && !submitting ? '#fff' : 'var(--text-6)', border: 'none', cursor: output.trim() && !submitting ? 'pointer' : 'not-allowed' }}>
                {submitting ? 'Submitting…' : 'Submit for Review'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ResetConfirmModal({ skill, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-sm rounded-3xl p-6" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-3)' }}>
        <div className="text-3xl mb-4 text-center">🔄</div>
        <h2 className="text-lg font-bold text-center mb-2" style={{ letterSpacing: '-0.3px' }}>Reset {skill.title}?</h2>
        <p className="text-sm text-center mb-6" style={{ color: 'var(--text-3)', lineHeight: 1.6 }}>
          This will erase all your progress, task completions, and assessment scores. You'll start fresh from Day 1.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-3 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--border-2)', color: 'var(--text-2)', border: 'none', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-3 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--red)', color: '#fff', border: 'none', cursor: 'pointer' }}>
            Yes, Reset
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SkillsDashboard() {
  const navigate = useNavigate()
  const { user, skills, progress, activeSkillId, setActiveSkillId, activeDay, getPendingTasksForSidebar, isTaskDone, dayData, resetSkill } = useApp()
  const [showAddSkill, setShowAddSkill] = useState(false)
  const [submittedRequest, setSubmittedRequest] = useState(false)
  const [resetTarget, setResetTarget] = useState(null) // skill to reset

  const firstName = user?.name?.split(' ')[0] || 'there'
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  const pendingTasks = getPendingTasksForSidebar()

  const TYPE_ICONS = { read: '📖', search: '🔍', activity: '⚡' }

  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      {/* Main content */}
      <div className="flex-1 px-4 py-8 max-w-5xl mx-auto lg:px-8">
        <div className="mb-8">
          <p className="text-sm mb-1" style={{ color: 'var(--text-3)' }}>{today}</p>
          <h1 className="text-3xl font-bold" style={{ letterSpacing: '-0.5px' }}>Hey, {firstName} 👋</h1>
          <p className="text-base mt-1" style={{ color: 'var(--text-3)' }}>Choose a skill to continue today</p>
        </div>

        {submittedRequest && (
          <div className="rounded-2xl p-4 mb-6" style={{ background: 'rgba(255,159,10,0.08)', border: '1px solid rgba(255,159,10,0.15)' }}>
            <p className="text-xs font-bold mb-1" style={{ color: 'var(--orange)', letterSpacing: '0.08em' }}>SKILL REQUEST SUBMITTED</p>
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>Your new skill request is under review. We'll notify you once it's ready.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {skills.map(skill => {
            const skillProg = user ? getProgress(user.uid, skill.id) : null
            const skillDay = skillProg?.currentDay || 1
            const skillProgress = skill.enrolled
              ? Math.round(((skillDay - 1) / skill.totalDays) * 100)
              : 0

            return (
              <div key={skill.id} className="rounded-3xl p-6 flex flex-col gap-4"
                style={{ background: 'var(--surface-1)', border: `1px solid ${activeSkillId === skill.id ? skill.color + '30' : 'var(--border-2)'}` }}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{skill.icon}</span>
                      {activeSkillId === skill.id && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(10,132,255,0.15)', color: 'var(--blue)' }}>Active</span>
                      )}
                    </div>
                    <h3 className="text-base font-bold leading-tight" style={{ letterSpacing: '-0.2px' }}>{skill.title}</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{skill.subtitle}</p>
                  </div>
                  <div className="relative flex-shrink-0">
                    <ProgressRing progress={skillProgress} color={skill.color} size={52} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold" style={{ color: skill.color }}>{skillProgress}%</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>{skill.description}</p>

                <div className="flex flex-wrap gap-1.5">
                  {skill.competencies.slice(0, 3).map(c => (
                    <span key={c} className="text-xs px-2 py-0.5 rounded-full" style={{ background: skill.color + '12', color: skill.color }}>{c}</span>
                  ))}
                </div>

                {skill.enrolled ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <button onClick={() => { setActiveSkillId(skill.id); navigate('/') }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.97]"
                        style={{ background: skill.color, color: '#fff', border: 'none', cursor: 'pointer' }}>
                        Today
                      </button>
                      <button onClick={() => { setActiveSkillId(skill.id); navigate('/roadmap') }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.97]"
                        style={{ background: 'var(--border-2)', color: 'var(--text-2)', border: '1px solid var(--border-3)', cursor: 'pointer' }}>
                        Roadmap
                      </button>
                    </div>
                    <button onClick={() => setResetTarget(skill)}
                      className="w-full py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                      style={{ background: 'transparent', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.25)', cursor: 'pointer' }}>
                      🔄 Reset Skill
                    </button>
                  </div>
                ) : (
                  <button disabled className="w-full py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: 'var(--border-1)', color: 'var(--text-6)', border: '1px solid var(--border-2)', cursor: 'not-allowed' }}>
                    Not Enrolled
                  </button>
                )}
              </div>
            )
          })}

          <button onClick={() => setShowAddSkill(true)}
            className="rounded-3xl p-6 flex flex-col items-center justify-center gap-3 transition-all hover:opacity-70 active:scale-[0.98] min-h-[200px]"
            style={{ background: 'var(--surface-1)', border: '1px dashed var(--border-4)', cursor: 'pointer' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ background: 'var(--border-2)' }}>+</div>
            <div className="text-center">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-2)' }}>Add New Skill</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>Build a custom 14–21 day track</p>
            </div>
          </button>
        </div>

        {showAddSkill && <AddSkillModal onClose={() => setShowAddSkill(false)} onSubmit={() => setSubmittedRequest(true)} user={user} />}
        {resetTarget && (
          <ResetConfirmModal
            skill={resetTarget}
            onCancel={() => setResetTarget(null)}
            onConfirm={() => {
              resetSkill(resetTarget.id)
              setResetTarget(null)
            }}
          />
        )}
        <div className="h-6" />
      </div>

      {/* Right pane — cumulative pending tasks */}
      <aside className="hidden xl:flex flex-col w-72 flex-shrink-0 py-8 pr-6 gap-5">
        <div>
          <p className="text-xs font-bold tracking-widest mb-3" style={{ color: 'var(--text-3)', letterSpacing: '0.1em' }}>PENDING TODAY</p>
          {pendingTasks.length === 0 ? (
            <div className="rounded-2xl p-4" style={{ background: 'var(--surface-1)', border: '1px solid rgba(48,209,88,0.15)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--green)' }}>✓ All caught up!</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>No pending tasks</p>
            </div>
          ) : (
            <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-2)' }}>
              {pendingTasks.map(t => (
                <button key={t.id} onClick={() => navigate(`/task/${t.id}`)}
                  className="w-full flex items-center gap-2 text-left transition-opacity hover:opacity-70"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <span className="text-sm">{TYPE_ICONS[t.type]}</span>
                  <span className="text-xs truncate" style={{ color: 'var(--text-2)' }}>{t.title || t.keyword}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-bold tracking-widest mb-3" style={{ color: 'var(--text-3)', letterSpacing: '0.1em' }}>YOUR SKILLS</p>
          <div className="space-y-2">
            {skills.filter(s => s.enrolled).map(skill => {
              const sp = user ? getProgress(user.uid, skill.id) : null
              const spDay = sp?.currentDay || 1
              return (
                <button key={skill.id} onClick={() => { setActiveSkillId(skill.id); navigate('/') }}
                  className="w-full rounded-xl p-3 text-left transition-all hover:opacity-80"
                  style={{ background: 'var(--surface-1)', border: `1px solid ${activeSkillId === skill.id ? skill.color + '40' : 'var(--border-2)'}`, cursor: 'pointer' }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span>{skill.icon}</span>
                    <span className="text-xs font-semibold truncate">{skill.title}</span>
                  </div>
                  <div className="rounded-full h-1 overflow-hidden" style={{ background: 'var(--border-2)' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.round((spDay - 1) / skill.totalDays * 100)}%`, background: skill.color }} />
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>Day {spDay} of {skill.totalDays}</p>
                </button>
              )
            })}
          </div>
        </div>
      </aside>
    </div>
  )
}
