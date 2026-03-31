// Progress is stored in localStorage as:
// sf_progress_{userId}_{skillId} = {
//   startDate: "2026-03-31",
//   currentDay: 1,
//   taskCompletions: { "1": ["d1t1", "d1t2"], "2": ["d2t1"] },
//   assessments: { "1": { score: 7, level: "On Track", submittedAt: "..." } },
//   lastActiveDate: "2026-03-31"
// }

const KEY = (userId, skillId) => `sf_progress_${userId}_${skillId}`

export function getProgress(userId, skillId) {
  try {
    const raw = localStorage.getItem(KEY(userId, skillId))
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

export function saveProgress(userId, skillId, progress) {
  localStorage.setItem(KEY(userId, skillId), JSON.stringify(progress))
}

export function initProgress(userId, skillId) {
  const existing = getProgress(userId, skillId)
  if (existing) return existing
  const fresh = {
    startDate: new Date().toISOString().split('T')[0],
    currentDay: 1,
    taskCompletions: {},
    assessments: {},
    lastActiveDate: new Date().toISOString().split('T')[0],
  }
  saveProgress(userId, skillId, fresh)
  return fresh
}

export function markTaskComplete(userId, skillId, day, taskId) {
  const p = getProgress(userId, skillId) || initProgress(userId, skillId)
  if (!p.taskCompletions[day]) p.taskCompletions[day] = []
  if (!p.taskCompletions[day].includes(taskId)) {
    p.taskCompletions[day].push(taskId)
  }
  saveProgress(userId, skillId, p)
  return p
}

export function markTaskIncomplete(userId, skillId, day, taskId) {
  const p = getProgress(userId, skillId) || initProgress(userId, skillId)
  if (p.taskCompletions[day]) {
    p.taskCompletions[day] = p.taskCompletions[day].filter(id => id !== taskId)
  }
  saveProgress(userId, skillId, p)
  return p
}

export function isTaskComplete(progress, day, taskId) {
  return progress?.taskCompletions?.[day]?.includes(taskId) || false
}

export function getDayCompletionCount(progress, day, totalTasks) {
  return progress?.taskCompletions?.[day]?.length || 0
}

export function areDayTasksDone(progress, day, tasks) {
  const completed = progress?.taskCompletions?.[day] || []
  return tasks.every(t => completed.includes(t.id))
}

// Current active day = lowest day where not all tasks are complete
// If all days done, returns last day
export function getActiveDay(progress, allDayData) {
  if (!progress) return 1
  for (const day of allDayData) {
    const done = areDayTasksDone(progress, day.day, day.tasks || [])
    if (!done) return day.day
  }
  return allDayData[allDayData.length - 1]?.day || 1
}

// Day N unlocks when Day N-1 is fully complete.
// Pass prevDayTasks (array of task objects) for an accurate check.
// If prevDayTasks is omitted, falls back to progress.currentDay.
export function isDayUnlocked(progress, day, prevDayTasks = null) {
  if (day === 1) return true
  if (prevDayTasks !== null) {
    return areDayTasksDone(progress, day - 1, prevDayTasks)
  }
  return (progress?.currentDay || 1) >= day
}

export function saveAssessment(userId, skillId, day, result) {
  const p = getProgress(userId, skillId) || initProgress(userId, skillId)
  p.assessments[day] = { ...result, submittedAt: new Date().toISOString() }
  // Advance current day if this was the current day
  if (p.currentDay === day) {
    p.currentDay = day + 1
  }
  p.lastActiveDate = new Date().toISOString().split('T')[0]
  saveProgress(userId, skillId, p)
  return p
}

export function getAllEnrolledProgress(userId, skillIds) {
  return skillIds.map(id => ({
    skillId: id,
    progress: getProgress(userId, id),
  }))
}
