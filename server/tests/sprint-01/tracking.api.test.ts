import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/db/prisma.js';
import { Role } from '@prisma/client';

describe('Daily Tracking & Checklist API (API-09)', () => {
  let participant1Token: string;
  let participant2Token: string;
  let managerToken: string;
  let activeHabitId: number;
  let archivedHabitId: number;

  const p1Email = `tracking.p1.${Date.now()}@example.com`;
  const p2Email = `tracking.p2.${Date.now()}@example.com`;
  const mgrEmail = `tracking.mgr.${Date.now()}@example.com`;
  const password = 'Password123!';
  const todayStr = new Date().toISOString().split('T')[0];

  beforeAll(async () => {
    // 1. Participant 1
    const p1Res = await request(app).post('/api/auth/register').send({
      email: p1Email,
      password,
      fullName: 'Tracking Tester One',
      role: Role.PARTICIPANT,
    });
    participant1Token = p1Res.body.token;

    // 2. Participant 2
    const p2Res = await request(app).post('/api/auth/register').send({
      email: p2Email,
      password,
      fullName: 'Tracking Tester Two',
      role: Role.PARTICIPANT,
    });
    participant2Token = p2Res.body.token;

    // 3. Manager
    const mgrRes = await request(app).post('/api/auth/register').send({
      email: mgrEmail,
      password,
      fullName: 'Tracking Manager',
      role: Role.PROGRAM_MANAGER,
    });
    managerToken = mgrRes.body.token;

    // 4. Create Active Habit for Participant 1
    const activeHabit = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${participant1Token}`)
      .send({
        title: 'Morning Yoga',
        colorHex: '#009688', // Verdigris
        frequency: 'DAILY',
        targetCount: 20,
      });
    activeHabitId = activeHabit.body.id;

    // 5. Create and Archive another Habit for Participant 1
    const toArchive = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${participant1Token}`)
      .send({
        title: 'Old Habit',
        colorHex: '#f44336', // Cinnabar
        frequency: 'DAILY',
      });
    archivedHabitId = toArchive.body.id;
    await request(app)
      .delete(`/api/habits/${archivedHabitId}`)
      .set('Authorization', `Bearer ${participant1Token}`);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [p1Email, p2Email, mgrEmail],
        },
      },
    });
    await prisma.$disconnect();
  });

  describe('GET /api/tracking/today', () => {
    it('returns today checklist with totalScheduled and completedCount for active habits', async () => {
      const res = await request(app)
        .get(`/api/tracking/today?date=${todayStr}`)
        .set('Authorization', `Bearer ${participant1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.date).toBe(todayStr);
      expect(res.body.totalScheduled).toBeGreaterThanOrEqual(1);
      expect(res.body.completedCount).toBe(0);
      expect(Array.isArray(res.body.items)).toBe(true);

      const yogaItem = res.body.items.find((i: { habitId: number }) => i.habitId === activeHabitId);
      expect(yogaItem).toBeDefined();
      expect(yogaItem.title).toBe('Morning Yoga');
      expect(yogaItem.colorHex).toBe('#009688');
      expect(yogaItem.isCompleted).toBe(false);

      // Verify archived habit is NOT in today's checklist
      const archivedItem = res.body.items.find((i: { habitId: number }) => i.habitId === archivedHabitId);
      expect(archivedItem).toBeUndefined();
    });

    it('returns empty checklist items array for participant with zero habits without SQL errors', async () => {
      const res = await request(app)
        .get(`/api/tracking/today?date=${todayStr}`)
        .set('Authorization', `Bearer ${participant2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.totalScheduled).toBe(0);
      expect(res.body.completedCount).toBe(0);
      expect(res.body.items).toEqual([]);
    });

    it('rejects malformed query date with 422 INVALID_DATE_FORMAT', async () => {
      const res = await request(app)
        .get('/api/tracking/today?date=invalid-date')
        .set('Authorization', `Bearer ${participant1Token}`);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('INVALID_DATE_FORMAT');
    });
  });

  describe('POST /api/tracking/log (API-09 Idempotent Daily Logging)', () => {
    it('checks habit completion, creates HabitLog record, and updates checklist completedCount', async () => {
      const res = await request(app)
        .post('/api/tracking/log')
        .set('Authorization', `Bearer ${participant1Token}`)
        .send({
          habitId: activeHabitId,
          date: todayStr,
          completed: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.habitId).toBe(activeHabitId);
      expect(res.body.date).toBe(todayStr);
      expect(res.body.completed).toBe(true);

      // Verify checklist reflects completion
      const checkRes = await request(app)
        .get(`/api/tracking/today?date=${todayStr}`)
        .set('Authorization', `Bearer ${participant1Token}`);

      expect(checkRes.body.completedCount).toBe(1);
      const yogaItem = checkRes.body.items.find((i: { habitId: number }) => i.habitId === activeHabitId);
      expect(yogaItem.isCompleted).toBe(true);
    });

    it('idempotency: submitting completion twice produces 200 without duplicate records', async () => {
      const res = await request(app)
        .post('/api/tracking/log')
        .set('Authorization', `Bearer ${participant1Token}`)
        .send({
          habitId: activeHabitId,
          date: todayStr,
          completed: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.completed).toBe(true);

      // Verify only one log exists in database for this (habitId, date)
      const count = await prisma.habitLog.count({
        where: {
          habitId: activeHabitId,
          logDate: new Date(`${todayStr}T00:00:00.000Z`),
        },
      });
      expect(count).toBe(1);
    });

    it('unchecks habit completion, removes HabitLog record, and decrements completedCount', async () => {
      const res = await request(app)
        .post('/api/tracking/log')
        .set('Authorization', `Bearer ${participant1Token}`)
        .send({
          habitId: activeHabitId,
          date: todayStr,
          completed: false,
        });

      expect(res.status).toBe(200);
      expect(res.body.completed).toBe(false);

      // Verify in DB that log is removed
      const count = await prisma.habitLog.count({
        where: {
          habitId: activeHabitId,
          logDate: new Date(`${todayStr}T00:00:00.000Z`),
        },
      });
      expect(count).toBe(0);

      // Verify checklist reflects uncompleted state
      const checkRes = await request(app)
        .get(`/api/tracking/today?date=${todayStr}`)
        .set('Authorization', `Bearer ${participant1Token}`);

      expect(checkRes.body.completedCount).toBe(0);
      const yogaItem = checkRes.body.items.find((i: { habitId: number }) => i.habitId === activeHabitId);
      expect(yogaItem.isCompleted).toBe(false);
    });

    it('rejects logging for dates beyond tomorrow with 422 INVALID_LOG_DATE', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const res = await request(app)
        .post('/api/tracking/log')
        .set('Authorization', `Bearer ${participant1Token}`)
        .send({
          habitId: activeHabitId,
          date: futureDateStr,
          completed: true,
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('INVALID_LOG_DATE');
    });

    it('rejects logging for malformed date string with 422 INVALID_DATE_FORMAT', async () => {
      const res = await request(app)
        .post('/api/tracking/log')
        .set('Authorization', `Bearer ${participant1Token}`)
        .send({
          habitId: activeHabitId,
          date: 'not-a-date',
          completed: true,
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('INVALID_DATE_FORMAT');
    });

    it('rejects logging for soft-archived habit with 422 HABIT_ARCHIVED', async () => {
      const res = await request(app)
        .post('/api/tracking/log')
        .set('Authorization', `Bearer ${participant1Token}`)
        .send({
          habitId: archivedHabitId,
          date: todayStr,
          completed: true,
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('HABIT_ARCHIVED');
    });

    it('rejects logging for another participant habit with 404 HABIT_NOT_FOUND', async () => {
      const res = await request(app)
        .post('/api/tracking/log')
        .set('Authorization', `Bearer ${participant2Token}`)
        .send({
          habitId: activeHabitId,
          date: todayStr,
          completed: true,
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('HABIT_NOT_FOUND');
    });

    it('rejects logging for non-existent habit ID with 404 HABIT_NOT_FOUND', async () => {
      const res = await request(app)
        .post('/api/tracking/log')
        .set('Authorization', `Bearer ${participant1Token}`)
        .send({
          habitId: 999999,
          date: todayStr,
          completed: true,
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('HABIT_NOT_FOUND');
    });
  });

  describe('Role Barriers & Auth Protection', () => {
    it('rejects PROGRAM_MANAGER from calling GET /api/tracking/today with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/tracking/today')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('PARTICIPANT_ROLE_REQUIRED');
    });

    it('rejects PROGRAM_MANAGER from calling POST /api/tracking/log with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/tracking/log')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          habitId: activeHabitId,
          date: todayStr,
          completed: true,
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('PARTICIPANT_ROLE_REQUIRED');
    });

    it('rejects unauthenticated requests with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/tracking/today');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});

