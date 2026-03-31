const { google } = require('googleapis');
const { decrypt } = require('./crypto');

// Build a Sheets client from .env service account
function getClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

const SID = () => process.env.SPREADSHEET_ID;

// ── Low-level helpers ─────────────────────────────────────────

async function getRows(tab) {
  const client = getClient();
  const res = await client.spreadsheets.values.get({
    spreadsheetId: SID(),
    range: `${tab}!A:Z`,
  });
  return res.data.values || [];
}

async function appendRow(tab, row) {
  const client = getClient();
  await client.spreadsheets.values.append({
    spreadsheetId: SID(),
    range: `${tab}!A:Z`,
    valueInputOption: 'RAW',
    requestBody: { values: [row] },
  });
}

async function updateRow(tab, rowIndex, row) {
  const client = getClient();
  await client.spreadsheets.values.update({
    spreadsheetId: SID(),
    range: `${tab}!A${rowIndex}:Z${rowIndex}`,
    valueInputOption: 'RAW',
    requestBody: { values: [row] },
  });
}

// ── STATE: userId | skillId | key | value ─────────────────────

async function getStateForUser(userId, skillId, key) {
  const rows = await getRows('STATE');
  const row = rows.find(r => r[0] === userId && r[1] === skillId && r[2] === key);
  return row ? row[3] : null;
}

async function setStateForUser(userId, skillId, key, value) {
  const rows = await getRows('STATE');
  const idx = rows.findIndex(r => r[0] === userId && r[1] === skillId && r[2] === key);
  if (idx === -1) {
    await appendRow('STATE', [userId, skillId, key, String(value)]);
  } else {
    await updateRow('STATE', idx + 1, [userId, skillId, key, String(value)]);
  }
}

async function getUserSkills(userId) {
  const rows = await getRows('STATE');
  const enrollments = rows
    .filter(r => r[0] === userId && r[2] === 'current_day')
    .map(r => ({ skillId: r[1], currentDay: r[3] }));
  return enrollments;
}

// ── TASKS: day | taskId | type | status | completedAt | skillId | userId ──

async function getTasksForUser(userId, skillId, day) {
  const rows = await getRows('TASKS');
  return rows
    .slice(1)
    .filter(r => r[6] === userId && r[5] === skillId && String(r[0]) === String(day))
    .map(r => ({ day: r[0], taskId: r[1], type: r[2], status: r[3], completedAt: r[4] }));
}

// Fetch all tasks for a user+skill in one API call (avoids N+1 in roadmap endpoint)
async function getAllTasksForUserSkill(userId, skillId) {
  const rows = await getRows('TASKS');
  return rows
    .slice(1)
    .filter(r => r[6] === userId && r[5] === skillId)
    .map(r => ({ day: Number(r[0]), taskId: r[1], type: r[2], status: r[3] }));
}

async function appendTaskCompletionForUser(userId, skillId, day, taskId, type, status = 'completed') {
  await appendRow('TASKS', [day, taskId, type, status, new Date().toISOString(), skillId, userId]);
}

// ── ASSESSMENTS: day | gotRight | needsCorrection | blindSpots | indiaNote |
//                openPoints | score | competencyName | competencyLevel |
//                rawFeedback | completedAt | skillId | userId ──────────────

async function appendAssessmentForUser(userId, skillId, day, parsed) {
  await appendRow('ASSESSMENTS', [
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
}

async function getAssessmentForUser(userId, skillId, day) {
  const rows = await getRows('ASSESSMENTS');
  const row = rows.slice(1).find(
    r => r[12] === userId && r[11] === skillId && String(r[0]) === String(day)
  );
  if (!row) return null;
  return {
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
  };
}

async function getAllAssessmentScoresForUser(userId, skillId) {
  const rows = await getRows('ASSESSMENTS');
  return rows
    .slice(1)
    .filter(r => r[12] === userId && r[11] === skillId)
    .map(r => ({
      day: Number(r[0]),
      score: Number(r[6]),
      competencyName: r[7],
      competencyLevel: r[8],
    }));
}

// ── OPEN_POINTS: pointId | point | sourceDay | status | skillId | userId ──

async function appendOpenPointsForUser(openPoints, sourceDay, userId, skillId) {
  if (!openPoints.length) return;
  for (let i = 0; i < openPoints.length; i++) {
    await appendRow('OPEN_POINTS', [
      `${userId}_${skillId}_D${sourceDay}_P${i + 1}`,
      openPoints[i],
      sourceDay,
      'open',
      skillId,
      userId,
    ]);
  }
}

// ── SKILL_REQUESTS: requestId | userId | skillTitle | status |
//                   generatedSpec | reviewedBy | reviewNote | createdAt | updatedAt ──

async function getSkillRequests(status = null) {
  const rows = await getRows('SKILL_REQUESTS');
  const data = rows.slice(1).map(r => ({
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
  return status ? data.filter(r => r.status === status) : data;
}

async function getSkillRequestById(requestId) {
  const requests = await getSkillRequests();
  return requests.find(r => r.requestId === requestId) || null;
}

async function appendSkillRequest({ userId, skillTitle, status, generatedSpec }) {
  const requestId = `REQ_${Date.now()}`;
  await appendRow('SKILL_REQUESTS', [
    requestId, userId, skillTitle, status, generatedSpec, '', '', new Date().toISOString(), new Date().toISOString(),
  ]);
  return requestId;
}

async function updateSkillRequest(requestId, updates) {
  const rows = await getRows('SKILL_REQUESTS');
  const idx = rows.findIndex(r => r[0] === requestId);
  if (idx === -1) return;
  const row = rows[idx];
  await updateRow('SKILL_REQUESTS', idx + 1, [
    row[0],
    row[1],
    row[2],
    updates.status ?? row[3],
    row[4],
    updates.reviewedBy ?? row[5],
    updates.reviewNote ?? row[6],
    row[7],
    new Date().toISOString(),
  ]);
}

// ── USER_SETTINGS: userId | encryptedKey | iv | authTag | updatedAt ──────────

async function getUserSettings(userId) {
  const rows = await getRows('USER_SETTINGS');
  const row = rows.find(r => r[0] === userId);
  if (!row) return null;
  return { encryptedKey: row[1], iv: row[2], authTag: row[3] };
}

async function upsertUserSettings(userId, { encryptedKey, iv, authTag }) {
  const rows = await getRows('USER_SETTINGS');
  const idx = rows.findIndex(r => r[0] === userId);
  const row = [userId, encryptedKey, iv, authTag, new Date().toISOString()];
  if (idx === -1) {
    await appendRow('USER_SETTINGS', row);
  } else {
    await updateRow('USER_SETTINGS', idx + 1, row);
  }
}

async function deleteUserSettings(userId) {
  const rows = await getRows('USER_SETTINGS');
  const idx = rows.findIndex(r => r[0] === userId);
  if (idx === -1) return;
  await updateRow('USER_SETTINGS', idx + 1, [userId, '', '', '', new Date().toISOString()]);
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
