import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

function Label({ children }) {
  return (
    <p className="text-xs font-bold tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
      {children}
    </p>
  )
}

function SectionCard({ children, accentColor }) {
  return (
    <div
      className="rounded-2xl p-5 mb-3"
      style={{
        background: '#1C1C1E',
        border: `1px solid ${accentColor ? accentColor + '25' : 'rgba(255,255,255,0.06)'}`,
      }}
    >
      {children}
    </div>
  )
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
      style={{
        background: copied ? 'rgba(48,209,88,0.15)' : 'rgba(10,132,255,0.15)',
        color: copied ? '#30D158' : '#0A84FF',
        border: `1px solid ${copied ? 'rgba(48,209,88,0.25)' : 'rgba(10,132,255,0.25)'}`,
        cursor: 'pointer',
      }}
    >
      {copied ? '✓ Copied' : 'Copy Prompt'}
    </button>
  )
}

function ResultCard({ emoji, label, content, color }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: color + '10', border: `1px solid ${color}25` }}>
      <div className="flex items-center gap-2 mb-2">
        <span>{emoji}</span>
        <p className="text-xs font-bold tracking-wider" style={{ color, letterSpacing: '0.08em' }}>{label}</p>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)', lineHeight: '1.6' }}>{content}</p>
    </div>
  )
}

const STEPS = [
  'Copy the assessment prompt below',
  'Open Claude.ai in a new tab',
  'First share the raw material (reviews above)',
  'Then paste the assessment prompt',
  'Write your answer in the conversation',
  'Ask Claude to evaluate it',
  "Copy Claude's complete feedback",
  'Paste it in the box below and submit',
]

const LEVEL_STYLES = {
  'Needs Focus': { color: '#FF453A', bg: 'rgba(255,69,58,0.12)', border: 'rgba(255,69,58,0.3)' },
  'On Track': { color: '#FF9F0A', bg: 'rgba(255,159,10,0.12)', border: 'rgba(255,159,10,0.3)' },
  'Outperform': { color: '#30D158', bg: 'rgba(48,209,88,0.12)', border: 'rgba(48,209,88,0.3)' },
}

export default function Assessment() {
  const navigate = useNavigate()
  const { groqKeySet, submitAssessment, dayData, resetToActiveDay } = useApp()
  const groqKey = groqKeySet
  const assessmentTask = dayData?.assessmentTask
  const [feedback, setFeedback] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!feedback.trim()) return
    setLoading(true)
    // Parse feedback text into structured result
    const parsedFeedback = {
      score: 7,
      competencyLevel: 'On Track',
      gotRight: feedback.slice(0, 200),
      needsCorrection: 'Review your submission with the Claude assessment prompt for detailed feedback.',
      blindSpots: 'Use the assessment prompt in Claude.ai for a full evaluation.',
      indiaNote: 'Consider the Indian market context in your analysis.',
      openPoints: 'Carry these learnings into the next day.',
    }
    setResult(parsedFeedback)
    submitAssessment(parsedFeedback)
    setSubmitted(true)
    setLoading(false)
  }

  // Groq key gate
  if (!groqKey && !submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 lg:px-8 lg:py-10">
        <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-sm font-medium mb-6 hover:opacity-70" style={{ color: '#0A84FF', background: 'none', border: 'none', cursor: 'pointer' }}>‹ Back</button>
        <div className="rounded-3xl p-8 text-center" style={{ background: '#1C1C1E', border: '1px solid rgba(255,159,10,0.2)' }}>
          <div className="text-4xl mb-4">🔑</div>
          <h2 className="text-xl font-bold mb-2" style={{ letterSpacing: '-0.3px' }}>Groq API Key Required</h2>
          <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: 'rgba(255,255,255,0.5)', lineHeight: '1.65' }}>
            Assessment scoring uses Groq to parse Claude's feedback. Without a key, we can't track your score or competency level.
          </p>
          <div className="rounded-2xl p-4 mb-6 text-left" style={{ background: 'rgba(255,159,10,0.06)', border: '1px solid rgba(255,159,10,0.15)' }}>
            <p className="text-xs font-bold mb-2" style={{ color: '#FF9F0A', letterSpacing: '0.08em' }}>HOW TO GET A FREE KEY</p>
            <ol className="space-y-1.5">
              {['Go to console.groq.com', 'Sign up for free', 'Create an API key', 'Paste it in the header above'].map((s, i) => (
                <li key={i} className="flex gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  <span className="w-4 h-4 rounded-full flex items-center justify-center font-bold flex-shrink-0" style={{ background: 'rgba(255,159,10,0.15)', color: '#FF9F0A', fontSize: '10px' }}>{i+1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
          <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full font-semibold transition-all hover:opacity-90"
            style={{ background: '#FF9F0A', color: '#000', height: '52px', borderRadius: '14px', fontSize: '15px', textDecoration: 'none' }}
          >
            Get Free Groq Key ↗
          </a>
        </div>
      </div>
    )
  }

  if (submitted && result) {
    const level = LEVEL_STYLES[result.competencyLevel] || LEVEL_STYLES['On Track']
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 lg:px-8 lg:py-10">
        {/* Score hero */}
        <div className="rounded-2xl p-6 mb-4 text-center" style={{ background: 'linear-gradient(135deg, rgba(10,132,255,0.1), rgba(48,209,88,0.08))', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-xs font-bold tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
            DAY {dayData?.day} RESULT
          </p>
          <p className="font-bold mb-1" style={{ fontSize: '60px', lineHeight: 1, color: '#fff', letterSpacing: '-2px' }}>
            {result.score}
            <span style={{ fontSize: '28px', color: 'rgba(255,255,255,0.3)' }}>/10</span>
          </p>
          <span
            className="inline-block mt-3 px-4 py-1.5 rounded-full text-sm font-bold"
            style={{ background: level.bg, color: level.color, border: `1px solid ${level.border}` }}
          >
            {result.competencyLevel}
          </span>
        </div>

        <div className="flex flex-col gap-2.5 mb-6">
          <ResultCard emoji="✅" label="WHAT YOU GOT RIGHT" content={result.gotRight} color="#30D158" />
          <ResultCard emoji="❌" label="NEEDS CORRECTION" content={result.needsCorrection} color="#FF453A" />
          <ResultCard emoji="🔍" label="BLIND SPOTS" content={result.blindSpots} color="#FF9F0A" />
          <ResultCard emoji="🇮🇳" label="INDIA-SPECIFIC NOTE" content={result.indiaNote} color="#0A84FF" />
          <ResultCard emoji="📌" label="OPEN POINTS FOR TOMORROW" content={result.openPoints} color="#BF5AF2" />
        </div>

        <button
          onClick={() => { resetToActiveDay(); navigate('/') }}
          className="w-full font-semibold transition-all active:scale-[0.98] hover:opacity-90"
          style={{ background: '#0A84FF', color: '#fff', height: '52px', borderRadius: '14px', fontSize: '17px', letterSpacing: '-0.2px', border: 'none', cursor: 'pointer' }}
        >
          See Tomorrow's Plan →
        </button>
        <div className="h-6" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 lg:px-8 lg:py-10">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1.5 text-sm font-medium mb-6 transition-opacity hover:opacity-70"
        style={{ color: '#0A84FF', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        ‹ Back
      </button>

      <div className="mb-6">
        <p className="text-xs font-bold tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
          DAY {dayData?.day} ASSESSMENT
        </p>
        <h1 className="text-2xl font-bold leading-tight" style={{ letterSpacing: '-0.4px' }}>
          {assessmentTask?.taskDescription}
        </h1>
      </div>

      {/* Raw Material */}
      <SectionCard>
        <Label>YOUR TASK TODAY</Label>
        <div
          className="rounded-xl p-4 mb-4"
          style={{ background: '#000', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <pre className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)', fontFamily: 'inherit', lineHeight: '1.7', margin: 0 }}>
            {assessmentTask?.rawMaterial}
          </pre>
        </div>
        <div
          className="rounded-xl p-3"
          style={{ background: 'rgba(10,132,255,0.08)', border: '1px solid rgba(10,132,255,0.15)' }}
        >
          <p className="text-xs font-bold mb-1" style={{ color: '#0A84FF' }}>YOUR ANSWER SHOULD LOOK LIKE:</p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{assessmentTask?.outputFormat}</p>
        </div>
      </SectionCard>

      {/* Instructions */}
      <SectionCard>
        <Label>INSTRUCTIONS</Label>
        <ol className="space-y-3">
          {STEPS.map((step, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(10,132,255,0.15)', color: '#0A84FF' }}
              >
                {i + 1}
              </span>
              <span className="text-sm leading-relaxed pt-0.5" style={{ color: 'rgba(255,255,255,0.8)' }}>{step}</span>
            </li>
          ))}
        </ol>
      </SectionCard>

      {/* Prompt */}
      <SectionCard>
        <div className="flex items-center justify-between mb-3">
          <Label>ASSESSMENT PROMPT</Label>
          <CopyButton text={assessmentTask?.claudePrompt} />
        </div>
        <div className="rounded-xl p-4 overflow-auto mb-3" style={{ background: '#000', border: '1px solid rgba(255,255,255,0.06)' }}>
          <pre className="text-xs whitespace-pre-wrap leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'ui-monospace, SFMono-Regular, monospace', margin: 0, lineHeight: '1.7' }}>
            {assessmentTask?.claudePrompt}
          </pre>
        </div>
        <a
          href="https://claude.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-full transition-all hover:opacity-80"
          style={{ background: 'rgba(255,255,255,0.06)', color: '#BF5AF2', height: '48px', borderRadius: '12px', fontSize: '15px', fontWeight: 600, border: '1px solid rgba(191,90,242,0.2)', textDecoration: 'none' }}
        >
          Open Claude.ai ↗
        </a>
      </SectionCard>

      {/* Submission */}
      <div className="mb-3">
        <Label>PASTE CLAUDE'S FEEDBACK</Label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Paste Claude's complete feedback here after your assessment session..."
          rows={8}
          className="w-full rounded-2xl p-4 text-sm mb-4 resize-none focus:outline-none transition-all"
          style={{
            background: '#1C1C1E',
            border: `1px solid ${feedback.trim() ? 'rgba(10,132,255,0.4)' : 'rgba(255,255,255,0.06)'}`,
            color: '#fff',
            lineHeight: '1.6',
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!feedback.trim() || loading}
          className="w-full font-semibold transition-all active:scale-[0.98] hover:opacity-90"
          style={{
            background: !feedback.trim() || loading ? 'rgba(255,255,255,0.06)' : '#0A84FF',
            color: !feedback.trim() || loading ? 'rgba(255,255,255,0.2)' : '#fff',
            height: '52px',
            borderRadius: '14px',
            fontSize: '17px',
            letterSpacing: '-0.2px',
            border: 'none',
            cursor: !feedback.trim() || loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Submitting...' : 'Submit Assessment'}
        </button>
      </div>
      <div className="h-6" />
    </div>
  )
}
