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

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// express-session is only used for the OAuth handshake (passport needs it briefly)
app.use(session({
  secret: process.env.SESSION_SECRET || 'skillforge-dev',
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
  console.log('  Auth: http://localhost:${PORT}/auth/google');
});
