const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'missing token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload.userId) return res.status(401).json({ error: 'invalid token' });
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'invalid token' });
  }
}

async function requireAdmin(req, res, next) {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { isAdmin: true },
  });
  if (!user?.isAdmin) return res.status(403).json({ error: 'admin only' });
  next();
}

module.exports = { requireAuth, requireAdmin };
