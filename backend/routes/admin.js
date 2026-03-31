const express = require('express');
const { requireAdmin } = require('../middleware/auth');
const sheets = require('../sheets');

const router = express.Router();

// GET /api/admin/skill-requests
router.get('/skill-requests', requireAdmin, async (req, res) => {
  try {
    const requests = await sheets.getSkillRequests();
    res.json({ data: requests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/skill-requests/:id/approve
router.post('/skill-requests/:id/approve', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const request = await sheets.getSkillRequestById(id);
    if (!request) return res.status(404).json({ error: 'Skill request not found' });
    if (request.status !== 'pending') {
      return res.status(400).json({ error: `Request already ${request.status}` });
    }

    await sheets.updateSkillRequest(id, {
      status: 'approved',
      reviewedBy: req.user.sub,
      reviewNote: note || '',
    });

    // Enroll the requesting user in the skill (set current_day = 1 in STATE).
    // Replace(/\s+/g,'-') alone still allows '/', '+', '.' etc. which break URL
    // params and roadmap filenames; strip everything non-alphanumeric instead.
    const skillId = request.skillTitle
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')  // collapse any non-safe chars to a dash
      .replace(/^-+|-+$/g, '');     // strip leading/trailing dashes
    if (!skillId) {
      return res.status(400).json({ error: 'Invalid skill title: could not generate a safe skillId' });
    }
    await sheets.setStateForUser(request.userId, skillId, 'current_day', 1);

    res.json({ data: { success: true, skillId, enrolledUser: request.userId } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/skill-requests/:id/reject
router.post('/skill-requests/:id/reject', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const request = await sheets.getSkillRequestById(id);
    if (!request) return res.status(404).json({ error: 'Skill request not found' });
    if (request.status !== 'pending') {
      return res.status(400).json({ error: `Request already ${request.status}` });
    }

    await sheets.updateSkillRequest(id, {
      status: 'rejected',
      reviewedBy: req.user.sub,
      reviewNote: note || '',
    });

    res.json({ data: { success: true } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
