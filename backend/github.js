const { Octokit } = require('@octokit/rest');
const { decrypt } = require('./crypto');

function octokit() {
  return new Octokit({ auth: process.env.GITHUB_TOKEN });
}

function repoParts() {
  const [owner, repo] = (process.env.GITHUB_DATA_REPO || '').split('/');
  return { owner, repo };
}

// ── File helpers ──────────────────────────────────────────────

async function readFile(path) {
  try {
    const { owner, repo } = repoParts();
    const { data } = await octokit().repos.getContent({ owner, repo, path });
    return {
      data: JSON.parse(Buffer.from(data.content, 'base64').toString('utf8')),
      sha: data.sha,
    };
  } catch (err) {
    if (err.status === 404) return { data: null, sha: null };
    throw err;
  }
}

async function writeFile(path, data, sha = null) {
  const { owner, repo } = repoParts();
  const params = {
    owner, repo, path,
    message: `skillforge: update ${path}`,
    content: Buffer.from(JSON.stringify(data, null, 2)).toString('base64'),
  };
  if (sha) params.sha = sha;
  await octokit().repos.createOrUpdateFileContents(params);
}

// ── Path conventions ──────────────────────────────────────────

const statePath  = (u, s) => `db/users/${u}/${s}/state.json`;
const tasksPath  = (u, s) => `db/users/${u}/${s}/tasks.json`;
const assmtPath  = (u, s) => `db/users/${u}/${s}/assessments.json`;
const openPtsPath = (u, s) => `db/users/${u}/${s}/open_points.json`;
const settingsPath = (u)   => `db/settings/${u}.json`;
const requestsPath = ()    => `db/skill_requests.json`;

// ── STATE: { key: value } per user+skill ──────────────────────

async function getStateForUser(userId, skillId, key) {
  const { data } = await readFile(statePath(userId, skillId));
  return data?.[key] ?? null;
}

async function setStateForUser(userId, skillId, key, value) {
  const path = statePath(userId, skillId);
  const { data, sha } = await readFile(path);
  const updated = { ...(data || {}), [key]: String(value) };
  await writeFile(path, updated, sha);
}

async function getUserSkills(userId) {
  // List all skillId directories under db/users/{userId}/
  try {
    const { owner, repo } = repoParts();
    const { data } = await octokit().repos.getContent({
      owner, repo, path: `db/users/${userId}`,
    });
    const skills = [];
    for (const entry of data) {
      if (entry.type === 'dir') {
        const currentDay = await getStateForUser(userId, entry.name, 'current_day');
        if (currentDay) skills.push({ skillId: entry.name, currentDay });
      }
    }
    return skills;
  } catch (err) {
    if (err.status === 404) return [];
    throw err;
  }
}

// ── TASKS: [ { day, taskId, type, status, completedAt } ] ─────

async function getTasksForUser(userId, skillId, day) {
  const { data } = await readFile(tasksPath(userId, skillId));
  return (data || []).filter(t => String(t.day) === String(day));
}

async function getAllTasksForUserSkill(userId, skillId) {
  const { data } = await readFile(tasksPath(userId, skillId));
  return (data || []).map(t => ({ ...t, day: Number(t.day) }));
}

async function appendTaskCompletionForUser(userId, skillId, day, taskId, type, status = 'completed') {
  const path = tasksPath(userId, skillId);
  const { data, sha } = await readFile(path);
  const tasks = data || [];
  tasks.push({ day: Number(day), taskId, type, status, completedAt: new Date().toISOString() });
  await writeFile(path, tasks, sha);
}

// ── ASSESSMENTS: [ { day, gotRight, ... } ] ───────────────────

async function appendAssessmentForUser(userId, skillId, day, parsed) {
  const path = assmtPath(userId, skillId);
  const { data, sha } = await readFile(path);
  const assessments = data || [];
  assessments.push({
    day: Number(day),
    gotRight: parsed.gotRight,
    needsCorrection: parsed.needsCorrection,
    blindSpots: parsed.blindSpots,
    indiaNote: parsed.indiaNote,
    openPoints: parsed.openPoints,
    score: parsed.score,
    competencyName: parsed.competencyName,
    competencyLevel: parsed.competencyLevel,
    rawFeedback: parsed.rawFeedback,
    submittedAt: new Date().toISOString(),
  });
  await writeFile(path, assessments, sha);
}

async function getAssessmentForUser(userId, skillId, day) {
  const { data } = await readFile(assmtPath(userId, skillId));
  return (data || []).find(a => Number(a.day) === Number(day)) || null;
}

async function getAllAssessmentScoresForUser(userId, skillId) {
  const { data } = await readFile(assmtPath(userId, skillId));
  return (data || []).map(a => ({
    day: Number(a.day),
    score: Number(a.score),
    competencyName: a.competencyName,
    competencyLevel: a.competencyLevel,
  }));
}

// ── OPEN POINTS: [ { pointId, point, sourceDay, status } ] ────

async function appendOpenPointsForUser(openPoints, sourceDay, userId, skillId) {
  if (!openPoints.length) return;
  const path = openPtsPath(userId, skillId);
  const { data, sha } = await readFile(path);
  const existing = data || [];
  const newPoints = openPoints.map((point, i) => ({
    pointId: `${userId}_${skillId}_D${sourceDay}_P${i + 1}`,
    point,
    sourceDay: Number(sourceDay),
    status: 'open',
  }));
  await writeFile(path, [...existing, ...newPoints], sha);
}

// ── SKILL REQUESTS: [ { requestId, userId, ... } ] ────────────

async function getSkillRequests(status = null) {
  const { data } = await readFile(requestsPath());
  const all = data || [];
  return status ? all.filter(r => r.status === status) : all;
}

async function getSkillRequestById(requestId) {
  const all = await getSkillRequests();
  return all.find(r => r.requestId === requestId) || null;
}

async function appendSkillRequest({ userId, skillTitle, status, generatedSpec }) {
  const path = requestsPath();
  const { data, sha } = await readFile(path);
  const requests = data || [];
  const requestId = `REQ_${Date.now()}`;
  requests.push({
    requestId, userId, skillTitle, status,
    generatedSpec: generatedSpec ? JSON.parse(generatedSpec) : null,
    reviewedBy: '', reviewNote: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  await writeFile(path, requests, sha);
  return requestId;
}

async function updateSkillRequest(requestId, updates) {
  const path = requestsPath();
  const { data, sha } = await readFile(path);
  const requests = (data || []).map(r =>
    r.requestId === requestId
      ? { ...r, ...updates, updatedAt: new Date().toISOString() }
      : r
  );
  await writeFile(path, requests, sha);
}

// ── USER SETTINGS: { encryptedKey, iv, authTag, updatedAt } ───

async function getUserSettings(userId) {
  const { data } = await readFile(settingsPath(userId));
  return data;
}

async function upsertUserSettings(userId, { encryptedKey, iv, authTag }) {
  const path = settingsPath(userId);
  const { sha } = await readFile(path);
  await writeFile(path, { encryptedKey, iv, authTag, updatedAt: new Date().toISOString() }, sha);
}

async function deleteUserSettings(userId) {
  const path = settingsPath(userId);
  const { sha } = await readFile(path);
  if (sha) await writeFile(path, { encryptedKey: '', iv: '', authTag: '', updatedAt: new Date().toISOString() }, sha);
}

async function getDecryptedGroqKey(userId) {
  const settings = await getUserSettings(userId);
  if (!settings?.encryptedKey || !process.env.ENCRYPTION_KEY) return null;
  try {
    return decrypt(settings.encryptedKey, settings.iv, settings.authTag);
  } catch {
    return null;
  }
}

module.exports = {
  getStateForUser,
  setStateForUser,
  getUserSkills,
  getTasksForUser,
  getAllTasksForUserSkill,
  appendTaskCompletionForUser,
  appendAssessmentForUser,
  getAssessmentForUser,
  getAllAssessmentScoresForUser,
  appendOpenPointsForUser,
  getSkillRequests,
  getSkillRequestById,
  appendSkillRequest,
  updateSkillRequest,
  getUserSettings,
  upsertUserSettings,
  deleteUserSettings,
  getDecryptedGroqKey,
};
