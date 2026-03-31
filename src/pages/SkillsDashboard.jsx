import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { skillsCatalog, addSkillPrompt, pendingSkillRequests } from '../mockData'

function ProgressRing({ progress, color, size = 56 }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (progress / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth="4"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  )
}

function AddSkillModal({ onClose, onSubmit }) {
  const [step, setStep] = useState('prompt') // 'prompt' | 'paste'
  const [copied, setCopied] = useState(false)
  const [output, setOutput] = useState('')

  const copyPrompt = () => {
    navigator.clipboard.writeText(addSkillPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-lg rounded-3xl p-6" style={{ background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.08)', maxHeight: '85vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold" style={{ letterSpacing: '-0.3px' }}>Add New Skill</h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {step === 'prompt' ? 'Step 1 of 2 — Generate with Claude' : 'Step 2 of 2 — Paste Claude\'s output'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all hover:bg-white/10" style={{ color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>

        {step === 'prompt' ? (
          <>
            <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(10,132,255,0.08)', border: '1px solid rgba(10,132,255,0.15)' }}>
              <p className="text-xs font-bold mb-2" style={{ color: '#0A84FF', letterSpacing: '0.08em' }}>HOW IT WORKS</p>
              <ol className="space-y-1.5">
                {['Copy the prompt below', 'Open Claude.ai and paste it', 'Answer Claude\'s questions about your skill', 'Copy Claude\'s final JSON output', 'Come back and paste it here'].map((s, i) => (
                  <li key={i} className="flex gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    <span className="w-4 h-4 rounded-full flex items-center justify-center font-bold flex-shrink-0" style={{ background: 'rgba(10,132,255,0.2)', color: '#0A84FF', fontSize: '10px' }}>{i+1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-xl p-4 mb-4 overflow-auto" style={{ background: '#000', border: '1px solid rgba(255,255,255,0.06)', maxHeight: '160px' }}>
              <pre className="text-xs whitespace-pre-wrap" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'ui-monospace, monospace', lineHeight: '1.6', margin: 0 }}>
                {addSkillPrompt.slice(0, 300)}...
              </pre>
            </div>

            <div className="flex gap-2">
              <button
                onClick={copyPrompt}
                className="flex-1 font-semibold py-3 rounded-xl transition-all"
                style={{ background: copied ? 'rgba(48,209,88,0.15)' : '#0A84FF', color: copied ? '#30D158' : '#fff', border: copied ? '1px solid rgba(48,209,88,0.3)' : 'none', cursor: 'pointer' }}
              >
                {copied ? '✓ Copied!' : 'Copy Prompt'}
              </button>
              <a href="https://claude.ai" target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center font-semibold py-3 rounded-xl text-sm transition-all"
                style={{ background: 'rgba(191,90,242,0.12)', color: '#BF5AF2', border: '1px solid rgba(191,90,242,0.2)', textDecoration: 'none' }}
              >
                Open Claude.ai ↗
              </a>
            </div>

            <button
              onClick={() => setStep('paste')}
              className="w-full mt-3 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-70"
              style={{ background: 'transparent', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}
            >
              I have Claude's output →
            </button>
          </>
        ) : (
          <>
            <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Paste the JSON output Claude gave you below. Our team will review it and set up your skill track.
            </p>
            <textarea
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              placeholder={'{\n  "skillId": "...",\n  "title": "...",\n  ...\n}'}
              rows={8}
              className="w-full rounded-xl p-4 text-sm mb-4 resize-none focus:outline-none"
              style={{ background: '#000', border: `1px solid ${output.trim() ? 'rgba(10,132,255,0.4)' : 'rgba(255,255,255,0.06)'}`, color: '#fff', fontFamily: 'ui-monospace, monospace', lineHeight: '1.6' }}
            />
            <div className="flex gap-2">
              <button onClick={() => setStep('prompt')} className="px-4 py-3 rounded-xl text-sm transition-all" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer' }}>← Back</button>
              <button
                onClick={() => { if (output.trim()) { onSubmit(output); onClose() } }}
                disabled={!output.trim()}
                className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all"
                style={{ background: output.trim() ? '#0A84FF' : 'rgba(255,255,255,0.06)', color: output.trim() ? '#fff' : 'rgba(255,255,255,0.2)', border: 'none', cursor: output.trim() ? 'pointer' : 'not-allowed' }}
              >
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
  const { user, isTracking, startTracking } = useApp()
  const [showAddSkill, setShowAddSkill] = useState(false)
  const [submittedRequest, setSubmittedRequest] = useState(false)

  const handleStartTracking = (skillId) => {
    startTracking()
    navigate('/')
  }

  const handleSubmitSkill = (output) => {
    setSubmittedRequest(true)
  }

  return (
    <div className="px-4 py-8 max-w-4xl mx-auto lg:px-8">
      {/* Greeting */}
      <div className="mb-8">
        <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="text-3xl font-bold" style={{ letterSpacing: '-0.5px' }}>
          Hey, {user?.name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p className="text-base mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Choose a skill to work on today
        </p>
      </div>

      {/* Pending request banner */}
      {(pendingSkillRequests.length > 0 || submittedRequest) && (
        <div className="rounded-2xl p-4 mb-6" style={{ background: 'rgba(255,159,10,0.08)', border: '1px solid rgba(255,159,10,0.15)' }}>
          <p className="text-xs font-bold mb-1" style={{ color: '#FF9F0A', letterSpacing: '0.08em' }}>SKILL REQUEST PENDING</p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {submittedRequest ? 'Your new skill request was submitted!' : `"${pendingSkillRequests[0].title}"`} is under review. We'll notify you once it's ready.
          </p>
        </div>
      )}

      {/* Skills grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {skillsCatalog.map(skill => {
          const progress = skill.currentDay > 0 ? Math.round(((skill.currentDay - 1) / skill.totalDays) * 100) : 0
          const isActive = skill.tracking && isTracking

          return (
            <div
              key={skill.id}
              className="rounded-3xl p-6 flex flex-col gap-4"
              style={{ background: '#1C1C1E', border: `1px solid ${isActive ? skill.color + '30' : 'rgba(255,255,255,0.06)'}` }}
            >
              {/* Top row */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{skill.icon}</span>
                    {isActive && skill.id === 'apm-foundations' && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(10,132,255,0.15)', color: '#0A84FF' }}>Active</span>
                    )}
                  </div>
                  <h3 className="text-base font-bold leading-tight" style={{ letterSpacing: '-0.2px' }}>{skill.title}</h3>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{skill.subtitle}</p>
                </div>
                <div className="relative flex-shrink-0">
                  <ProgressRing progress={progress} color={skill.color} size={52} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold" style={{ color: skill.color }}>{progress}%</span>
                  </div>
                </div>
              </div>

              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{skill.description}</p>

              {/* Competencies */}
              <div className="flex flex-wrap gap-1.5">
                {skill.competencies.slice(0, 3).map(c => (
                  <span key={c} className="text-xs px-2 py-0.5 rounded-full" style={{ background: skill.color + '12', color: skill.color }}>
                    {c}
                  </span>
                ))}
              </div>

              {/* Actions */}
              {skill.tracking && isTracking ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate('/')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.97]"
                    style={{ background: skill.color, color: '#fff', border: 'none', cursor: 'pointer' }}
                  >
                    <span>Today</span>
                  </button>
                  <button
                    onClick={() => navigate('/roadmap')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.97]"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}
                  >
                    <span>Roadmap</span>
                  </button>
                </div>
              ) : skill.enrolled && !isTracking ? (
                <button
                  onClick={() => handleStartTracking(skill.id)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] hover:opacity-90"
                  style={{ background: skill.color, color: '#fff', border: 'none', cursor: 'pointer' }}
                >
                  Start Tracking →
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'not-allowed' }}
                >
                  Not Started
                </button>
              )}
            </div>
          )
        })}

        {/* Add New Skill card */}
        <button
          onClick={() => setShowAddSkill(true)}
          className="rounded-3xl p-6 flex flex-col items-center justify-center gap-3 transition-all hover:opacity-70 active:scale-[0.98] min-h-[200px]"
          style={{ background: '#1C1C1E', border: '1px dashed rgba(255,255,255,0.12)', cursor: 'pointer' }}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
            +
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>Add New Skill</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>Build a custom 14–21 day track</p>
          </div>
        </button>
      </div>

      {showAddSkill && (
        <AddSkillModal
          onClose={() => setShowAddSkill(false)}
          onSubmit={handleSubmitSkill}
        />
      )}

      <div className="h-6" />
    </div>
  )
}
