/* Usage:
 *   EMAIL=foo@bar.com PASSWORD=secret node scripts/create-user.js
 * Idempotent: if user exists, updates the password.
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
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash },
      create: { email, passwordHash },
    });
    console.log('OK', user.id, user.email);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
