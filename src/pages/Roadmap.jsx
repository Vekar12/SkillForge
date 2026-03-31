import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const LEVEL_STYLES = {
  'Needs Focus': { color: '#FF453A', bg: 'rgba(255,69,58,0.12)', border: 'rgba(255,69,58,0.3)' },
  'On Track': { color: '#FF9F0A', bg: 'rgba(255,159,10,0.12)', border: 'rgba(255,159,10,0.3)' },
  'Outperform': { color: '#30D158', bg: 'rgba(48,209,88,0.12)', border: 'rgba(48,209,88,0.3)' },
}

function DayCard({ day, activeDay, progress, onLoadDay }) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const currentDay = progress?.currentDay || 1
  const isPast = day.day < currentDay
  const isCurrent = day.day === currentDay
  const isFuture = day.day > currentDay

  let borderColor = expanded ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)'
  if (isCurrent) borderColor = 'rgba(10,132,255,0.4)'
  if (isPast && expanded) borderColor = 'rgba(48,209,88,0.25)'
  else if (isPast) borderColor = 'rgba(48,209,88,0.15)'

  let bgColor = '#1C1C1E'
  if (isCurrent) bgColor = 'linear-gradient(135deg, rgba(10,132,255,0.08), rgba(191,90,242,0.05))'

  const assessment = progress?.assessments?.[day.day]
  const level = assessment?.competencyLevel ? LEVEL_STYLES[assessment.competencyLevel] : null

  return (
    <div
      className="rounded-2xl transition-all"
      style={{ background: bgColor, border: `1px solid ${borderColor}`, cursor: 'pointer' }}
      onClick={() => setExpanded(e => !e)}
    >
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Day number circle */}
          <div
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
            style={{
              background: isCurrent ? '#0A84FF' : isPast ? 'rgba(48,209,88,0.15)' : 'rgba(255,255,255,0.06)',
              color: isCurrent ? '#fff' : isPast ? '#30D158' : 'rgba(255,255,255,0.25)',
            }}
          >
            {isPast ? '✓' : day.day}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold" style={{ color: isCurrent ? '#0A84FF' : isPast ? '#30D158' : 'rgba(255,255,255,0.25)' }}>
                    Day {day.day}
                  </span>
                  {isCurrent && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(10,132,255,0.15)', color: '#0A84FF' }}>
                      Today
                    </span>
                  )}
                  {isFuture && (
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>🔒</span>
                  )}
                </div>
                <p className="text-sm font-medium leading-snug" style={{ color: isFuture ? 'rgba(255,255,255,0.3)' : '#fff' }}>
                  {day.theme}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {isPast && assessment?.score && (
                  <span className="text-sm font-bold" style={{ color: '#30D158' }}>{assessment.score}/10</span>
                )}
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', transition: 'transform 0.2s', display: 'inline-block', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
              </div>
            </div>
            {/* Competency pills — always visible */}
            {day.competenciesCovered && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {day.competenciesCovered.map(c => (
                  <span
                    key={c}
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      background: isCurrent ? 'rgba(10,132,255,0.12)' : isPast ? 'rgba(48,209,88,0.1)' : 'rgba(255,255,255,0.04)',
                      color: isCurrent ? '#0A84FF' : isPast ? '#30D158' : 'rgba(255,255,255,0.2)',
                    }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded detail panel */}
      {expanded && (
        <div
          style={{ borderTop: `1px solid ${isCurrent ? 'rgba(10,132,255,0.15)' : 'rgba(255,255,255,0.06)'}`, padding: '12px 16px 16px' }}
          onClick={e => e.stopPropagation()}
        >
          {isPast && assessment && level && (
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: level.bg, color: level.color, border: `1px solid ${level.border}` }}
              >
                {assessment.competencyLevel}
              </span>
              {assessment.gotRight && (
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>· {assessment.gotRight.slice(0, 80)}{assessment.gotRight.length > 80 ? '…' : ''}</span>
              )}
            </div>
          )}

          {isFuture && (
            <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>
              Complete Day {currentDay} to unlock this day.
            </p>
          )}

          {(isPast || isCurrent) && (
            <button
              onClick={() => { onLoadDay(day.day); navigate('/') }}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
              style={{
                background: isCurrent ? '#0A84FF' : 'rgba(48,209,88,0.12)',
                color: isCurrent ? '#fff' : '#30D158',
                border: 'none', cursor: 'pointer',
              }}
            >
              {isCurrent ? 'Go to Today →' : 'Review Day →'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function Roadmap() {
  const { roadmap, activeDay, progress, loadDay } = useApp()
  const weeks = [1, 2, 3]
  const doneCount = roadmap.filter(d => (progress?.taskCompletions?.[d.day]?.length || 0) > 0).length

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 lg:px-8 lg:py-10">
      <div className="mb-8">
        <p className="text-xs font-bold tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>APM FOUNDATIONS</p>
        <h1 className="text-2xl font-bold" style={{ letterSpacing: '-0.4px' }}>21-Day Roadmap</h1>
        <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {doneCount} of 21 days completed · Day {activeDay} in progress
        </p>
      </div>

      {/* Overall progress */}
      <div className="rounded-2xl p-4 mb-6" style={{ background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>Overall Progress</span>
          <span className="text-sm font-bold" style={{ color: '#30D158' }}>{Math.round((doneCount / 21) * 100)}%</span>
        </div>
        <div className="rounded-full h-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${(doneCount / 21) * 100}%`, background: 'linear-gradient(90deg, #0A84FF, #30D158)' }}
          />
        </div>
      </div>

      {weeks.map(week => {
        const days = roadmap.filter(d => d.week === week)
        const weekDone = days.filter(d => (progress?.taskCompletions?.[d.day]?.length || 0) > 0).length
        return (
          <div key={week} className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-xs font-bold tracking-widest" style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
                WEEK {week}
              </h2>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>
                {weekDone}/{days.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {days.map(day => (
                <DayCard
                  key={day.day}
                  day={day}
                  activeDay={activeDay}
                  progress={progress}
                  onLoadDay={loadDay}
                />
              ))}
            </div>
          </div>
        )
      })}

      <div className="h-6" />
    </div>
  )
}
