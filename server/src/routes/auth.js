const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.post('/login', (req, res) => {
  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: 'password required' });

  if (password !== process.env.APP_PASSWORD) {
    return res.status(401).json({ error: 'wrong password' });
  }

  const token = jwt.sign({ app: 'farmalert' }, process.env.JWT_SECRET, { expiresIn: '365d' });
  res.json({ token });
});

router.get('/me', (req, res) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'missing token' });
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    res.json({ ok: true });
  } catch {
    res.status(401).json({ error: 'invalid token' });
  }
});

module.exports = router;
