const express = require('express');
const { requireAuth } = require('../middleware/auth');
const sheets = require('../sheets');

const router = express.Router();

// GET /api/progress/:skillId
// Returns the full progress state for a skill — mirrors what frontend stored in localStorage
router.get('/:skillId', requireAuth, async (req, res) => {
  try {
    const { skillId } = req.params;
    const userId = req.user.sub;

    const [currentDayStr, streakStr, rawAdj] = await Promise.all([
      sheets.getStateForUser(userId, skillId, 'current_day'),
      sheets.getStateForUser(userId, skillId, 'streak'),
      sheets.getStateForUser(userId, skillId, 'next_day_adjustments'),
    ]);

    const currentDay = Number(currentDayStr || 1);
    const streak = Number(streakStr || 0);
    let adjustments = null;
    if (rawAdj) {
      try { adjustments = JSON.parse(rawAdj); } catch {}
    }

    // Completed task IDs for current day
    const completedTasks = await sheets.getTasksForUser(userId, skillId, currentDay);
    const completedTaskIds = completedTasks.map(t => t.taskId);

    res.json({ data: { currentDay, streak, adjustments, completedTaskIds } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/progress/:skillId/task
// Mark a task complete (or uncomplete)
// Body: { taskId, day, type, completed }
router.post('/:skillId/task', requireAuth, async (req, res) => {
  try {
    const { skillId } = req.params;
    const { taskId, day, type, completed = true } = req.body;

    if (!taskId || !day || !type) {
      return res.status(400).json({ error: 'taskId, day, and type are required' });
    }

    if (completed) {
      await sheets.appendTaskCompletionForUser(req.user.sub, skillId, day, taskId, type);
    }

    res.json({ data: { success: true } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/progress/:skillId/advance
// Advance currentDay by 1 (called after assessment is submitted)
router.post('/:skillId/advance', requireAuth, async (req, res) => {
  try {
    const { skillId } = req.params;
    const userId = req.user.sub;

    const currentDayStr = await sheets.getStateForUser(userId, skillId, 'current_day');
    const nextDay = Number(currentDayStr || 1) + 1;

    await sheets.setStateForUser(userId, skillId, 'current_day', nextDay);

    res.json({ data: { currentDay: nextDay } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/progress/:skillId/pending
// All incomplete core tasks for today — used by the right pane sidebar
router.get('/:skillId/pending', requireAuth, async (req, res) => {
  try {
    const { skillId } = req.params;
    const userId = req.user.sub;

    const currentDayStr = await sheets.getStateForUser(userId, skillId, 'current_day');
    const currentDay = Number(currentDayStr || 1);

    const completedTasks = await sheets.getTasksForUser(userId, skillId, currentDay);
    const completedIds = new Set(completedTasks.map(t => t.taskId));

    res.json({
      data: {
        currentDay,
        completedIds: [...completedIds],
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
