const express = require('express');
const { encrypt } = require('../crypto');
const { requireAuth } = require('../middleware/auth');
const sheets = require('../storage');

const router = express.Router();

// GET /api/settings
router.get('/', requireAuth, async (req, res) => {
  try {
    const settings = await sheets.getUserSettings(req.user.sub);
    res.json({ data: { groqKeySet: !!(settings?.encryptedKey) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/settings/groq-key
router.post('/groq-key', requireAuth, async (req, res) => {
  try {
    const { groqKey } = req.body;
    if (!groqKey) return res.status(400).json({ error: 'groqKey is required' });
    if (!process.env.ENCRYPTION_KEY) {
      return res.status(500).json({ error: 'ENCRYPTION_KEY not set in server .env' });
    }
    const { encryptedKey, iv, authTag } = encrypt(groqKey);
    await sheets.upsertUserSettings(req.user.sub, { encryptedKey, iv, authTag });
    res.json({ data: { success: true } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/settings/groq-key
router.delete('/groq-key', requireAuth, async (req, res) => {
  try {
    await sheets.deleteUserSettings(req.user.sub);
    res.json({ data: { success: true } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
