const express = require('express');
const fs = require('fs');
const path = require('path');
const { requireAuth } = require('../middleware/auth');
const sheets = require('../sheets');
const { adjustTomorrowsPlan } = require('../groq');

const router = express.Router();

function loadRoadmap(skillId) {
  const p = path.join(__dirname, '../data/roadmaps', `${skillId}.json`);
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
    const { skillId, day, rawFeedback } = req.body;
    if (!skillId || !day || !rawFeedback) {
      return res.status(400).json({ error: 'skillId, day, and rawFeedback are required' });
    }

    const existing = await sheets.getAssessmentForUser(req.user.sub, skillId, Number(day));
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
      const groqKey = await sheets.getDecryptedGroqKey(req.user.sub);
      const keyToUse = groqKey || req.headers['x-groq-key'] || '';
      if (keyToUse) {
        groqResult = await adjustTomorrowsPlan(
          parsed.openPoints,
          parsed.score,
          parsed.competencyLevel,
          tomorrowContent,
          tomorrowContent.competenciesCovered || [],
          keyToUse
        );
        await sheets.setStateForUser(req.user.sub, skillId, 'next_day_adjustments', JSON.stringify(groqResult));
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
