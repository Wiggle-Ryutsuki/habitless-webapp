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
  const participant1 = await prisma.user.upsert({
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

  // 4. Feature 2 Sample Habits for Participant 1
  const sampleHabits = [
    {
      title: 'Journal',
      description: 'Daily reflection before bed',
      colorHex: '#ff9800',
      frequency: 'DAILY' as const,
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
      targetCount: 20,
    },
    {
      title: 'Exercise',
      description: 'Daily workout or 30-min run',
      colorHex: '#448aff',
      frequency: 'DAILY' as const,
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
      targetCount: 20,
    },
    {
      title: 'Read 20 mins',
      description: 'Non-fiction or personal development',
      colorHex: '#009688',
      frequency: 'WEEKDAYS' as const,
      daysOfWeek: [1, 2, 3, 4, 5],
      targetCount: 15,
    },
    {
      title: 'Meditation',
      description: 'Morning mindfulness breathing',
      colorHex: '#8bc34a',
      frequency: 'DAILY' as const,
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
      targetCount: 25,
    },
  ];

  const seededHabits = [];
  for (const h of sampleHabits) {
    const existing = await prisma.habit.findFirst({
      where: { userId: participant1.id, title: h.title },
    });
    if (existing) {
      const updated = await prisma.habit.update({
        where: { id: existing.id },
        data: {
          description: h.description,
          colorHex: h.colorHex,
          frequency: h.frequency,
          daysOfWeek: h.daysOfWeek,
          targetCount: h.targetCount,
          isActive: true,
        },
      });
      seededHabits.push(updated);
    } else {
      const created = await prisma.habit.create({
        data: {
          userId: participant1.id,
          title: h.title,
          description: h.description,
          colorHex: h.colorHex,
          frequency: h.frequency,
          daysOfWeek: h.daysOfWeek,
          targetCount: h.targetCount,
          isActive: true,
        },
      });
      seededHabits.push(created);
    }
  }

  // 5. Feature 2 Sample Today's Completion Log for Habit 1 (Journal)
  const todayUtc = new Date();
  todayUtc.setUTCHours(0, 0, 0, 0);

  if (seededHabits[0]) {
    await prisma.habitLog.upsert({
      where: {
        habitId_logDate: {
          habitId: seededHabits[0].id,
          logDate: todayUtc,
        },
      },
      update: {
        completed: true,
      },
      create: {
        habitId: seededHabits[0].id,
        logDate: todayUtc,
        completed: true,
      },
    });
  }

  console.log('Seed completed successfully: 1 Manager, 2 Participants, 4 Habits, 1 Today Log.');
}

main()
  .catch((e) => {
    console.error('Seed failure:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

