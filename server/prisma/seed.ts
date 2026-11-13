import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD || 'ManagerPass123!';
  const defaultUserPassword = process.env.DEMO_USER_PASSWORD || 'ParticipantPass123!';

  const managerHash = await bcrypt.hash(adminPassword, 10);
  const userHash = await bcrypt.hash(defaultUserPassword, 10);

  // 1. Demo Program Manager
  await prisma.user.upsert({
    where: { email: 'manager@habitless.internal' },
    update: {
      fullName: 'Dr. Jordan Wells (Wellness Director)',
      role: Role.PROGRAM_MANAGER,
      passwordHash: managerHash,
      isActive: true,
    },
    create: {
      email: 'manager@habitless.internal',
      fullName: 'Dr. Jordan Wells (Wellness Director)',
      role: Role.PROGRAM_MANAGER,
      passwordHash: managerHash,
      isActive: true,
    },
  });

  // 2. Demo Participant 1
  await prisma.user.upsert({
    where: { email: 'participant1@habitless.internal' },
    update: {
      fullName: 'Alex Rivera',
      role: Role.PARTICIPANT,
      passwordHash: userHash,
      isActive: true,
    },
    create: {
      email: 'participant1@habitless.internal',
      fullName: 'Alex Rivera',
      role: Role.PARTICIPANT,
      passwordHash: userHash,
      isActive: true,
    },
  });

  // 3. Demo Participant 2
  await prisma.user.upsert({
    where: { email: 'participant2@habitless.internal' },
    update: {
      fullName: 'Taylor Chen',
      role: Role.PARTICIPANT,
      passwordHash: userHash,
      isActive: true,
    },
    create: {
      email: 'participant2@habitless.internal',
      fullName: 'Taylor Chen',
      role: Role.PARTICIPANT,
      passwordHash: userHash,
      isActive: true,
    },
  });

  console.log('Seed completed successfully: 1 Manager, 2 Participants.');
}

main()
  .catch((e) => {
    console.error('Seed failure:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

