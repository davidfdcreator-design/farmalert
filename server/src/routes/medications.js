const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function validateBody(body) {
  const errors = [];
  const name = (body?.name ?? '').trim();
  if (!name) errors.push('name required');

  const dosage = (body?.dosage ?? '').trim();
  const times = Array.isArray(body?.times) ? body.times : [];
  if (!times.length) errors.push('at least one time required');
  for (const t of times) {
    if (typeof t !== 'string' || !TIME_RE.test(t)) {
      errors.push(`invalid time: ${t}`);
      break;
    }
  }

  const interval = Number(body?.reminderIntervalMinutes ?? 10);
  if (!Number.isInteger(interval) || interval < 1 || interval > 240) {
    errors.push('reminderIntervalMinutes must be 1-240');
  }
  const maxCount = Number(body?.reminderMaxCount ?? 3);
  if (!Number.isInteger(maxCount) || maxCount < 0 || maxCount > 20) {
    errors.push('reminderMaxCount must be 0-20');
  }

  return {
    errors,
    data: { name, dosage, times, reminderIntervalMinutes: interval, reminderMaxCount: maxCount },
  };
}

router.get('/', async (req, res) => {
  const meds = await prisma.medication.findMany({
    where: { active: true },
    orderBy: { createdAt: 'asc' },
  });
  res.json({ medications: meds });
});

router.post('/', async (req, res) => {
  const { errors, data } = validateBody(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const med = await prisma.medication.create({ data });
  res.status(201).json({ medication: med });
});

router.put('/:id', async (req, res) => {
  const { errors, data } = validateBody(req.body);
  if (errors.length) return res.status(400).json({ errors });

  try {
    const med = await prisma.medication.update({ where: { id: req.params.id }, data });
    res.json({ medication: med });
  } catch {
    res.status(404).json({ error: 'not found' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.medication.update({
      where: { id: req.params.id },
      data: { active: false },
    });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: 'not found' });
  }
});

function romeNow() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Rome' }));
}

function startOfRomeDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

router.get('/today', async (req, res) => {
  const now = romeNow();
  const dayStart = startOfRomeDay(now);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const meds = await prisma.medication.findMany({
    where: { active: true },
    include: {
      logs: {
        where: { scheduledAt: { gte: dayStart, lt: dayEnd } },
      },
    },
  });

  const doses = [];
  for (const med of meds) {
    for (const time of med.times) {
      const [h, m] = time.split(':').map(Number);
      const scheduledAt = new Date(dayStart);
      scheduledAt.setHours(h, m, 0, 0);

      const log = med.logs.find(
        (l) => Math.abs(l.scheduledAt.getTime() - scheduledAt.getTime()) < 60_000,
      );

      doses.push({
        medicationId: med.id,
        name: med.name,
        dosage: med.dosage,
        time,
        scheduledAt: scheduledAt.toISOString(),
        taken: !!log?.takenAt,
        takenAt: log?.takenAt?.toISOString() ?? null,
      });
    }
  }

  doses.sort((a, b) => a.time.localeCompare(b.time));
  res.json({ doses });
});

router.post('/take', async (req, res) => {
  const { medicationId, scheduledAt } = req.body || {};
  if (!medicationId || !scheduledAt) {
    return res.status(400).json({ error: 'medicationId and scheduledAt required' });
  }

  const med = await prisma.medication.findUnique({ where: { id: medicationId } });
  if (!med) return res.status(404).json({ error: 'medication not found' });

  const when = new Date(scheduledAt);
  const log = await prisma.medicationLog.upsert({
    where: { medicationId_scheduledAt: { medicationId, scheduledAt: when } },
    update: { takenAt: new Date() },
    create: { medicationId, scheduledAt: when, takenAt: new Date() },
  });

  res.json({ log });
});

module.exports = router;
