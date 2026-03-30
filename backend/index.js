require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const sheets = require('./sheets');
const { adjustTomorrowsPlan } = require('./groq');

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

const ROADMAP_PATH = path.join(__dirname, 'data/roadmaps/apm-foundations.json');

function loadRoadmap() {
  return JSON.parse(fs.readFileSync(ROADMAP_PATH, 'utf8'));
}

// ─────────────────────────────────────────────────────────────
// GET /api/today
// ─────────────────────────────────────────────────────────────
app.get('/api/today', async (req, res) => {
  try {
    const currentDay = Number(await sheets.getState('current_day'));
    const roadmap = loadRoadmap();
    const dayData = roadmap.days.find(d => d.day === currentDay);

    if (!dayData) {
      return res.status(404).json({ error: `Day ${currentDay} not found in roadmap` });
    }

    // Merge task completion from Sheets
    const completedTasks = await sheets.getTasksForDay(currentDay);
    const completedIds = new Set(completedTasks.map(t => t.taskId));

    const tasks = (dayData.tasks || []).map(t => ({
      ...t,
      completed: completedIds.has(t.id),
    }));

    // Apply next_day_adjustments if present
    let adjustments = null;
    const rawAdj = await sheets.getState('next_day_adjustments');
    if (rawAdj) {
      try { adjustments = JSON.parse(rawAdj); } catch (_) {}
    }

    // assessmentUnlocked only if all core (non-bonus) tasks are done
    const coreTasks = tasks.filter(t => !t.isBonus);
    const assessmentUnlocked = coreTasks.length > 0 && coreTasks.every(t => t.completed);

    res.json({
      ...dayData,
      tasks,
      assessmentUnlocked,
      adjustments,
    });
  } catch (err) {
    console.error('/api/today error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/task/complete
// ─────────────────────────────────────────────────────────────
app.post('/api/task/complete', async (req, res) => {
  try {
    const { taskId, day, type } = req.body;
    if (!taskId || !day || !type) {
      return res.status(400).json({ error: 'taskId, day, and type are required' });
    }

    await sheets.appendTaskCompletion(day, taskId, type);

    // Determine what unlocks next
    const roadmap = loadRoadmap();
    const dayData = roadmap.days.find(d => d.day === Number(day));
    const completedTasks = await sheets.getTasksForDay(day);
    const completedIds = new Set(completedTasks.map(t => t.taskId));

    let nextUnlocked = null;
    let assessmentUnlocked = false;

    if (dayData) {
      const tasks = dayData.tasks || [];

      const readTasks = tasks.filter(t => t.type === 'READ');
      const searchTasks = tasks.filter(t => t.type === 'SEARCH');
      const activityTask = tasks.find(t => t.type === 'ACTIVITY');

      const allReadDone = readTasks.every(t => completedIds.has(t.id));
      const allSearchDone = searchTasks.every(t => completedIds.has(t.id));

      if (type === 'READ' && allReadDone && searchTasks.length > 0) {
        // Unlock first incomplete SEARCH task
        const nextSearch = searchTasks.find(t => !completedIds.has(t.id));
        nextUnlocked = nextSearch ? nextSearch.id : null;
      } else if (allReadDone && allSearchDone && activityTask && !completedIds.has(activityTask.id)) {
        nextUnlocked = activityTask.id;
      }

      const coreTasks = tasks.filter(t => !t.isBonus);
      assessmentUnlocked = coreTasks.length > 0 && coreTasks.every(t => completedIds.has(t.id));
    }

    res.json({ success: true, nextUnlocked, assessmentUnlocked });
  } catch (err) {
    console.error('/api/task/complete error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/bonus/load
// ─────────────────────────────────────────────────────────────
app.post('/api/bonus/load', async (req, res) => {
  try {
    const { day } = req.body;
    if (!day) return res.status(400).json({ error: 'day is required' });

    const roadmap = loadRoadmap();
    const dayData = roadmap.days.find(d => d.day === Number(day));

    if (!dayData) return res.status(404).json({ error: `Day ${day} not found` });

    const bonusTasks = (dayData.tasks || []).filter(t => t.isBonus);
    res.json({ bonusTasks });
  } catch (err) {
    console.error('/api/bonus/load error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/assessment
// ─────────────────────────────────────────────────────────────
app.post('/api/assessment', async (req, res) => {
  try {
    const { day, rawFeedback } = req.body;
    if (!day || !rawFeedback) {
      return res.status(400).json({ error: 'day and rawFeedback are required' });
    }

    // ── Parse rawFeedback ──
    const parsed = parseAssessment(rawFeedback);
    parsed.rawFeedback = rawFeedback;

    // ── Save to Sheets ──
    await sheets.appendAssessment(day, parsed);
    await sheets.appendOpenPoints(parsed.openPoints, day);

    // ── Load tomorrow's content ──
    const roadmap = loadRoadmap();
    const tomorrowDay = Number(day) + 1;
    const tomorrowContent = roadmap.days.find(d => d.day === tomorrowDay) || null;

    // ── Call Groq ──
    let groqResult = null;
    if (tomorrowContent) {
      groqResult = await adjustTomorrowsPlan(
        parsed.openPoints,
        parsed.score,
        parsed.competencyLevel,
        tomorrowContent,
        tomorrowContent.competenciesCovered || []
      );
      await sheets.setState('next_day_adjustments', JSON.stringify(groqResult));
    }

    // ── Advance day + update streak ──
    await sheets.setState('current_day', tomorrowDay);

    const streak = Number(await sheets.getState('streak') || 0);
    await sheets.setState('streak', streak + 1);

    res.json({
      success: true,
      parsed: {
        gotRight: parsed.gotRight,
        needsCorrection: parsed.needsCorrection,
        blindSpots: parsed.blindSpots,
        indiaNote: parsed.indiaNote,
        openPoints: parsed.openPoints,
        score: parsed.score,
        competencyName: parsed.competencyName,
        competencyLevel: parsed.competencyLevel,
      },
      tomorrowAdjusted: !!groqResult,
    });
  } catch (err) {
    console.error('/api/assessment error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/roadmap
// ─────────────────────────────────────────────────────────────
app.get('/api/roadmap', async (req, res) => {
  try {
    const roadmap = loadRoadmap();
    const currentDay = Number(await sheets.getState('current_day'));
    const scores = await sheets.getAllAssessmentScores();
    const scoreMap = Object.fromEntries(scores.map(s => [s.day, s]));

    const days = await Promise.all(
      roadmap.days.map(async (d) => {
        const completedTasks = await sheets.getTasksForDay(d.day);
        const completedIds = new Set(completedTasks.map(t => t.taskId));
        const coreTasks = (d.tasks || []).filter(t => !t.isBonus);
        const allCoreDone = coreTasks.length > 0 && coreTasks.every(t => completedIds.has(t.id));

        let status = 'upcoming';
        if (d.day < currentDay && allCoreDone) status = 'completed';
        else if (d.day === currentDay) status = 'current';

        return {
          day: d.day,
          title: d.title,
          competenciesCovered: d.competenciesCovered || [],
          status,
          score: scoreMap[d.day]?.score ?? null,
          competencyLevel: scoreMap[d.day]?.competencyLevel ?? null,
        };
      })
    );

    res.json({ days });
  } catch (err) {
    console.error('/api/roadmap error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// Assessment parser
// ─────────────────────────────────────────────────────────────
function parseAssessment(raw) {
  const section = (header) => {
    const regex = new RegExp(`${header}[:\\s]*([\\s\\S]*?)(?=\\n[A-Z][A-Z ]+:|$)`, 'i');
    const match = raw.match(regex);
    if (!match) return '';
    return match[1].trim();
  };

  const toLines = (text) =>
    text.split('\n')
      .map(l => l.replace(/^[-•*]\s*/, '').trim())
      .filter(Boolean);

  const gotRight = toLines(section('WHAT I GOT RIGHT'));
  const needsCorrection = toLines(section('WHAT NEEDS CORRECTION'));
  const blindSpots = toLines(section('BLIND SPOTS'));
  const indiaNote = section('INDIA-SPECIFIC NOTE');
  const openPoints = toLines(section('OPEN POINTS FOR TOMORROW'));

  // SCORE: 8/10
  const scoreMatch = raw.match(/SCORE:\s*(\d+)\s*\/\s*10/i);
  const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;

  // REFORGE COMPETENCY: Fluency with Data — On Track
  const compMatch = raw.match(/REFORGE COMPETENCY:\s*(.+?)\s*[—–-]\s*(.+)/i);
  const competencyName = compMatch ? compMatch[1].trim() : '';
  const competencyLevel = compMatch ? compMatch[2].trim() : '';

  return { gotRight, needsCorrection, blindSpots, indiaNote, openPoints, score, competencyName, competencyLevel };
}

// ─────────────────────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

async function start() {
  try {
    const title = await sheets.testConnection();
    console.log(`✓ Sheets connected: "${title}"`);
  } catch (err) {
    console.error('✗ Sheets connection failed:', err.message);
    console.error('  Check SPREADSHEET_ID and GOOGLE_SERVICE_ACCOUNT_JSON in .env');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`✓ SkillForge backend running on http://localhost:${PORT}`);
  });
}

start();
