const express = require('express');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /auth/me
// Frontend sends Firebase ID token → we verify and return profile
router.get('/me', requireAuth, (req, res) => {
  res.json({
    data: {
      sub: req.user.sub,
      email: req.user.email,
      name: req.user.name,
      picture: req.user.picture,
      isAdmin: req.user.sub === process.env.ADMIN_GOOGLE_ID,
    },
  });
});

module.exports = router;
