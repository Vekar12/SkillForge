const fs = require('fs');
const path = require('path');
const { decrypt } = require('./crypto');

const DB = path.join(__dirname, 'data/db');

// ── CSV helpers ───────────────────────────────────────────────

function parseRow(line) {
  const result = [];
  let cur = '', inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(cur); cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

function parseCSV(text) {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 1) return { headers: [], rows: [] };
  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).map(parseRow);
  return { headers, rows };
}

function encodeField(val) {
  const s = String(val ?? '');
  return (s.includes(',') || s.includes('"') || s.includes('\n'))
    ? '"' + s.replace(/"/g, '""') + '"'
    : s;
}

function rowToCSV(row) {
  return row.map(encodeField).join(',');
}

function readCSV(file) {
  const text = fs.readFileSync(path.join(DB, file), 'utf8');
  return parseCSV(text);
}

function writeCSV(file, headers, rows) {
  const lines = [headers.join(','), ...rows.map(rowToCSV)].join('\n') + '\n';
  fs.writeFileSync(path.join(DB, file), lines, 'utf8');
}

function appendCSV(file, row) {
  fs.appendFileSync(path.join(DB, file), rowToCSV(row) + '\n', 'utf8');
}

// ── STATE: userId | skillId | key | value ─────────────────────

function getStateForUser(userId, skillId, key) {
  const { rows } = readCSV('state.csv');
  const row = rows.find(r => r[0] === userId && r[1] === skillId && r[2] === key);
  return Promise.resolve(row ? row[3] : null);
}

function setStateForUser(userId, skillId, key, value) {
  const { headers, rows } = readCSV('state.csv');
  const idx = rows.findIndex(r => r[0] === userId && r[1] === skillId && r[2] === key);
  if (idx === -1) {
    appendCSV('state.csv', [userId, skillId, key, String(value)]);
  } else {
    rows[idx] = [userId, skillId, key, String(value)];
    writeCSV('state.csv', headers, rows);
  }
  return Promise.resolve();
}

function getUserSkills(userId) {
  const { rows } = readCSV('state.csv');
  const skills = rows
    .filter(r => r[0] === userId && r[2] === 'current_day')
    .map(r => ({ skillId: r[1], currentDay: r[3] }));
  return Promise.resolve(skills);
}

// ── TASKS: day | taskId | type | status | completedAt | skillId | userId ──

function getTasksForUser(userId, skillId, day) {
  const { rows } = readCSV('tasks.csv');
  const result = rows
    .filter(r => r[6] === userId && r[5] === skillId && String(r[0]) === String(day))
    .map(r => ({ day: r[0], taskId: r[1], type: r[2], status: r[3], completedAt: r[4] }));
  return Promise.resolve(result);
}

function getAllTasksForUserSkill(userId, skillId) {
  const { rows } = readCSV('tasks.csv');
  const result = rows
    .filter(r => r[6] === userId && r[5] === skillId)
    .map(r => ({ day: Number(r[0]), taskId: r[1], type: r[2], status: r[3] }));
  return Promise.resolve(result);
}

function appendTaskCompletionForUser(userId, skillId, day, taskId, type, status = 'completed') {
  appendCSV('tasks.csv', [day, taskId, type, status, new Date().toISOString(), skillId, userId]);
  return Promise.resolve();
}

// ── ASSESSMENTS ───────────────────────────────────────────────

function appendAssessmentForUser(userId, skillId, day, parsed) {
  appendCSV('assessments.csv', [
    day,
    parsed.gotRight.join(' | '),
    parsed.needsCorrection.join(' | '),
    parsed.blindSpots.join(' | '),
    parsed.indiaNote,
    parsed.openPoints.join(' | '),
    parsed.score,
    parsed.competencyName,
    parsed.competencyLevel,
    parsed.rawFeedback,
    new Date().toISOString(),
    skillId,
    userId,
  ]);
  return Promise.resolve();
}

function getAssessmentForUser(userId, skillId, day) {
  const { rows } = readCSV('assessments.csv');
  const row = rows.find(r => r[12] === userId && r[11] === skillId && String(r[0]) === String(day));
  if (!row) return Promise.resolve(null);
  return Promise.resolve({
    day: row[0],
    gotRight: row[1]?.split(' | ') || [],
    needsCorrection: row[2]?.split(' | ') || [],
    blindSpots: row[3]?.split(' | ') || [],
    indiaNote: row[4],
    openPoints: row[5]?.split(' | ') || [],
    score: Number(row[6]),
    competencyName: row[7],
    competencyLevel: row[8],
    submittedAt: row[10],
  });
}

function getAllAssessmentScoresForUser(userId, skillId) {
  const { rows } = readCSV('assessments.csv');
  const result = rows
    .filter(r => r[12] === userId && r[11] === skillId)
    .map(r => ({
      day: Number(r[0]),
      score: Number(r[6]),
      competencyName: r[7],
      competencyLevel: r[8],
    }));
  return Promise.resolve(result);
}

// ── OPEN POINTS ───────────────────────────────────────────────

function appendOpenPointsForUser(openPoints, sourceDay, userId, skillId) {
  for (let i = 0; i < openPoints.length; i++) {
    appendCSV('open_points.csv', [
      `${userId}_${skillId}_D${sourceDay}_P${i + 1}`,
      openPoints[i],
      sourceDay,
      'open',
      skillId,
      userId,
    ]);
  }
  return Promise.resolve();
}

// ── SKILL REQUESTS ────────────────────────────────────────────

function getSkillRequests(status = null) {
  const { rows } = readCSV('skill_requests.csv');
  const all = rows.map(r => ({
    requestId: r[0],
    userId: r[1],
    skillTitle: r[2],
    status: r[3],
    generatedSpec: (() => { try { return r[4] ? JSON.parse(r[4]) : null; } catch { return null; } })(),
    reviewedBy: r[5],
    reviewNote: r[6],
    createdAt: r[7],
    updatedAt: r[8],
  }));
  return Promise.resolve(status ? all.filter(r => r.status === status) : all);
}

async function getSkillRequestById(requestId) {
  const all = await getSkillRequests();
  return all.find(r => r.requestId === requestId) || null;
}

function appendSkillRequest({ userId, skillTitle, status, generatedSpec }) {
  const requestId = `REQ_${Date.now()}`;
  const now = new Date().toISOString();
  appendCSV('skill_requests.csv', [requestId, userId, skillTitle, status, generatedSpec, '', '', now, now]);
  return Promise.resolve(requestId);
}

function updateSkillRequest(requestId, updates) {
  const { headers, rows } = readCSV('skill_requests.csv');
  const idx = rows.findIndex(r => r[0] === requestId);
  if (idx === -1) return Promise.resolve();
  const row = rows[idx];
  rows[idx] = [
    row[0], row[1], row[2],
    updates.status ?? row[3],
    row[4],
    updates.reviewedBy ?? row[5],
    updates.reviewNote ?? row[6],
    row[7],
    new Date().toISOString(),
  ];
  writeCSV('skill_requests.csv', headers, rows);
  return Promise.resolve();
}

// ── USER SETTINGS ─────────────────────────────────────────────

function getUserSettings(userId) {
  const { rows } = readCSV('settings.csv');
  const row = rows.find(r => r[0] === userId);
  if (!row) return Promise.resolve(null);
  return Promise.resolve({ encryptedKey: row[1], iv: row[2], authTag: row[3] });
}

function upsertUserSettings(userId, { encryptedKey, iv, authTag }) {
  const { headers, rows } = readCSV('settings.csv');
  const idx = rows.findIndex(r => r[0] === userId);
  const row = [userId, encryptedKey, iv, authTag, new Date().toISOString()];
  if (idx === -1) {
    appendCSV('settings.csv', row);
  } else {
    rows[idx] = row;
    writeCSV('settings.csv', headers, rows);
  }
  return Promise.resolve();
}

function deleteUserSettings(userId) {
  const { headers, rows } = readCSV('settings.csv');
  const filtered = rows.filter(r => r[0] !== userId);
  writeCSV('settings.csv', headers, filtered);
  return Promise.resolve();
}

async function getDecryptedGroqKey(userId) {
  const settings = await getUserSettings(userId);
  if (!settings?.encryptedKey || !process.env.ENCRYPTION_KEY) return null;
  try { return decrypt(settings.encryptedKey, settings.iv, settings.authTag); }
  catch { return null; }
}

module.exports = {
  getStateForUser, setStateForUser, getUserSkills,
  getTasksForUser, getAllTasksForUserSkill, appendTaskCompletionForUser,
  appendAssessmentForUser, getAssessmentForUser, getAllAssessmentScoresForUser,
  appendOpenPointsForUser,
  getSkillRequests, getSkillRequestById, appendSkillRequest, updateSkillRequest,
  getUserSettings, upsertUserSettings, deleteUserSettings, getDecryptedGroqKey,
};
