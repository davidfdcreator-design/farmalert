/* Usage:
 *   EMAIL=foo@bar.com PASSWORD=secret [ADMIN=true] node scripts/create-user.js
 * Idempotent: if user exists, updates password and admin flag.
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const email = (process.env.EMAIL || '').trim().toLowerCase();
  const password = process.env.PASSWORD || '';
  if (!email || !password) {
    console.error('Set EMAIL and PASSWORD env vars');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const isAdmin = String(process.env.ADMIN || '').toLowerCase() === 'true';
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash, isAdmin },
      create: { email, passwordHash, isAdmin },
    });
    console.log('OK', user.id, user.email, 'admin:', user.isAdmin);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
