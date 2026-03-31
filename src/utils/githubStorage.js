// Stores skill requests as rows in a CSV file inside the GitHub repo.
// Requires VITE_GITHUB_TOKEN (fine-grained PAT, contents:write on this repo)
// and VITE_GITHUB_REPO (e.g. "Vekar12/SkillForge").
//
// Security note: the PAT is visible in the JS bundle — use a fine-grained
// token scoped to this repo only with contents:write and nothing else.

const TOKEN = import.meta.env.VITE_GITHUB_TOKEN
const REPO  = import.meta.env.VITE_GITHUB_REPO || 'Vekar12/SkillForge'
const FILE  = 'skill-requests.csv'
const API   = `https://api.github.com/repos/${REPO}/contents/${FILE}`

const CSV_HEADER = 'timestamp,userEmail,userName,rawJson\n'

function escapeCsvField(val) {
  const s = String(val ?? '').replace(/"/g, '""')
  return /[,"\n]/.test(s) ? `"${s}"` : s
}

export async function appendSkillRequest({ userEmail, userName, rawJson }) {
  if (!TOKEN) throw new Error('VITE_GITHUB_TOKEN not set')

  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  // 1. Fetch current file (may not exist yet)
  let sha = null
  let existing = CSV_HEADER

  const res = await fetch(API, { headers })
  if (res.ok) {
    const data = await res.json()
    sha = data.sha
    existing = atob(data.content.replace(/\n/g, ''))
  } else if (res.status !== 404) {
    throw new Error(`GitHub API error ${res.status}`)
  }

  // 2. Append new row
  const row = [
    escapeCsvField(new Date().toISOString()),
    escapeCsvField(userEmail),
    escapeCsvField(userName),
    escapeCsvField(rawJson),
  ].join(',') + '\n'

  const updated = existing + row

  // 3. Commit back
  const body = {
    message: `feat: skill request from ${userName || userEmail}`,
    content: btoa(unescape(encodeURIComponent(updated))),
    ...(sha ? { sha } : {}),
  }

  const put = await fetch(API, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!put.ok) {
    const err = await put.json().catch(() => ({}))
    throw new Error(err.message || `GitHub PUT failed: ${put.status}`)
  }
}
