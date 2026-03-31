// GitHub Contents API — used as a lightweight database.
// All user data (profile, progress) lives in user-data/ in the repo.
// Groq keys are intentionally excluded and stay in localStorage only.
//
// Requires env vars:
//   VITE_GITHUB_TOKEN  — fine-grained PAT, contents:write on this repo only
//   VITE_GITHUB_REPO   — e.g. "Vekar12/SkillForge"
//
// Rate limits: 5 000 req/hr per token (shared across all users).
// Progress writes are debounced 2 s to keep usage low.

const TOKEN = import.meta.env.VITE_GITHUB_TOKEN
const REPO  = import.meta.env.VITE_GITHUB_REPO || 'Vekar12/SkillForge'
const BASE  = `https://api.github.com/repos/${REPO}/contents`

export const githubEnabled = () => !!TOKEN

// ── Low-level helpers ────────────────────────────────────────────────────────

function headers() {
  return {
    Authorization: `Bearer ${TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  }
}

async function ghGet(path) {
  const res = await fetch(`${BASE}/${path}`, { headers: headers() })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`GitHub GET ${path} → ${res.status}`)
  const data = await res.json()
  return {
    content: JSON.parse(atob(data.content.replace(/\n/g, ''))),
    sha: data.sha,
  }
}

async function ghPut(path, content, sha, message) {
  const body = {
    message,
    content: btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2)))),
    ...(sha ? { sha } : {}),
  }
  const res = await fetch(`${BASE}/${path}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `GitHub PUT ${path} → ${res.status}`)
  }
  return res.json()
}

// ── User registry ────────────────────────────────────────────────────────────
// user-data/users.json  →  [ { uid, name, email, createdAt, lastSeen }, … ]

export async function syncUser(user) {
  if (!TOKEN) return
  const path = 'user-data/users.json'
  const file = await ghGet(path)
  const users = file?.content || []
  const sha   = file?.sha || null
  const now   = new Date().toISOString()

  const idx = users.findIndex(u => u.uid === user.uid)
  if (idx === -1) {
    users.push({ uid: user.uid, name: user.name, email: user.email, createdAt: now, lastSeen: now })
  } else {
    users[idx] = { ...users[idx], name: user.name, email: user.email, lastSeen: now }
  }

  await ghPut(path, users, sha, `chore: user sync — ${user.email}`)

  // Also write individual profile
  await syncProfile(user)
}

async function syncProfile(user) {
  const path = `user-data/${user.uid}/profile.json`
  const file = await ghGet(path)
  const now  = new Date().toISOString()
  const profile = {
    uid:       user.uid,
    name:      user.name,
    email:     user.email,
    createdAt: file?.content?.createdAt || now,
    lastSeen:  now,
  }
  await ghPut(path, profile, file?.sha || null, `chore: profile sync — ${user.email}`)
}

// ── Progress ─────────────────────────────────────────────────────────────────
// user-data/{uid}/progress-{skillId}.json  →  full progress object

export async function loadProgress(uid, skillId) {
  if (!TOKEN) return null
  try {
    const file = await ghGet(`user-data/${uid}/progress-${skillId}.json`)
    return file?.content || null
  } catch {
    return null
  }
}

// Debounce map: uid+skillId → timer id
const _debounceMap = new Map()

export function saveProgressDebounced(uid, skillId, progress, delayMs = 2000) {
  if (!TOKEN) return
  const key = `${uid}:${skillId}`
  clearTimeout(_debounceMap.get(key))
  _debounceMap.set(key, setTimeout(() => {
    saveProgress(uid, skillId, progress).catch(err =>
      console.warn('GitHub progress save failed:', err.message)
    )
    _debounceMap.delete(key)
  }, delayMs))
}

export async function saveProgress(uid, skillId, progress) {
  if (!TOKEN) return
  const path = `user-data/${uid}/progress-${skillId}.json`
  const file = await ghGet(path)
  await ghPut(
    path,
    { ...progress, updatedAt: new Date().toISOString() },
    file?.sha || null,
    `progress: ${uid} / ${skillId} — day ${progress.currentDay}`
  )
}

// ── Skill requests ────────────────────────────────────────────────────────────
// user-data/skill-requests.csv  (append-only log)

const CSV_HEADER = 'timestamp,userEmail,userName,rawJson\n'

function escapeCsv(val) {
  const s = String(val ?? '').replace(/"/g, '""')
  return /[,"\n]/.test(s) ? `"${s}"` : s
}

export async function appendSkillRequest({ userEmail, userName, rawJson }) {
  if (!TOKEN) throw new Error('VITE_GITHUB_TOKEN not set')
  const path = 'user-data/skill-requests.csv'

  const res  = await fetch(`${BASE}/${path}`, { headers: headers() })
  let sha = null
  let existing = CSV_HEADER

  if (res.ok) {
    const data = await res.json()
    sha = data.sha
    existing = atob(data.content.replace(/\n/g, ''))
  } else if (res.status !== 404) {
    throw new Error(`GitHub API error ${res.status}`)
  }

  const row = [
    escapeCsv(new Date().toISOString()),
    escapeCsv(userEmail),
    escapeCsv(userName),
    escapeCsv(rawJson),
  ].join(',') + '\n'

  const updated = existing + row
  const body = {
    message: `feat: skill request from ${userName || userEmail}`,
    content: btoa(unescape(encodeURIComponent(updated))),
    ...(sha ? { sha } : {}),
  }
  const put = await fetch(`${BASE}/${path}`, {
    method: 'PUT', headers: headers(), body: JSON.stringify(body),
  })
  if (!put.ok) {
    const err = await put.json().catch(() => ({}))
    throw new Error(err.message || `GitHub PUT failed: ${put.status}`)
  }
}
