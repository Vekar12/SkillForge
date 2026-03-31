require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const skillsRoutes = require('./routes/skills');
const tasksRoutes = require('./routes/tasks');
const assessmentRoutes = require('./routes/assessment');
const settingsRoutes = require('./routes/settings');
const adminRoutes = require('./routes/admin');
const progressRoutes = require('./routes/progress');

const app = express();

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/api/progress', progressRoutes);
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
});
