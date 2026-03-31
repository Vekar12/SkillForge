import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  initProgress, getProgress, saveProgress,
  markTaskComplete, markTaskIncomplete,
  isTaskComplete, areDayTasksDone,
  isDayUnlocked, saveAssessment,
  getActiveDay,
} from './progress'

// ── localStorage mock ─────────────────────────────────────────────────────────
const store = {}
vi.stubGlobal('localStorage', {
  getItem:  (k) => store[k] ?? null,
  setItem:  (k, v) => { store[k] = v },
  removeItem: (k) => { delete store[k] },
})

beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k])
})

// ── initProgress ──────────────────────────────────────────────────────────────
describe('initProgress', () => {
  it('creates fresh progress for new user', () => {
    const p = initProgress('u1', 'apm')
    expect(p.currentDay).toBe(1)
    expect(p.taskCompletions).toEqual({})
    expect(p.assessments).toEqual({})
  })

  it('returns existing progress without overwriting', () => {
    initProgress('u1', 'apm')
    markTaskComplete('u1', 'apm', 1, 'task-a')
    const p2 = initProgress('u1', 'apm')
    expect(p2.taskCompletions[1]).toContain('task-a')
  })
})

// ── markTaskComplete / markTaskIncomplete ─────────────────────────────────────
describe('markTaskComplete', () => {
  it('adds task to completions', () => {
    const p = markTaskComplete('u1', 'apm', 1, 'task-a')
    expect(p.taskCompletions[1]).toContain('task-a')
  })

  it('does not duplicate task', () => {
    markTaskComplete('u1', 'apm', 1, 'task-a')
    const p = markTaskComplete('u1', 'apm', 1, 'task-a')
    expect(p.taskCompletions[1].filter(x => x === 'task-a').length).toBe(1)
  })
})

describe('markTaskIncomplete', () => {
  it('removes task from completions', () => {
    markTaskComplete('u1', 'apm', 1, 'task-a')
    const p = markTaskIncomplete('u1', 'apm', 1, 'task-a')
    expect(p.taskCompletions[1]).not.toContain('task-a')
  })

  it('is safe when task was never completed', () => {
    initProgress('u1', 'apm')
    expect(() => markTaskIncomplete('u1', 'apm', 1, 'task-x')).not.toThrow()
  })
})

// ── isTaskComplete ────────────────────────────────────────────────────────────
describe('isTaskComplete', () => {
  it('returns true when task is completed', () => {
    const p = markTaskComplete('u1', 'apm', 1, 'task-a')
    expect(isTaskComplete(p, 1, 'task-a')).toBe(true)
  })

  it('returns false when task is not completed', () => {
    const p = initProgress('u1', 'apm')
    expect(isTaskComplete(p, 1, 'task-a')).toBe(false)
  })

  it('returns false for null progress', () => {
    expect(isTaskComplete(null, 1, 'task-a')).toBe(false)
  })
})

// ── areDayTasksDone ───────────────────────────────────────────────────────────
describe('areDayTasksDone', () => {
  const tasks = [{ id: 'r1' }, { id: 's1' }, { id: 'a1' }]

  it('returns false when no tasks done', () => {
    const p = initProgress('u1', 'apm')
    expect(areDayTasksDone(p, 1, tasks)).toBe(false)
  })

  it('returns false when only some tasks done', () => {
    markTaskComplete('u1', 'apm', 1, 'r1')
    const p = getProgress('u1', 'apm')
    expect(areDayTasksDone(p, 1, tasks)).toBe(false)
  })

  it('returns true when all tasks done', () => {
    markTaskComplete('u1', 'apm', 1, 'r1')
    markTaskComplete('u1', 'apm', 1, 's1')
    markTaskComplete('u1', 'apm', 1, 'a1')
    const p = getProgress('u1', 'apm')
    expect(areDayTasksDone(p, 1, tasks)).toBe(true)
  })

  it('returns true for empty task list', () => {
    const p = initProgress('u1', 'apm')
    expect(areDayTasksDone(p, 1, [])).toBe(true)
  })
})

// ── isDayUnlocked ─────────────────────────────────────────────────────────────
describe('isDayUnlocked', () => {
  it('day 1 is always unlocked', () => {
    expect(isDayUnlocked(null, 1)).toBe(true)
  })

  it('day 2 locked when currentDay is 1 (no prevDayTasks)', () => {
    const p = initProgress('u1', 'apm') // currentDay = 1
    expect(isDayUnlocked(p, 2)).toBe(false)
  })

  it('day 2 unlocked when currentDay >= 2 (no prevDayTasks)', () => {
    const p = initProgress('u1', 'apm')
    p.currentDay = 2
    expect(isDayUnlocked(p, 2)).toBe(true)
  })

  it('uses prevDayTasks when provided — locked if day 1 incomplete', () => {
    const p = initProgress('u1', 'apm')
    const prevTasks = [{ id: 'r1' }, { id: 's1' }]
    expect(isDayUnlocked(p, 2, prevTasks)).toBe(false)
  })

  it('uses prevDayTasks when provided — unlocked if day 1 complete', () => {
    markTaskComplete('u1', 'apm', 1, 'r1')
    markTaskComplete('u1', 'apm', 1, 's1')
    const p = getProgress('u1', 'apm')
    const prevTasks = [{ id: 'r1' }, { id: 's1' }]
    expect(isDayUnlocked(p, 2, prevTasks)).toBe(true)
  })
})

// ── saveAssessment ────────────────────────────────────────────────────────────
describe('saveAssessment', () => {
  it('stores assessment result', () => {
    initProgress('u1', 'apm')
    const p = saveAssessment('u1', 'apm', 1, { score: 8, level: 'Strong' })
    expect(p.assessments[1].score).toBe(8)
    expect(p.assessments[1].submittedAt).toBeDefined()
  })

  it('advances currentDay from 1 to 2', () => {
    initProgress('u1', 'apm')
    const p = saveAssessment('u1', 'apm', 1, { score: 7 })
    expect(p.currentDay).toBe(2)
  })

  it('does not advance currentDay if submitting for a past day', () => {
    const init = initProgress('u1', 'apm')
    init.currentDay = 3
    saveProgress('u1', 'apm', init)
    const p = saveAssessment('u1', 'apm', 1, { score: 5 }) // re-submitting day 1
    expect(p.currentDay).toBe(3) // unchanged
  })
})

// ── getActiveDay ──────────────────────────────────────────────────────────────
describe('getActiveDay', () => {
  it('returns day 1 when no progress', () => {
    expect(getActiveDay(null, [])).toBe(1)
  })

  it('returns first incomplete day', () => {
    markTaskComplete('u1', 'apm', 1, 'r1')
    const p = getProgress('u1', 'apm')
    const allDays = [
      { day: 1, tasks: [{ id: 'r1' }] },
      { day: 2, tasks: [{ id: 'r2' }] },
    ]
    expect(getActiveDay(p, allDays)).toBe(2)
  })

  it('returns last day when everything complete', () => {
    markTaskComplete('u1', 'apm', 1, 'r1')
    markTaskComplete('u1', 'apm', 2, 'r2')
    const p = getProgress('u1', 'apm')
    const allDays = [
      { day: 1, tasks: [{ id: 'r1' }] },
      { day: 2, tasks: [{ id: 'r2' }] },
    ]
    expect(getActiveDay(p, allDays)).toBe(2)
  })
})
