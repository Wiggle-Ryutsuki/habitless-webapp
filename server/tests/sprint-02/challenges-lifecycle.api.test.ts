import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/db/prisma.js';
import { Role } from '@prisma/client';

describe('Feature 8 Challenges Lifecycle & Sync API (API-S2-05, API-S2-06)', () => {
  let participantToken: string;
  let managerToken: string;

  const pEmail = `lifecycle.p.${Date.now()}@example.com`;
  const mgrEmail = `lifecycle.mgr.${Date.now()}@example.com`;
  const password = 'Password123!';

  let programId: number;
  let initialActivityId: number;

  beforeAll(async () => {
    const pRes = await request(app).post('/api/auth/register').send({
      email: pEmail,
      password,
      fullName: 'Lifecycle Participant',
      role: Role.PARTICIPANT,
    });
    participantToken = pRes.body.token;

    const mgrRes = await request(app).post('/api/auth/register').send({
      email: mgrEmail,
      password,
      fullName: 'Lifecycle Manager',
      role: Role.PROGRAM_MANAGER,
    });
    managerToken = mgrRes.body.token;

    // Create Draft Program
    const progRes = await request(app)
      .post('/api/manager/programs')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        title: '30-Day Productivity Sprint',
        description: 'Focus blocks and deep work routines.',
        category: 'Productivity',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        activities: [
          {
            title: 'Pomodoro Focus Session',
            description: '25m uninterrupted deep work block.',
            frequency: 'DAILY',
            daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
            targetCount: 20,
          },
        ],
      });
    programId = progRes.body.id;
    initialActivityId = progRes.body.activities[0].id;

    // Deploy Program (Initial Publish: Version 1)
    await request(app)
      .put(`/api/manager/programs/${programId}/deploy`)
      .set('Authorization', `Bearer ${managerToken}`);
  });

  afterAll(async () => {
    await prisma.challengeProgram.deleteMany({
      where: {
        manager: {
          email: mgrEmail,
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [pEmail, mgrEmail],
        },
      },
    });
    await prisma.$disconnect();
  });

  it('API-S2-05: leaving with KEEP clears challenge linkage and preserves habit logs', async () => {
    // 1. Join challenge
    const joinRes = await request(app)
      .post(`/api/challenges/${programId}/join`)
      .set('Authorization', `Bearer ${participantToken}`);
    expect(joinRes.status).toBe(201);

    // 2. Find cloned habit and add a log
    const habit = await prisma.habit.findFirst({
      where: { programId, sourceActivityId: initialActivityId },
    });
    expect(habit).not.toBeNull();

    const todayDate = new Date().toISOString().split('T')[0];
    const logRes = await request(app)
      .post('/api/tracking/log')
      .set('Authorization', `Bearer ${participantToken}`)
      .send({ habitId: habit!.id, date: todayDate, completed: true });
    expect([200, 201]).toContain(logRes.status);

    // 3. Leave with KEEP
    const leaveRes = await request(app)
      .post(`/api/challenges/${programId}/leave`)
      .set('Authorization', `Bearer ${participantToken}`)
      .send({ action: 'KEEP' });

    expect(leaveRes.status).toBe(200);
    expect(leaveRes.body.action).toBe('KEEP');
    expect(leaveRes.body.affectedHabitsCount).toBeGreaterThanOrEqual(1);

    // Verify habit updated to personal (unlinked)
    const updatedHabit = await prisma.habit.findUnique({
      where: { id: habit!.id },
      include: { logs: true },
    });
    expect(updatedHabit!.programId).toBeNull();
    expect(updatedHabit!.sourceActivityId).toBeNull();
    expect(updatedHabit!.challengeStatus).toBeNull();
    expect(updatedHabit!.isActive).toBe(true);
    expect(updatedHabit!.logs.length).toBeGreaterThanOrEqual(1);

    // Verify enrollment status is LEFT
    const enrollment = await prisma.programEnrollment.findFirst({
      where: { programId, participant: { email: pEmail } },
    });
    expect(enrollment!.status).toBe('LEFT');
    expect(enrollment!.leftAt).not.toBeNull();
  });

  it('API-S2-05: re-enrolling after leaving reactivates enrollment and creates fresh snapshot', async () => {
    const reJoinRes = await request(app)
      .post(`/api/challenges/${programId}/join`)
      .set('Authorization', `Bearer ${participantToken}`);

    expect(reJoinRes.status).toBe(201);

    const enrollment = await prisma.programEnrollment.findFirst({
      where: { programId, participant: { email: pEmail } },
    });
    expect(enrollment!.status).toBe('ACTIVE');
    expect(enrollment!.isActive).toBe(true);
    expect(enrollment!.leftAt).toBeNull();

    const freshHabits = await prisma.habit.findMany({
      where: { programId, user: { email: pEmail }, isActive: true },
    });
    expect(freshHabits.length).toBe(1);
    expect(freshHabits[0].challengeStatus).toBe('ACTIVE');
    expect(freshHabits[0].syncedVersion).toBe(1);
  });

  it('API-S2-06: unpublishing transitions habits to ENDED, and unchanged republish restores them to ACTIVE', async () => {
    // 1. Manager unpublishes program
    const unpubRes = await request(app)
      .put(`/api/manager/programs/${programId}/unpublish`)
      .set('Authorization', `Bearer ${managerToken}`);
    expect(unpubRes.status).toBe(200);

    // Verify habits transitioned to ENDED
    const endedHabits = await prisma.habit.findMany({
      where: { programId, user: { email: pEmail }, isActive: true },
    });
    expect(endedHabits.every((h) => h.challengeStatus === 'ENDED')).toBe(true);

    // Check challenge detail returns hasUnresolvedEndedHabits: true
    const detailRes = await request(app)
      .get(`/api/challenges/${programId}`)
      .set('Authorization', `Bearer ${participantToken}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.myEnrollment.hasUnresolvedEndedHabits).toBe(true);

    // 2. Unchanged Republish: manager deploys again without updating draft
    const repubRes = await request(app)
      .put(`/api/manager/programs/${programId}/deploy`)
      .set('Authorization', `Bearer ${managerToken}`);
    expect(repubRes.status).toBe(200);

    // Verify program version remained 1
    const prog = await prisma.challengeProgram.findUnique({
      where: { id: programId },
    });
    expect(prog!.version).toBe(1);

    // Verify habits restored to ACTIVE
    const restoredHabits = await prisma.habit.findMany({
      where: { programId, user: { email: pEmail }, isActive: true },
    });
    expect(restoredHabits.every((h) => h.challengeStatus === 'ACTIVE')).toBe(true);
  });

  it('API-S2-06: edited republish increments version, flags updateAvailable, and sync applies changes without touching logs', async () => {
    // 1. Unpublish to edit
    await request(app)
      .put(`/api/manager/programs/${programId}/unpublish`)
      .set('Authorization', `Bearer ${managerToken}`);

    // 2. Update draft program with modified title on activity 1 and add activity 2
    const updateRes = await request(app)
      .put(`/api/manager/programs/${programId}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        title: '30-Day Productivity Sprint (v2)',
        description: 'Updated focus blocks and evening review.',
        category: 'Productivity',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        activities: [
          {
            id: initialActivityId,
            title: 'Upgraded 50m Focus Block',
            description: 'Double pomodoro session.',
            frequency: 'DAILY',
            daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
            targetCount: 20,
          },
          {
            title: 'Evening Day Review',
            description: '5 minute reflection on daily tasks.',
            frequency: 'WEEKDAYS',
            daysOfWeek: [1, 2, 3, 4, 5],
            targetCount: 15,
          },
        ],
      });
    expect(updateRes.status).toBe(200);

    // 3. Republish edited program
    const deployV2Res = await request(app)
      .put(`/api/manager/programs/${programId}/deploy`)
      .set('Authorization', `Bearer ${managerToken}`);
    expect(deployV2Res.status).toBe(200);

    // Verify program version incremented to 2
    const progV2 = await prisma.challengeProgram.findUnique({
      where: { id: programId },
    });
    expect(progV2!.version).toBe(2);

    // 4. Participant checks challenge detail -> updateAvailable is true
    const detailV2 = await request(app)
      .get(`/api/challenges/${programId}`)
      .set('Authorization', `Bearer ${participantToken}`);
    expect(detailV2.status).toBe(200);
    expect(detailV2.body.version).toBe(2);
    expect(detailV2.body.myEnrollment.updateAvailable).toBe(true);

    // Log completion on existing habit before syncing
    const existingHabit = await prisma.habit.findFirst({
      where: { programId, sourceActivityId: initialActivityId, isActive: true },
    });
    const logDate = '2026-11-20';
    await prisma.habitLog.upsert({
      where: {
        habitId_logDate: {
          habitId: existingHabit!.id,
          logDate: new Date(`${logDate}T00:00:00.000Z`),
        },
      },
      update: { completed: true },
      create: {
        habitId: existingHabit!.id,
        logDate: new Date(`${logDate}T00:00:00.000Z`),
        completed: true,
      },
    });

    // 5. POST /api/challenges/:id/sync
    const syncRes = await request(app)
      .post(`/api/challenges/${programId}/sync`)
      .set('Authorization', `Bearer ${participantToken}`);

    expect(syncRes.status).toBe(200);
    expect(syncRes.body.syncedVersion).toBe(2);
    expect(syncRes.body.updatedCount).toBe(1);
    expect(syncRes.body.addedCount).toBe(1);

    // Verify existing habit updated and log intact
    const syncedExistingHabit = await prisma.habit.findUnique({
      where: { id: existingHabit!.id },
      include: { logs: true },
    });
    expect(syncedExistingHabit!.title).toBe('Upgraded 50m Focus Block');
    expect(syncedExistingHabit!.syncedVersion).toBe(2);
    expect(syncedExistingHabit!.logs.length).toBeGreaterThanOrEqual(1);

    // Verify second habit created
    const newHabits = await prisma.habit.findMany({
      where: { programId, user: { email: pEmail }, isActive: true },
    });
    expect(newHabits.length).toBe(2);

    // Verify updateAvailable is now false
    const afterSyncDetail = await request(app)
      .get(`/api/challenges/${programId}`)
      .set('Authorization', `Bearer ${participantToken}`);
    expect(afterSyncDetail.body.myEnrollment.updateAvailable).toBe(false);
  });
});
