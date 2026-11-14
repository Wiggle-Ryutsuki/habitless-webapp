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

  // 4. Feature 3 Sample Habits for Participant 1 (Aligned with _lab5_sec31_habitless.pdf, p. 3)
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
      title: 'Bathe + Moisturize',
      description: 'Morning or evening skincare routine',
      colorHex: '#009688',
      frequency: 'DAILY' as const,
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
      targetCount: 25,
    },
    {
      title: 'Eat a healthy breakfast',
      description: 'Whole foods, oats, eggs, or fruit',
      colorHex: '#8bc34a',
      frequency: 'DAILY' as const,
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
      targetCount: 20,
    },
    {
      title: 'No alcohol',
      description: 'Zero alcohol consumption',
      colorHex: '#f44336',
      frequency: 'DAILY' as const,
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
      targetCount: 20,
    },
    {
      title: 'No concentrated sugar',
      description: 'Avoid sweets, sodas, and candy',
      colorHex: '#ad1457',
      frequency: 'DAILY' as const,
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
      targetCount: 20,
    },
    {
      title: 'Eat a light dinner',
      description: 'Salad, soup, or light portion before 8 PM',
      colorHex: '#ffc107',
      frequency: 'DAILY' as const,
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
      targetCount: 20,
    },
    {
      title: 'Sleep for 7.5 hrs',
      description: 'Restful uninterrupted sleep schedule',
      colorHex: '#1565c0',
      frequency: 'DAILY' as const,
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
      targetCount: 25,
    },
  ];

  const seededHabits: any[] = [];
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

  // 5. Multi-Day Completion Logs for Current Month
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonthIndex = now.getUTCMonth();
  const currentDay = now.getUTCDate();

  // Pattern of completed days for Journal (up to day 18 / today)
  const journalDays = [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, currentDay].filter(
    (d, i, arr) => d <= currentDay && arr.indexOf(d) === i
  );
  const exerciseDays = [1, 3, 4, 5, 7, 8, 10, 11, 13, 14, 15, 16, currentDay].filter(
    (d, i, arr) => d <= currentDay && arr.indexOf(d) === i
  );

  const journalHabit = seededHabits.find((h) => h.title === 'Journal');
  if (journalHabit) {
    for (const day of journalDays) {
      const logDate = new Date(Date.UTC(currentYear, currentMonthIndex, day));
      await prisma.habitLog.upsert({
        where: {
          habitId_logDate: {
            habitId: journalHabit.id,
            logDate,
          },
        },
        update: { completed: true },
        create: {
          habitId: journalHabit.id,
          logDate,
          completed: true,
        },
      });
    }
  }

  const exerciseHabit = seededHabits.find((h) => h.title === 'Exercise');
  if (exerciseHabit) {
    for (const day of exerciseDays) {
      const logDate = new Date(Date.UTC(currentYear, currentMonthIndex, day));
      await prisma.habitLog.upsert({
        where: {
          habitId_logDate: {
            habitId: exerciseHabit.id,
            logDate,
          },
        },
        update: { completed: true },
        create: {
          habitId: exerciseHabit.id,
          logDate,
          completed: true,
        },
      });
    }
  }

  // 6. Reflection Notes (DailyNote entries)
  const noAlcoholHabit = seededHabits.find((h) => h.title === 'No alcohol');
  const sampleNotes = [
    {
      noteDay: Math.min(18, currentDay),
      content: "I gotta make sure I don't let my alcohol intake get regular again.",
      habitId: noAlcoholHabit?.id ?? null,
    },
    {
      noteDay: Math.max(1, Math.min(17, currentDay - 1)),
      content: 'Great energy after morning meditation and workout.',
      habitId: exerciseHabit?.id ?? null,
    },
  ];

  for (const sn of sampleNotes) {
    const noteDate = new Date(Date.UTC(currentYear, currentMonthIndex, sn.noteDay));
    const existing = await prisma.dailyNote.findFirst({
      where: {
        userId: participant1.id,
        noteDate,
        content: sn.content,
      },
    });
    if (!existing) {
      await prisma.dailyNote.create({
        data: {
          userId: participant1.id,
          habitId: sn.habitId,
          noteDate,
          content: sn.content,
        },
      });
    }
  }

  console.log('Seed completed successfully: 1 Manager, 2 Participants, 8 Habits, Multi-day logs & Reflection Notes.');
}

main()
  .catch((e) => {
    console.error('Seed failure:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

