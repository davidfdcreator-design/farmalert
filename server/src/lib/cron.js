const cron = require('node-cron');
const prisma = require('./prisma');
const push = require('./push');

function getRomeNow() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Rome' }));
}

function currentTimeStr(d) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function todayAt(d, hh, mm) {
  const x = new Date(d);
  x.setHours(hh, mm, 0, 0);
  return x;
}

async function sendInitialDoses(now) {
  const timeStr = currentTimeStr(now);
  const meds = await prisma.medication.findMany({
    where: { active: true, times: { has: timeStr } },
  });

  for (const med of meds) {
    const [h, m] = timeStr.split(':').map(Number);
    const scheduledAt = todayAt(now, h, m);

    const existing = await prisma.medicationLog.findUnique({
      where: { medicationId_scheduledAt: { medicationId: med.id, scheduledAt } },
    });
    if (existing) continue;

    await prisma.medicationLog.create({
      data: { medicationId: med.id, scheduledAt },
    });

    await push.sendToUser(med.userId, {
      title: 'FarmaAlert',
      body: `Ora di prendere ${med.name}${med.dosage ? ` (${med.dosage})` : ''}`,
    });
  }
}

async function sendReminders(now) {
  const logs = await prisma.medicationLog.findMany({
    where: { takenAt: null },
    include: { medication: true },
  });

  for (const log of logs) {
    const med = log.medication;
    if (!med.active) continue;
    if (log.remindersSent >= med.reminderMaxCount) continue;

    const minutesSince = Math.floor((now.getTime() - log.scheduledAt.getTime()) / 60_000);
    const threshold = (log.remindersSent + 1) * med.reminderIntervalMinutes;
    if (minutesSince < threshold) continue;

    await push.sendToUser(med.userId, {
      title: 'FarmaAlert — promemoria',
      body: `⚠️ ${med.name} non ancora confermato`,
    });

    await prisma.medicationLog.update({
      where: { id: log.id },
      data: { remindersSent: { increment: 1 } },
    });
  }
}

async function tick() {
  try {
    const now = getRomeNow();
    await sendInitialDoses(now);
    await sendReminders(now);
  } catch (err) {
    console.error('[cron] tick error:', err);
  }
}

function start() {
  cron.schedule('* * * * *', tick);
  console.log('[cron] scheduled every minute (Europe/Rome)');
}

module.exports = { start, tick };
