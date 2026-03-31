const BASE = '/data/skills'

// Cache fetched data in memory
const cache = {}

async function fetchJSON(path) {
  if (cache[path]) return cache[path]
  const res = await fetch(path)
  if (!res.ok) throw new Error(`Failed to load ${path}`)
  const data = await res.json()
  cache[path] = data
  return data
}

export async function loadSkillsCatalog() {
  return fetchJSON(`/data/skills/index.json`)
}

export async function loadRoadmap(skillId) {
  return fetchJSON(`${BASE}/${skillId}/roadmap.json`)
}

export async function loadDayData(skillId, day) {
  return fetchJSON(`${BASE}/${skillId}/days/${day}.json`)
}

export async function loadMultipleDays(skillId, days) {
  return Promise.all(days.map(d => loadDayData(skillId, d)))
}
