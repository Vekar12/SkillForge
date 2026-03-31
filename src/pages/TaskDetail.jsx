import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const TYPE_CONFIG = {
  read: { icon: '📖', label: 'READ', color: '#0A84FF', bg: 'rgba(10,132,255,0.12)' },
  search: { icon: '🔍', label: 'SEARCH', color: '#30D158', bg: 'rgba(48,209,88,0.12)' },
  activity: { icon: '⚡', label: 'ACTIVITY', color: '#BF5AF2', bg: 'rgba(191,90,242,0.12)' },
}

function SectionCard({ children }) {
  return (
    <div className="rounded-2xl p-5 mb-3" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-2)' }}>
      {children}
    </div>
  )
}

function Label({ children }) {
  return (
    <p className="text-xs font-bold tracking-widest mb-3" style={{ color: 'var(--text-4)', letterSpacing: '0.1em' }}>
      {children}
    </p>
  )
}

function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all active:scale-95"
      style={{
        background: copied ? 'rgba(48,209,88,0.15)' : 'rgba(10,132,255,0.15)',
        color: copied ? '#30D158' : '#0A84FF',
        border: `1px solid ${copied ? 'rgba(48,209,88,0.25)' : 'rgba(10,132,255,0.25)'}`,
        cursor: 'pointer',
      }}
    >
      {copied ? '✓ Copied' : label}
    </button>
  )
}

function PrimaryButton({ onClick, children, disabled, href, target }) {
  const style = {
    background: disabled ? 'var(--border-3)' : '#0A84FF',
    color: disabled ? 'var(--text-5)' : '#fff',
    height: '52px',
    borderRadius: '14px',
    fontWeight: 600,
    fontSize: '17px',
    letterSpacing: '-0.2px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    transition: 'all 0.2s',
    border: 'none',
    textDecoration: 'none',
  }

  if (href) {
    return (
      <a href={href} target={target} rel="noopener noreferrer" style={style}>
        {children}
      </a>
    )
  }
  return (
    <button onClick={onClick} disabled={disabled} style={style}>
      {children}
    </button>
  )
}

function SecondaryButton({ onClick, children, href, target }) {
  const style = {
    background: 'var(--border-2)',
    color: '#0A84FF',
    height: '52px',
    borderRadius: '14px',
    fontWeight: 600,
    fontSize: '15px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    transition: 'all 0.2s',
    border: '1px solid rgba(10,132,255,0.2)',
    textDecoration: 'none',
  }
  if (href) return <a href={href} target={target} rel="noopener noreferrer" style={style}>{children}</a>
  return <button onClick={onClick} style={style}>{children}</button>
}

function ReadView({ task, onDone }) {
  return (
    <>
      <SectionCard>
        <Label>SUMMARY</Label>
        <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.65' }}>{task.summary}</p>
      </SectionCard>
      <SectionCard>
        <Label>WHAT TO TAKE AWAY</Label>
        <ul className="space-y-3">
          {task.keyTakeaways.map((t, i) => (
            <li key={i} className="flex gap-3">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(10,132,255,0.15)', color: '#0A84FF', fontSize: '11px' }}>
                {i + 1}
              </span>
              <span className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)', lineHeight: '1.55' }}>{t}</span>
            </li>
          ))}
        </ul>
      </SectionCard>
      <div className="flex items-center gap-2 mb-5 px-1">
        <span className="text-sm" style={{ color: 'var(--text-4)' }}>⏱ {task.minutes} min estimated read</span>
      </div>
      <div className="flex flex-col gap-3">
        <SecondaryButton href={task.url} target="_blank">Open Article ↗</SecondaryButton>
        <PrimaryButton onClick={onDone}>Mark as Done</PrimaryButton>
      </div>
    </>
  )
}

function SearchView({ task, onDone }) {
  return (
    <>
      <SectionCard>
        <Label>SEARCH THIS KEYWORD</Label>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xl font-bold leading-snug" style={{ letterSpacing: '-0.3px' }}>{task.keyword}</p>
          <CopyButton text={task.keyword} />
        </div>
      </SectionCard>
      <SectionCard>
        <Label>WHY THIS MATTERS</Label>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.65' }}>{task.whyItMatters}</p>
      </SectionCard>
      <SectionCard>
        <Label>LOOK FOR THESE SPECIFICALLY</Label>
        <ul className="space-y-3">
          {task.whatToLearn.map((item, i) => (
            <li key={i} className="flex gap-3">
              <span style={{ color: '#30D158', flexShrink: 0, marginTop: '2px' }}>→</span>
              <span className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{item}</span>
            </li>
          ))}
        </ul>
      </SectionCard>
      <div className="flex items-center gap-2 mb-5 px-1">
        <span className="text-sm" style={{ color: 'var(--text-4)' }}>⏱ {task.minutes} min</span>
      </div>
      <PrimaryButton onClick={onDone}>Mark as Done</PrimaryButton>
    </>
  )
}

function ActivityView({ task, onDone }) {
  const [feedback, setFeedback] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const steps = [
    'Copy the prompt below',
    'Open Claude.ai in a new tab',
    'Paste the prompt and press Enter',
    'Speak or type your response when Claude asks',
    'Complete the full conversation',
    "Copy Claude's final feedback",
    'Paste it in the box below and submit',
  ]

  return (
    <>
      <SectionCard>
        <Label>INSTRUCTIONS</Label>
        <ol className="space-y-3">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(191,90,242,0.15)', color: '#BF5AF2' }}
              >
                {i + 1}
              </span>
              <span className="text-sm leading-relaxed pt-0.5" style={{ color: 'rgba(255,255,255,0.8)' }}>{step}</span>
            </li>
          ))}
        </ol>
      </SectionCard>

      <SectionCard>
        <div className="flex items-center justify-between mb-3">
          <Label>CLAUDE PROMPT</Label>
          <CopyButton text={task.claudePrompt} label="Copy Prompt" />
        </div>
        <div className="rounded-xl p-4 overflow-auto" style={{ background: 'var(--bg)', border: '1px solid var(--border-2)' }}>
          <pre className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-2)', fontFamily: 'ui-monospace, SFMono-Regular, monospace', margin: 0 }}>
            {task.claudePrompt}
          </pre>
        </div>
        <div className="mt-3">
          <SecondaryButton href="https://claude.ai" target="_blank">Open Claude.ai ↗</SecondaryButton>
        </div>
      </SectionCard>

      {!submitted ? (
        <div>
          <p className="text-xs font-bold tracking-widest mb-3 px-1" style={{ color: 'var(--text-4)', letterSpacing: '0.1em' }}>
            PASTE CLAUDE'S FEEDBACK
          </p>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Paste Claude's complete response here after your session..."
            rows={7}
            className="w-full rounded-2xl p-4 text-sm mb-3 resize-none focus:outline-none transition-all"
            style={{
              background: 'var(--surface-1)',
              border: `1px solid ${feedback.trim() ? 'rgba(10,132,255,0.4)' : 'var(--border-2)'}`,
              color: '#fff',
              lineHeight: '1.6',
            }}
          />
          <PrimaryButton
            onClick={() => { if (feedback.trim()) { setSubmitted(true); onDone() } }}
            disabled={!feedback.trim()}
          >
            Submit
          </PrimaryButton>
        </div>
      ) : (
        <div className="rounded-2xl p-4" style={{ background: 'rgba(48,209,88,0.1)', border: '1px solid rgba(48,209,88,0.25)' }}>
          <p className="text-sm font-semibold" style={{ color: '#30D158' }}>✓ Activity submitted successfully</p>
        </div>
      )}
    </>
  )
}

export default function TaskDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toggleTask, isTaskDone, dayData, dayLoading } = useApp()

  if (dayLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 text-center">
        <p style={{ color: 'var(--text-3)' }}>Loading task…</p>
      </div>
    )
  }

  const allTasks = [...(dayData?.tasks || []), ...(dayData?.bonusTasks || [])]
  const task = allTasks.find(t => t.id === id)

  if (!task) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 text-center">
        <p style={{ color: 'var(--text-3)' }}>Task not found.</p>
        <button onClick={() => navigate('/')} style={{ color: '#0A84FF', background: 'none', border: 'none', cursor: 'pointer' }} className="mt-4 text-sm">
          ← Back to Dashboard
        </button>
      </div>
    )
  }

  const cfg = TYPE_CONFIG[task.type]

  const handleDone = () => {
    toggleTask(task.id)
    setTimeout(() => navigate('/'), 400)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 lg:px-8 lg:py-10">
      {/* Back */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1.5 text-sm font-medium mb-6 transition-opacity hover:opacity-70"
        style={{ color: '#0A84FF', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        ‹ Back
      </button>

      {/* Type Badge + Title */}
      <div
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-wider mb-4"
        style={{ background: cfg.bg, color: cfg.color, letterSpacing: '0.08em' }}
      >
        {cfg.icon} {cfg.label}
      </div>

      <h1 className="text-2xl font-bold mb-6 leading-tight" style={{ letterSpacing: '-0.4px' }}>
        {task.title || task.keyword || task.promptTitle}
      </h1>

      {task.type === 'read' && <ReadView task={task} onDone={handleDone} />}
      {task.type === 'search' && <SearchView task={task} onDone={handleDone} />}
      {task.type === 'activity' && <ActivityView task={task} onDone={handleDone} />}

      <div className="h-6" />
    </div>
  )
}
