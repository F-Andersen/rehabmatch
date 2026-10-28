// Run after showcase seed to give the administrator a separate password.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const { SEED_ADMIN_EMAIL: email, SEED_ADMIN_PASSWORD: password } = process.env;
if (!email || !password || password.length < 16) throw new Error('Set a strong admin email/password');
const prisma = new PrismaClient();
try {
  await prisma.user.update({
    where: { email: email.toLowerCase() },
    data: { passwordHash: await bcrypt.hash(password, 12) },
  });
  console.log('Independent administrator password configured.');
} finally {
  await prisma.$disconnect();
}
