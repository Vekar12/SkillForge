const express = require('express');
const fs = require('fs');
const path = require('path');
const { requireAuth } = require('../middleware/auth');
const sheets = require('../sheets');
const { generateSkillSpec } = require('../groq');

const router = express.Router();

function loadRoadmap(skillId) {
  // Guard against path traversal: skillId comes straight from the URL so an
  // encoded '../' or absolute path could escape data/roadmaps without this check.
  if (!/^[a-z0-9-]+$/.test(skillId)) throw new Error('Invalid skillId');
  const baseDir = path.resolve(__dirname, '../data/roadmaps');
  const p = path.resolve(baseDir, `${skillId}.json`);
  // Second safeguard: ensure the resolved path is still inside baseDir.
  if (!p.startsWith(baseDir + path.sep)) throw new Error('Invalid skillId');
  if (!fs.existsSync(p)) throw new Error(`Roadmap not found for skill: ${skillId}`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

// GET /api/skills
router.get('/', requireAuth, async (req, res) => {
  try {
    const enrollments = await sheets.getUserSkills(req.user.sub);
    const skills = enrollments.map(({ skillId, currentDay }) => {
      try {
        const roadmap = loadRoadmap(skillId);
        return {
          skillId,
          title: roadmap.skill,
          totalDays: roadmap.totalDays,
          currentDay: Number(currentDay),
        };
      } catch {
        return { skillId, title: skillId, totalDays: null, currentDay: Number(currentDay) };
      }
    });
    res.json({ data: skills });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/skills/request
router.post('/request', requireAuth, async (req, res) => {
  try {
    const { skillTitle, description } = req.body;
    if (!skillTitle) return res.status(400).json({ error: 'skillTitle is required' });

    // Get user's Groq key
    const groqKey = await sheets.getDecryptedGroqKey(req.user.sub);
    if (!groqKey) return res.status(400).json({ error: 'Set your Groq API key in settings first' });

    const spec = await generateSkillSpec(skillTitle, description || '', groqKey);

    await sheets.appendSkillRequest({
      userId: req.user.sub,
      skillTitle,
      status: 'pending',
      generatedSpec: JSON.stringify(spec),
    });

    res.json({ data: { message: 'Skill request submitted', spec } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/skills/:skillId/day/:day
router.get('/:skillId/day/:day', requireAuth, async (req, res) => {
  try {
    const { skillId, day } = req.params;
    const roadmap = loadRoadmap(skillId);
    const dayData = roadmap.days.find(d => d.day === Number(day));
    if (!dayData) return res.status(404).json({ error: `Day ${day} not found` });

    const completedTasks = await sheets.getTasksForUser(req.user.sub, skillId, Number(day));
    const completedIds = new Set(completedTasks.map(t => t.taskId));

    const tasks = (dayData.tasks || []).map(t => ({
      ...t,
      completed: completedIds.has(t.id),
    }));

    const adjustments = await sheets.getStateForUser(req.user.sub, skillId, 'next_day_adjustments')
      .then(v => v ? JSON.parse(v) : null).catch(() => null);

    const coreTasks = tasks.filter(t => !t.isBonus);
    const assessmentUnlocked = coreTasks.length > 0 && coreTasks.every(t => t.completed);

    res.json({ data: { ...dayData, tasks, assessmentUnlocked, adjustments } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/skills/:skillId/roadmap
router.get('/:skillId/roadmap', requireAuth, async (req, res) => {
  try {
    const { skillId } = req.params;
    const roadmap = loadRoadmap(skillId);
    const currentDayStr = await sheets.getStateForUser(req.user.sub, skillId, 'current_day');
    const currentDay = Number(currentDayStr || 1);
    const [scores, allTasks] = await Promise.all([
      sheets.getAllAssessmentScoresForUser(req.user.sub, skillId),
      sheets.getAllTasksForUserSkill(req.user.sub, skillId),  // single fetch, no N+1
    ]);
    const scoreMap = Object.fromEntries(scores.map(s => [s.day, s]));

    const days = roadmap.days.map((d) => {
        const completedIds = new Set(
          allTasks.filter(t => t.day === d.day).map(t => t.taskId)
        );
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
      });

    res.json({ data: { skillId, title: roadmap.skill, totalDays: roadmap.totalDays, currentDay, days } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
