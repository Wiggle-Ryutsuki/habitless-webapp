import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/db/prisma.js';
import { Role } from '@prisma/client';

describe('Calendar Desktop & Goals API (API-10)', () => {
  let participant1Token: string;
  let participant2Token: string;
  let managerToken: string;
  let p1HabitId: number;
  let p2HabitId: number;

  const p1Email = `cal.p1.${Date.now()}@example.com`;
  const p2Email = `cal.p2.${Date.now()}@example.com`;
  const mgrEmail = `cal.mgr.${Date.now()}@example.com`;
  const password = 'Password123!';

  beforeAll(async () => {
    // 1. Participant 1
    const p1Res = await request(app).post('/api/auth/register').send({
      email: p1Email,
      password,
      fullName: 'Cal Tester One',
      role: Role.PARTICIPANT,
    });
    participant1Token = p1Res.body.token;

    // 2. Participant 2
    const p2Res = await request(app).post('/api/auth/register').send({
      email: p2Email,
      password,
      fullName: 'Cal Tester Two',
      role: Role.PARTICIPANT,
    });
    participant2Token = p2Res.body.token;

    // 3. Manager
    const mgrRes = await request(app).post('/api/auth/register').send({
      email: mgrEmail,
      password,
      fullName: 'Cal Manager',
      role: Role.PROGRAM_MANAGER,
    });
    managerToken = mgrRes.body.token;

    // Create a habit for P1
    const h1Res = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${participant1Token}`)
      .send({
        title: 'Morning Yoga',
        colorHex: '#009688',
        frequency: 'DAILY',
        targetCount: 20,
      });
    p1HabitId = h1Res.body.id;

    // Create a habit for P2
    const h2Res = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${participant2Token}`)
      .send({
        title: 'Reading Book',
        colorHex: '#448aff',
        frequency: 'DAILY',
        targetCount: 15,
      });
    p2HabitId = h2Res.body.id;

    // Log completion for P1 on 2021-03-01 and 2021-03-15
    await prisma.habitLog.createMany({
      data: [
        { habitId: p1HabitId, logDate: new Date('2021-03-01T00:00:00.000Z'), completed: true },
        { habitId: p1HabitId, logDate: new Date('2021-03-15T00:00:00.000Z'), completed: true },
      ],
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: { in: [p1Email, p2Email, mgrEmail] },
      },
    });
    await prisma.$disconnect();
  });

  describe('GET /api/tracking/calendar (API-10)', () => {
    it('returns 31-day month grid with completion cells, target counts, and goal achieved sums', async () => {
      const res = await request(app)
        .get('/api/tracking/calendar?month=3&year=2021')
        .set('Authorization', `Bearer ${participant1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.month).toBe(3);
      expect(res.body.year).toBe(2021);
      expect(res.body.daysInMonth).toBe(31);
      expect(res.body.dayInitials).toBeDefined();
      expect(res.body.dayInitials.length).toBe(31);

      // In March 2021, March 1 was a Monday ('M')
      expect(res.body.dayInitials[0]).toBe('M');

      const habit = res.body.habits.find((h: any) => h.habitId === p1HabitId);
      expect(habit).toBeDefined();
      expect(habit.title).toBe('Morning Yoga');
      expect(habit.colorHex).toBe('#009688');
      expect(habit.frequency).toBe('DAILY');
      expect(habit.startDate).toBeDefined();
      expect(habit.targetCount).toBe(20);
      expect(habit.goalAchievedCount).toBe(2);
      expect(habit.days['1']).toBe(true);
      expect(habit.days['15']).toBe(true);
      expect(habit.days['2']).toBe(false);
    });

    it('correctly reports leap year February (29 days)', async () => {
      const res = await request(app)
        .get('/api/tracking/calendar?month=2&year=2024')
        .set('Authorization', `Bearer ${participant1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.daysInMonth).toBe(29);
      expect(res.body.dayInitials.length).toBe(29);
    });

    it('rejects invalid or missing query parameters with 400 Bad Request', async () => {
      const res1 = await request(app)
        .get('/api/tracking/calendar?month=13&year=2021')
        .set('Authorization', `Bearer ${participant1Token}`);
      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .get('/api/tracking/calendar?month=3&year=abc')
        .set('Authorization', `Bearer ${participant1Token}`);
      expect(res2.status).toBe(400);

      const res3 = await request(app)
        .get('/api/tracking/calendar')
        .set('Authorization', `Bearer ${participant1Token}`);
      expect(res3.status).toBe(400);
    });

    it('enforces participant data isolation: Participant 1 does not see Participant 2 habits', async () => {
      const res = await request(app)
        .get('/api/tracking/calendar?month=3&year=2021')
        .set('Authorization', `Bearer ${participant1Token}`);

      expect(res.status).toBe(200);
      const habits = res.body.habits;
      expect(habits.some((h: any) => h.habitId === p2HabitId)).toBe(false);
    });

    it('rejects unauthenticated requests with 401 and manager with 403', async () => {
      const res1 = await request(app).get('/api/tracking/calendar?month=3&year=2021');
      expect(res1.status).toBe(401);

      const res2 = await request(app)
        .get('/api/tracking/calendar?month=3&year=2021')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(res2.status).toBe(403);
    });
  });

  describe('GET /api/tracking/goals', () => {
    it('returns monthly goals summary with active habit count, achieved total, and habits summary', async () => {
      const res = await request(app)
        .get('/api/tracking/goals?month=3&year=2021')
        .set('Authorization', `Bearer ${participant1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.activeHabitsCount).toBeGreaterThanOrEqual(1);
      expect(res.body.totalGoalsAchievedThisMonth).toBe(2);

      const item = res.body.habitsSummary.find((s: any) => s.habitId === p1HabitId);
      expect(item).toBeDefined();
      expect(item.target).toBe(20);
      expect(item.achieved).toBe(2);
    });

    it('enforces participant data isolation for goals endpoint', async () => {
      const res = await request(app)
        .get('/api/tracking/goals?month=3&year=2021')
        .set('Authorization', `Bearer ${participant1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.habitsSummary.some((s: any) => s.habitId === p2HabitId)).toBe(false);
    });

    it('rejects unauthenticated requests with 401 and manager with 403', async () => {
      const res1 = await request(app).get('/api/tracking/goals');
      expect(res1.status).toBe(401);

      const res2 = await request(app)
        .get('/api/tracking/goals')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(res2.status).toBe(403);
    });
  });
});

