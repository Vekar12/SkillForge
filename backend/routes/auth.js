const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ── Passport strategy ────────────────────────────────────────
passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    // state: true enables automatic CSRF nonce generation + verification via
    // express-session. Without it, a forged callback request could authenticate
    // an attacker into a victim's session (login CSRF).
    state: true,
  },
  (accessToken, refreshToken, profile, done) => done(null, profile)
));

// Minimal session serialization (only used during OAuth handshake)
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// ── Routes ───────────────────────────────────────────────────

// GET /auth/google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// GET /auth/google/callback
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/auth/failed' }),
  (req, res) => {
    const profile = req.user;
    const token = jwt.sign(
      {
        sub: profile.id,
        email: profile.emails?.[0]?.value || '',
        name: profile.displayName,
        picture: profile.photos?.[0]?.value || '',
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    // Use the configured frontend origin so this works in staging/production too.
    // Fragment (#) avoids the token appearing in server logs or referrer headers.
    const origin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
    res.redirect(`${origin}/auth/callback#token=${token}`);
  }
);

router.get('/failed', (req, res) => {
  res.status(401).json({ error: 'Google authentication failed' });
});

// GET /auth/me
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
