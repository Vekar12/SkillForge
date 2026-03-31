const express = require('express');
const fs = require('fs');
const path = require('path');
const { requireAuth } = require('../middleware/auth');
const sheets = require('../storage');
const { adjustTomorrowsPlan } = require('../groq');

const router = express.Router();

function loadRoadmap(skillId) {
  // Same path-traversal guard as skills.js — skillId originates from req.body
  // and could contain encoded '..' or '/' variants without this check.
  if (!/^[a-z0-9-]+$/.test(skillId)) throw new Error('Invalid skillId');
  const baseDir = path.resolve(__dirname, '../data/roadmaps');
  const p = path.resolve(baseDir, `${skillId}.json`);
  if (!p.startsWith(baseDir + path.sep)) throw new Error('Invalid skillId');
  if (!fs.existsSync(p)) throw new Error(`Roadmap not found: ${skillId}`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function parseAssessment(raw) {
  const section = (header) => {
    const regex = new RegExp(`${header}[:\\s]*([\\s\\S]*?)(?=\\n[A-Z][A-Z ]+:|$)`, 'i');
    const match = raw.match(regex);
    return match ? match[1].trim() : '';
  };
  const toLines = (text) =>
    text.split('\n').map(l => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);

  const scoreMatch = raw.match(/SCORE:\s*(\d+)\s*\/\s*10/i);
  const compMatch = raw.match(/REFORGE COMPETENCY:\s*(.+?)\s*[—–-]\s*(.+)/i);

  return {
    gotRight: toLines(section('WHAT I GOT RIGHT')),
    needsCorrection: toLines(section('WHAT NEEDS CORRECTION')),
    blindSpots: toLines(section('BLIND SPOTS')),
    indiaNote: section('INDIA-SPECIFIC NOTE'),
    openPoints: toLines(section('OPEN POINTS FOR TOMORROW')),
    score: scoreMatch ? parseInt(scoreMatch[1], 10) : 0,
    competencyName: compMatch ? compMatch[1].trim() : '',
    competencyLevel: compMatch ? compMatch[2].trim() : '',
  };
}

// POST /api/assessment
router.post('/', requireAuth, async (req, res) => {
  try {
    const { skillId, rawFeedback } = req.body;
    // Parse day as a strict positive integer — reject strings, floats, or missing values.
    const day = parseInt(req.body.day, 10);
    if (!skillId || !day || day < 1 || !rawFeedback) {
      return res.status(400).json({ error: 'skillId, day (positive integer), and rawFeedback are required' });
    }

    // ── Server-side eligibility gate ──────────────────────────────────────────
    // The frontend already blocks submission, but a crafted request could bypass
    // that check, skip tasks, and advance current_day / streak arbitrarily.

    // 1. Verify the submitted day matches this user's actual current day.
    const currentDayStr = await sheets.getStateForUser(req.user.sub, skillId, 'current_day');
    if (Number(currentDayStr) !== day) {
      return res.status(400).json({ error: 'Assessment day does not match your current day' });
    }

    // 2. Verify all core tasks for this day are completed.
    const roadmapForCheck = loadRoadmap(skillId);
    const dayDataForCheck = roadmapForCheck.days.find(d => d.day === day);
    if (dayDataForCheck) {
      const completedTasks = await sheets.getTasksForUser(req.user.sub, skillId, day);
      const completedIds = new Set(completedTasks.map(t => t.taskId));
      const coreTasks = (dayDataForCheck.tasks || []).filter(t => !t.isBonus);
      const allCoreDone = coreTasks.length > 0 && coreTasks.every(t => completedIds.has(t.id));
      if (!allCoreDone) {
        return res.status(400).json({ error: 'Complete all core tasks before submitting the assessment' });
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    const existing = await sheets.getAssessmentForUser(req.user.sub, skillId, day);
    if (existing) {
      return res.status(409).json({ error: 'Assessment already submitted for this day' });
    }

    const parsed = { ...parseAssessment(rawFeedback), rawFeedback };

    await sheets.appendAssessmentForUser(req.user.sub, skillId, day, parsed);
    await sheets.appendOpenPointsForUser(parsed.openPoints, day, req.user.sub, skillId);

    const roadmap = loadRoadmap(skillId);
    const tomorrowContent = roadmap.days.find(d => d.day === Number(day) + 1) || null;

    let groqResult = null;
    if (tomorrowContent) {
      // Only use the encrypted key stored via settings — never fall back to a
      // raw x-groq-key header, which would bypass the encryption layer entirely.
      const groqKey = await sheets.getDecryptedGroqKey(req.user.sub);
      if (groqKey) {
        try {
          // Keep tomorrow adjustment best-effort: the assessment is already
          // persisted at this point, so a Groq failure must not return 500 and
          // cause the client to retry (which would hit the duplicate guard).
          groqResult = await adjustTomorrowsPlan(
            parsed.openPoints,
            parsed.score,
            parsed.competencyLevel,
            tomorrowContent,
            tomorrowContent.competenciesCovered || [],
            groqKey
          );
          await sheets.setStateForUser(req.user.sub, skillId, 'next_day_adjustments', JSON.stringify(groqResult));
        } catch (err) {
          console.warn('[assessment] adjustTomorrowsPlan failed (non-fatal):', err.message);
        }
      }
    }

    const nextDay = Number(day) + 1;
    await sheets.setStateForUser(req.user.sub, skillId, 'current_day', nextDay);
    const streak = Number(await sheets.getStateForUser(req.user.sub, skillId, 'streak') || 0);
    await sheets.setStateForUser(req.user.sub, skillId, 'streak', streak + 1);

    res.json({
      data: {
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
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/assessment/:skillId/:day
router.get('/:skillId/:day', requireAuth, async (req, res) => {
  try {
    const { skillId, day } = req.params;
    const result = await sheets.getAssessmentForUser(req.user.sub, skillId, Number(day));
    if (!result) return res.status(404).json({ error: 'Assessment not found' });
    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
