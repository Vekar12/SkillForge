const BASE = '/data/skills'

// In-memory cache and in-flight request deduplication
const cache = {}
const inflight = {}

async function fetchJSON(path) {
  if (Object.prototype.hasOwnProperty.call(cache, path)) return cache[path]
  if (inflight[path]) return inflight[path]
  inflight[path] = fetch(path)
    .then(res => {
      if (!res.ok) throw new Error(`Failed to load ${path}`)
      return res.json()
    })
    .then(data => {
      cache[path] = data
      delete inflight[path]
      return data
    })
    .catch(err => {
      delete inflight[path]
      throw err
    })
  return inflight[path]
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
