require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');

const authRoutes = require('./routes/auth');
const skillsRoutes = require('./routes/skills');
const tasksRoutes = require('./routes/tasks');
const assessmentRoutes = require('./routes/assessment');
const settingsRoutes = require('./routes/settings');
const adminRoutes = require('./routes/admin');

const app = express();

// Centralise the frontend origin so CORS and the auth redirect stay in sync.
// Set FRONTEND_ORIGIN in .env for staging/production deployments.
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json());

// express-session is only used for the OAuth handshake (passport needs it briefly)
app.use(session({
  secret: process.env.SESSION_SECRET || (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET must be set in production');
    }
    return 'skillforge-dev';
  })(),
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/task', tasksRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✓ SkillForge backend running on http://localhost:${PORT}`);
  console.log(`  Auth: http://localhost:${PORT}/auth/google`);
});
