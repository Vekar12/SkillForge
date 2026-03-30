const { google } = require('googleapis');
require('dotenv').config();

let sheets;

function getClient() {
  if (sheets) return sheets;

  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}

const SPREADSHEET_ID = () => process.env.SPREADSHEET_ID;

// ─── STATE ───────────────────────────────────────────────

async function getState(key) {
  const client = getClient();
  const res = await client.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID(),
    range: 'STATE!A:B',
  });
  const rows = res.data.values || [];
  const row = rows.find(r => r[0] === key);
  return row ? row[1] : null;
}

async function setState(key, value) {
  const client = getClient();
  const res = await client.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID(),
    range: 'STATE!A:B',
  });
  const rows = res.data.values || [];
  const rowIndex = rows.findIndex(r => r[0] === key);

  if (rowIndex === -1) {
    // Append new row
    await client.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID(),
      range: 'STATE!A:B',
      valueInputOption: 'RAW',
      requestBody: { values: [[key, value]] },
    });
  } else {
    // Update existing row (1-indexed, +1 for header if any)
    const range = `STATE!A${rowIndex + 1}:B${rowIndex + 1}`;
    await client.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID(),
      range,
      valueInputOption: 'RAW',
      requestBody: { values: [[key, value]] },
    });
  }
}

// ─── TASKS ───────────────────────────────────────────────

async function getTasksForDay(day) {
  const client = getClient();
  const res = await client.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID(),
    range: 'TASKS!A:E',
  });
  const rows = res.data.values || [];
  // Skip header row, filter by day
  return rows
    .slice(1)
    .filter(r => String(r[0]) === String(day))
    .map(r => ({
      day: r[0],
      taskId: r[1],
      type: r[2],
      status: r[3],
      completedAt: r[4],
    }));
}

async function appendTaskCompletion(day, taskId, type) {
  const client = getClient();
  await client.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID(),
    range: 'TASKS!A:E',
    valueInputOption: 'RAW',
    requestBody: {
      values: [[day, taskId, type, 'completed', new Date().toISOString()]],
    },
  });
}

// ─── ASSESSMENTS ─────────────────────────────────────────

async function appendAssessment(day, parsed) {
  const client = getClient();
  await client.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID(),
    range: 'ASSESSMENTS!A:J',
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

// ─── OPEN POINTS ─────────────────────────────────────────

async function appendOpenPoints(openPointsArray, sourceDay) {
  if (!openPointsArray.length) return;
  const client = getClient();
  const rows = openPointsArray.map((point, i) => [
    `D${sourceDay}_P${i + 1}`,
    point,
    sourceDay,
    'open',
  ]);
  await client.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID(),
    range: 'OPEN_POINTS!A:D',
    valueInputOption: 'RAW',
    requestBody: { values: rows },
  });
}

// ─── ROADMAP SCORES ──────────────────────────────────────

async function getAllAssessmentScores() {
  const client = getClient();
  const res = await client.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID(),
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

// ─── CONNECTION TEST ─────────────────────────────────────

async function testConnection() {
  const client = getClient();
  const res = await client.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID(),
  });
  return res.data.title;
}

module.exports = {
  getState,
  setState,
  getTasksForDay,
  appendTaskCompletion,
  appendAssessment,
  appendOpenPoints,
  getAllAssessmentScores,
  testConnection,
};
