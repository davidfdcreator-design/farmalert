const express = require('express');
const prisma = require('../lib/prisma');
const push = require('../lib/push');

const router = express.Router();

router.get('/vapid-key', (req, res) => {
  const publicKey = push.publicKey();
  res.json({ enabled: !!publicKey, publicKey });
});

router.post('/subscribe', async (req, res) => {
  const { endpoint, keys } = req.body || {};
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ error: 'invalid subscription' });
  }

  const sub = await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh: keys.p256dh, auth: keys.auth },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth },
  });

  res.json({ id: sub.id });
});

router.post('/test', async (req, res) => {
  const result = await push.sendToAll({
    title: 'FarmaAlert',
    body: 'Notifica di test ricevuta correttamente ✓',
  });
  res.json(result);
});

module.exports = router;
