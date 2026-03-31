import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { addSkillPrompt } from '../mockData'

function ProgressRing({ progress, color, size = 52 }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (progress / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
    </svg>
  )
}

function AddSkillModal({ onClose, onSubmit }) {
  const [step, setStep] = useState('prompt')
  const [copied, setCopied] = useState(false)
  const [output, setOutput] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-lg rounded-3xl p-6" style={{ background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.08)', maxHeight: '85vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold" style={{ letterSpacing: '-0.3px' }}>Add New Skill</h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {step === 'prompt' ? 'Step 1 of 2 — Generate with Claude' : 'Step 2 of 2 — Paste output'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/10" style={{ color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>

        {step === 'prompt' ? (
          <>
            <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(10,132,255,0.08)', border: '1px solid rgba(10,132,255,0.15)' }}>
              <p className="text-xs font-bold mb-2" style={{ color: '#0A84FF', letterSpacing: '0.08em' }}>HOW IT WORKS</p>
              <ol className="space-y-1.5">
                {['Copy the prompt below','Open Claude.ai and paste it','Answer Claude\'s questions','Copy Claude\'s JSON output','Come back and paste it here'].map((s,i) => (
                  <li key={i} className="flex gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    <span className="w-4 h-4 rounded-full flex items-center justify-center font-bold flex-shrink-0" style={{ background: 'rgba(10,132,255,0.2)', color: '#0A84FF', fontSize: '10px' }}>{i+1}</span>{s}
                  </li>
                ))}
              </ol>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { navigator.clipboard.writeText(addSkillPrompt); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                className="flex-1 font-semibold py-3 rounded-xl transition-all"
                style={{ background: copied ? 'rgba(48,209,88,0.15)' : '#0A84FF', color: copied ? '#30D158' : '#fff', border: copied ? '1px solid rgba(48,209,88,0.3)' : 'none', cursor: 'pointer' }}>
                {copied ? '✓ Copied!' : 'Copy Prompt'}
              </button>
              <a href="https://claude.ai" target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center font-semibold py-3 rounded-xl text-sm"
                style={{ background: 'rgba(191,90,242,0.12)', color: '#BF5AF2', border: '1px solid rgba(191,90,242,0.2)', textDecoration: 'none' }}>
                Open Claude.ai ↗
              </a>
            </div>
            <button onClick={() => setStep('paste')} className="w-full mt-3 py-3 rounded-xl text-sm font-medium"
              style={{ background: 'transparent', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>
              I have Claude's output →
            </button>
          </>
        ) : (
          <>
            <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>Paste the JSON output from Claude. Our team will review and set up your skill track.</p>
            <textarea value={output} onChange={e => setOutput(e.target.value)}
              placeholder={'{\n  "skillId": "...",\n  "title": "...",\n  ...\n}'}
              rows={8} className="w-full rounded-xl p-4 text-sm mb-4 resize-none focus:outline-none"
              style={{ background: '#000', border: `1px solid ${output.trim() ? 'rgba(10,132,255,0.4)' : 'rgba(255,255,255,0.06)'}`, color: '#fff', fontFamily: 'ui-monospace, monospace', lineHeight: '1.6' }} />
            <div className="flex gap-2">
              <button onClick={() => setStep('prompt')} className="px-4 py-3 rounded-xl text-sm"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer' }}>← Back</button>
              <button onClick={() => { if (output.trim()) { onSubmit(output); onClose() } }} disabled={!output.trim()}
                className="flex-1 py-3 rounded-xl font-semibold text-sm"
                style={{ background: output.trim() ? '#0A84FF' : 'rgba(255,255,255,0.06)', color: output.trim() ? '#fff' : 'rgba(255,255,255,0.2)', border: 'none', cursor: output.trim() ? 'pointer' : 'not-allowed' }}>
                Submit for Review
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function SkillsDashboard() {
  const navigate = useNavigate()
  const { user, skills, progress, activeSkillId, setActiveSkillId, activeDay, getPendingTasksForSidebar, isTaskDone, dayData } = useApp()
  const [showAddSkill, setShowAddSkill] = useState(false)
  const [submittedRequest, setSubmittedRequest] = useState(false)

  const firstName = user?.name?.split(' ')[0] || 'there'
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  const pendingTasks = getPendingTasksForSidebar()

  const TYPE_ICONS = { read: '📖', search: '🔍', activity: '⚡' }

  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      {/* Main content */}
      <div className="flex-1 px-4 py-8 max-w-3xl mx-auto lg:px-8">
        <div className="mb-8">
          <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{today}</p>
          <h1 className="text-3xl font-bold" style={{ letterSpacing: '-0.5px' }}>Hey, {firstName} 👋</h1>
          <p className="text-base mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Choose a skill to continue today</p>
        </div>

        {submittedRequest && (
          <div className="rounded-2xl p-4 mb-6" style={{ background: 'rgba(255,159,10,0.08)', border: '1px solid rgba(255,159,10,0.15)' }}>
            <p className="text-xs font-bold mb-1" style={{ color: '#FF9F0A', letterSpacing: '0.08em' }}>SKILL REQUEST SUBMITTED</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>Your new skill request is under review. We'll notify you once it's ready.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {skills.map(skill => {
            const skillProgress = progress && skill.enrolled
              ? Math.round(((activeDay - 1) / skill.totalDays) * 100)
              : 0

            return (
              <div key={skill.id} className="rounded-3xl p-6 flex flex-col gap-4"
                style={{ background: '#1C1C1E', border: `1px solid ${activeSkillId === skill.id ? skill.color + '30' : 'rgba(255,255,255,0.06)'}` }}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{skill.icon}</span>
                      {activeSkillId === skill.id && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(10,132,255,0.15)', color: '#0A84FF' }}>Active</span>
                      )}
                    </div>
                    <h3 className="text-base font-bold leading-tight" style={{ letterSpacing: '-0.2px' }}>{skill.title}</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{skill.subtitle}</p>
                  </div>
                  <div className="relative flex-shrink-0">
                    <ProgressRing progress={skillProgress} color={skill.color} size={52} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold" style={{ color: skill.color }}>{skillProgress}%</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{skill.description}</p>

                <div className="flex flex-wrap gap-1.5">
                  {skill.competencies.slice(0, 3).map(c => (
                    <span key={c} className="text-xs px-2 py-0.5 rounded-full" style={{ background: skill.color + '12', color: skill.color }}>{c}</span>
                  ))}
                </div>

                {skill.enrolled ? (
                  <div className="flex gap-2">
                    <button onClick={() => { setActiveSkillId(skill.id); navigate('/') }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.97]"
                      style={{ background: skill.color, color: '#fff', border: 'none', cursor: 'pointer' }}>
                      Today
                    </button>
                    <button onClick={() => { setActiveSkillId(skill.id); navigate('/roadmap') }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.97]"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>
                      Roadmap
                    </button>
                  </div>
                ) : (
                  <button disabled className="w-full py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'not-allowed' }}>
                    Not Enrolled
                  </button>
                )}
              </div>
            )
          })}

          <button onClick={() => setShowAddSkill(true)}
            className="rounded-3xl p-6 flex flex-col items-center justify-center gap-3 transition-all hover:opacity-70 active:scale-[0.98] min-h-[200px]"
            style={{ background: '#1C1C1E', border: '1px dashed rgba(255,255,255,0.12)', cursor: 'pointer' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ background: 'rgba(255,255,255,0.06)' }}>+</div>
            <div className="text-center">
              <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>Add New Skill</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>Build a custom 14–21 day track</p>
            </div>
          </button>
        </div>

        {showAddSkill && <AddSkillModal onClose={() => setShowAddSkill(false)} onSubmit={() => setSubmittedRequest(true)} />}
        <div className="h-6" />
      </div>

      {/* Right pane — cumulative pending tasks */}
      <aside className="hidden xl:flex flex-col w-72 flex-shrink-0 py-8 pr-6 gap-5">
        <div>
          <p className="text-xs font-bold tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>PENDING TODAY</p>
          {pendingTasks.length === 0 ? (
            <div className="rounded-2xl p-4" style={{ background: '#1C1C1E', border: '1px solid rgba(48,209,88,0.15)' }}>
              <p className="text-sm font-semibold" style={{ color: '#30D158' }}>✓ All caught up!</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>No pending tasks</p>
            </div>
          ) : (
            <div className="rounded-2xl p-4 space-y-3" style={{ background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.06)' }}>
              {pendingTasks.map(t => (
                <button key={t.id} onClick={() => navigate(`/task/${t.id}`)}
                  className="w-full flex items-center gap-2 text-left transition-opacity hover:opacity-70"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <span className="text-sm">{TYPE_ICONS[t.type]}</span>
                  <span className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>{t.title || t.keyword}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-bold tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>YOUR SKILLS</p>
          <div className="space-y-2">
            {skills.filter(s => s.enrolled).map(skill => (
              <button key={skill.id} onClick={() => { setActiveSkillId(skill.id); navigate('/') }}
                className="w-full rounded-xl p-3 text-left transition-all hover:opacity-80"
                style={{ background: '#1C1C1E', border: `1px solid ${activeSkillId === skill.id ? skill.color + '40' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer' }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span>{skill.icon}</span>
                  <span className="text-xs font-semibold truncate">{skill.title}</span>
                </div>
                <div className="rounded-full h-1 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.round(((activeDay - 1) / skill.totalDays) * 100)}%`, background: skill.color }} />
                </div>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>Day {activeDay} of {skill.totalDays}</p>
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}
