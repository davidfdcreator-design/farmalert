const webpush = require('web-push');
const prisma = require('./prisma');

function sanitize(key) {
  return (key || '').trim().replace(/[^A-Za-z0-9\-_]/g, '');
}

let configured = false;
function configure() {
  if (configured) return true;
  const pub = sanitize(process.env.VAPID_PUBLIC_KEY);
  const priv = sanitize(process.env.VAPID_PRIVATE_KEY);
  const email = process.env.VAPID_EMAIL || 'mailto:admin@example.com';
  if (!pub || !priv) {
    console.warn('[push] VAPID keys missing — push disabled');
    return false;
  }
  webpush.setVapidDetails(email, pub, priv);
  configured = true;
  return true;
}

function publicKey() {
  return sanitize(process.env.VAPID_PUBLIC_KEY);
}

async function sendToAll(payload) {
  if (!configure()) return { sent: 0, failed: 0 };
  const subs = await prisma.pushSubscription.findMany();
  const body = JSON.stringify(payload);

  let sent = 0;
  let failed = 0;
  const stale = [];

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        );
        sent++;
      } catch (err) {
        failed++;
        if (err.statusCode === 404 || err.statusCode === 410) stale.push(s.id);
      }
    }),
  );

  if (stale.length) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: stale } } });
  }

  return { sent, failed };
}

module.exports = { configure, publicKey, sendToAll };
