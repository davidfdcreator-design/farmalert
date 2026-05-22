require('dotenv').config();

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const medicationsRoutes = require('./routes/medications');
const notificationsRoutes = require('./routes/notifications');
const { requireAuth } = require('./middleware/auth');
const cronJob = require('./lib/cron');
const push = require('./lib/push');

const app = express();

const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error('CORS blocked'));
    },
  }),
);
app.use(express.json({ limit: '100kb' }));

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/medications', requireAuth, medicationsRoutes);
app.use('/api/notifications', requireAuth, notificationsRoutes);

app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(500).json({ error: 'internal error' });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, '0.0.0.0', () => {
  console.log(`[server] listening on 0.0.0.0:${port}`);
  push.configure();
  cronJob.start();
});
