const express = require('express');
const fs = require('fs');
const path = require('path');
const { requireAuth } = require('../middleware/auth');
const sheets = require('../storage');

const router = express.Router();

function loadRoadmap(skillId) {
  const p = path.join(__dirname, '../data/roadmaps', `${skillId}.json`);
  if (!fs.existsSync(p)) throw new Error(`Roadmap not found: ${skillId}`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

// POST /api/task/complete
router.post('/complete', requireAuth, async (req, res) => {
  try {
    const { taskId, skillId, day, type } = req.body;
    if (!taskId || !skillId || !day || !type) {
      return res.status(400).json({ error: 'taskId, skillId, day, and type are required' });
    }

    await sheets.appendTaskCompletionForUser(req.user.sub, skillId, day, taskId, type);

    const roadmap = loadRoadmap(skillId);
    const dayData = roadmap.days.find(d => d.day === Number(day));
    const completedTasks = await sheets.getTasksForUser(req.user.sub, skillId, Number(day));
    const completedIds = new Set(completedTasks.map(t => t.taskId));

    let nextUnlocked = null;
    let assessmentUnlocked = false;

    if (dayData) {
      const tasks = dayData.tasks || [];
      const readTasks = tasks.filter(t => t.type === 'READ' && !t.isBonus);
      const searchTasks = tasks.filter(t => t.type === 'SEARCH' && !t.isBonus);
      const activityTask = tasks.find(t => t.type === 'ACTIVITY' && !t.isBonus);

      const allReadDone = readTasks.every(t => completedIds.has(t.id));
      const allSearchDone = searchTasks.every(t => completedIds.has(t.id));

      if (type === 'READ' && allReadDone && searchTasks.length > 0) {
        const nextSearch = searchTasks.find(t => !completedIds.has(t.id));
        nextUnlocked = nextSearch?.id ?? null;
      } else if (allReadDone && allSearchDone && activityTask && !completedIds.has(activityTask.id)) {
        nextUnlocked = activityTask.id;
      }

      const coreTasks = tasks.filter(t => !t.isBonus);
      assessmentUnlocked = coreTasks.length > 0 && coreTasks.every(t => completedIds.has(t.id));
    }

    res.json({ data: { success: true, nextUnlocked, assessmentUnlocked } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tasks/pending — all incomplete tasks across all enrolled skills
router.get('/pending', requireAuth, async (req, res) => {
  try {
    const enrollments = await sheets.getUserSkills(req.user.sub);
    const pending = [];

    for (const { skillId, currentDay } of enrollments) {
      const roadmap = loadRoadmap(skillId);
      const dayData = roadmap.days.find(d => d.day === Number(currentDay));
      if (!dayData) continue;

      const completedTasks = await sheets.getTasksForUser(req.user.sub, skillId, Number(currentDay));
      const completedIds = new Set(completedTasks.map(t => t.taskId));

      const incompleteTasks = (dayData.tasks || [])
        .filter(t => !t.isBonus && !completedIds.has(t.id))
        .map(t => ({ ...t, skillId, day: Number(currentDay) }));

      pending.push(...incompleteTasks);
    }

    res.json({ data: pending });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks/carryover — carry incomplete tasks to next day
router.post('/carryover', requireAuth, async (req, res) => {
  try {
    const { skillId } = req.body;
    if (!skillId) return res.status(400).json({ error: 'skillId is required' });

    const currentDayStr = await sheets.getStateForUser(req.user.sub, skillId, 'current_day');
    const currentDay = Number(currentDayStr || 1);
    const nextDay = currentDay + 1;

    const roadmap = loadRoadmap(skillId);
    const dayData = roadmap.days.find(d => d.day === currentDay);
    if (!dayData) return res.status(404).json({ error: `Day ${currentDay} not found` });

    const completedTasks = await sheets.getTasksForUser(req.user.sub, skillId, currentDay);
    const completedIds = new Set(completedTasks.map(t => t.taskId));

    const incomplete = (dayData.tasks || []).filter(t => !t.isBonus && !completedIds.has(t.id));

    // Mark each incomplete task as carried over by writing a carried row
    for (const task of incomplete) {
      await sheets.appendTaskCompletionForUser(req.user.sub, skillId, nextDay, task.id, task.type, 'carried_over');
    }

    await sheets.setStateForUser(req.user.sub, skillId, 'current_day', nextDay);

    res.json({ data: { carriedOver: incomplete.length, nextDay } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
