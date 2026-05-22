const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.get('/users', async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, isAdmin: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  res.json({ users });
});

router.post('/users', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const isAdmin = !!req.body?.isAdmin;

  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'invalid email' });
  if (password.length < 6) return res.status(400).json({ error: 'password must be at least 6 chars' });

  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({
      data: { email, passwordHash, isAdmin },
      select: { id: true, email: true, isAdmin: true, createdAt: true },
    });
    res.status(201).json({ user });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'email already exists' });
    throw err;
  }
});

router.delete('/users/:id', async (req, res) => {
  if (req.params.id === req.userId) {
    return res.status(400).json({ error: 'cannot delete yourself' });
  }
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: 'not found' });
  }
});

router.post('/users/:id/password', async (req, res) => {
  const password = String(req.body?.password || '');
  if (password.length < 6) return res.status(400).json({ error: 'password must be at least 6 chars' });
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id: req.params.id }, data: { passwordHash } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: 'not found' });
  }
});

module.exports = router;
