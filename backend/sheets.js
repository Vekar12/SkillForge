const { google } = require('googleapis');

function getClient(creds) {
  const credentials = JSON.parse(creds.serviceAccountJson);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

// ─── STATE ───────────────────────────────────────────────────

async function getState(key, creds) {
  const client = getClient(creds);
  const res = await client.spreadsheets.values.get({
    spreadsheetId: creds.sheetId,
    range: 'STATE!A:B',
  });
  const rows = res.data.values || [];
  const row = rows.find(r => r[0] === key);
  return row ? row[1] : null;
}

async function setState(key, value, creds) {
  const client = getClient(creds);
  const res = await client.spreadsheets.values.get({
    spreadsheetId: creds.sheetId,
    range: 'STATE!A:B',
  });
  const rows = res.data.values || [];
  const rowIndex = rows.findIndex(r => r[0] === key);

  if (rowIndex === -1) {
    await client.spreadsheets.values.append({
      spreadsheetId: creds.sheetId,
      range: 'STATE!A:B',
      valueInputOption: 'RAW',
      requestBody: { values: [[key, value]] },
    });
  } else {
    await client.spreadsheets.values.update({
      spreadsheetId: creds.sheetId,
      range: `STATE!A${rowIndex + 1}:B${rowIndex + 1}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[key, value]] },
    });
  }
}

// ─── TASKS ───────────────────────────────────────────────────

async function getTasksForDay(day, creds) {
  const client = getClient(creds);
  const res = await client.spreadsheets.values.get({
    spreadsheetId: creds.sheetId,
    range: 'TASKS!A:E',
  });
  const rows = res.data.values || [];
  return rows
    .slice(1)
    .filter(r => String(r[0]) === String(day))
    .map(r => ({ day: r[0], taskId: r[1], type: r[2], status: r[3], completedAt: r[4] }));
}

async function appendTaskCompletion(day, taskId, type, creds) {
  const client = getClient(creds);
  await client.spreadsheets.values.append({
    spreadsheetId: creds.sheetId,
    range: 'TASKS!A:E',
    valueInputOption: 'RAW',
    requestBody: {
      values: [[day, taskId, type, 'completed', new Date().toISOString()]],
    },
  });
}

// ─── ASSESSMENTS ─────────────────────────────────────────────

async function appendAssessment(day, parsed, creds) {
  const client = getClient(creds);
  await client.spreadsheets.values.append({
    spreadsheetId: creds.sheetId,
    range: 'ASSESSMENTS!A:K',
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
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
      ]],
    },
  });
}

// ─── OPEN POINTS ─────────────────────────────────────────────

async function appendOpenPoints(openPointsArray, sourceDay, creds) {
  if (!openPointsArray.length) return;
  const client = getClient(creds);
  const rows = openPointsArray.map((point, i) => [
    `D${sourceDay}_P${i + 1}`,
    point,
    sourceDay,
    'open',
  ]);
  await client.spreadsheets.values.append({
    spreadsheetId: creds.sheetId,
    range: 'OPEN_POINTS!A:D',
    valueInputOption: 'RAW',
    requestBody: { values: rows },
  });
}

// ─── ROADMAP SCORES ──────────────────────────────────────────

async function getAllAssessmentScores(creds) {
  const client = getClient(creds);
  const res = await client.spreadsheets.values.get({
    spreadsheetId: creds.sheetId,
    range: 'ASSESSMENTS!A:I',
  });
  const rows = res.data.values || [];
  return rows.slice(1).map(r => ({
    day: Number(r[0]),
    score: Number(r[6]),
    competencyName: r[7],
    competencyLevel: r[8],
  }));
}

module.exports = {
  getState,
  setState,
  getTasksForDay,
  appendTaskCompletion,
  appendAssessment,
  appendOpenPoints,
  getAllAssessmentScores,
};
