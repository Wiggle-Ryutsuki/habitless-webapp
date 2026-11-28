import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/db/prisma.js';
import { Role } from '@prisma/client';

describe('Habit Statistics & Heatmap API (API-S2-03 / Endpoint API-S2-02)', () => {
  let participant1Token: string;
  let participant2Token: string;
  let managerToken: string;

  const p1Email = `stats.p1.${Date.now()}@example.com`;
  const p2Email = `stats.p2.${Date.now()}@example.com`;
  const mgrEmail = `stats.mgr.${Date.now()}@example.com`;
  const password = 'Password123!';

  let activeHabitId: number;
  let archivedHabitId: number;

  beforeAll(async () => {
    const p1Res = await request(app).post('/api/auth/register').send({
      email: p1Email,
      password,
      fullName: 'Stats Participant 1',
      role: Role.PARTICIPANT,
    });
    participant1Token = p1Res.body.token;

    const p2Res = await request(app).post('/api/auth/register').send({
      email: p2Email,
      password,
      fullName: 'Stats Participant 2',
      role: Role.PARTICIPANT,
    });
    participant2Token = p2Res.body.token;

    const mgrRes = await request(app).post('/api/auth/register').send({
      email: mgrEmail,
      password,
      fullName: 'Stats Manager',
      role: Role.PROGRAM_MANAGER,
    });
    managerToken = mgrRes.body.token;

    const createActive = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${participant1Token}`)
      .send({
        title: 'Daily Reading',
        description: 'Read 20 pages',
        category: 'Learning',
        colorHex: '#009688',
        frequency: 'DAILY',
        daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
        startDate: '2026-11-01T00:00:00.000Z',
        targetCount: 20,
      });
    activeHabitId = createActive.body.id;

    // Seed completed logs in Nov 2026 directly for deterministic historical testing
    await prisma.habitLog.createMany({
      data: [
        { habitId: activeHabitId, logDate: new Date('2026-11-01T00:00:00.000Z'), completed: true },
        { habitId: activeHabitId, logDate: new Date('2026-11-23T00:00:00.000Z'), completed: true },
        { habitId: activeHabitId, logDate: new Date('2026-11-24T00:00:00.000Z'), completed: true },
        { habitId: activeHabitId, logDate: new Date('2026-11-25T00:00:00.000Z'), completed: true },
        { habitId: activeHabitId, logDate: new Date('2026-11-26T00:00:00.000Z'), completed: true },
      ],
    });

    const createArchived = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${participant1Token}`)
      .send({
        title: 'Archived Habit',
        colorHex: '#448aff',
        frequency: 'DAILY',
        startDate: '2026-11-01T00:00:00.000Z',
      });
    archivedHabitId = createArchived.body.id;

    await request(app)
      .delete(`/api/habits/${archivedHabitId}`)
      .set('Authorization', `Bearer ${participant1Token}`);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: { in: [p1Email, p2Email, mgrEmail] },
      },
    });
    await prisma.$disconnect();
  });

  it('enforces auth, RBAC, and ownership/active status checks', async () => {
    const unauth = await request(app).get(`/api/habits/${activeHabitId}/stats`);
    expect(unauth.status).toBe(401);

    const mgrRes = await request(app)
      .get(`/api/habits/${activeHabitId}/stats`)
      .set('Authorization', `Bearer ${managerToken}`);
    expect(mgrRes.status).toBe(403);
    expect(mgrRes.body.error.code).toBe('PARTICIPANT_ROLE_REQUIRED');

    const crossUser = await request(app)
      .get(`/api/habits/${activeHabitId}/stats`)
      .set('Authorization', `Bearer ${participant2Token}`);
    expect(crossUser.status).toBe(404);
    expect(crossUser.body.error.code).toBe('HABIT_NOT_FOUND');

    const archivedRes = await request(app)
      .get(`/api/habits/${archivedHabitId}/stats`)
      .set('Authorization', `Bearer ${participant1Token}`);
    expect(archivedRes.status).toBe(404);
    expect(archivedRes.body.error.code).toBe('HABIT_NOT_FOUND');

    const missingRes = await request(app)
      .get('/api/habits/999999/stats')
      .set('Authorization', `Bearer ${participant1Token}`);
    expect(missingRes.status).toBe(404);
    expect(missingRes.body.error.code).toBe('HABIT_NOT_FOUND');

    const badIdRes = await request(app)
      .get('/api/habits/abc/stats')
      .set('Authorization', `Bearer ${participant1Token}`);
    expect(badIdRes.status).toBe(404);
    expect(badIdRes.body.error.code).toBe('HABIT_NOT_FOUND');
  });

  it('validates mode, month, year, and date query params with 422', async () => {
    const badMode = await request(app)
      .get(`/api/habits/${activeHabitId}/stats?mode=weekly`)
      .set('Authorization', `Bearer ${participant1Token}`);
    expect(badMode.status).toBe(422);
    expect(badMode.body.error.code).toBe('INVALID_STATS_MODE');

    const badMonth = await request(app)
      .get(`/api/habits/${activeHabitId}/stats?month=13`)
      .set('Authorization', `Bearer ${participant1Token}`);
    expect(badMonth.status).toBe(422);
    expect(badMonth.body.error.code).toBe('INVALID_MONTH');

    const badYear = await request(app)
      .get(`/api/habits/${activeHabitId}/stats?year=1800`)
      .set('Authorization', `Bearer ${participant1Token}`);
    expect(badYear.status).toBe(422);
    expect(badYear.body.error.code).toBe('INVALID_YEAR');

    const badDate = await request(app)
      .get(`/api/habits/${activeHabitId}/stats?date=2026-02-31`)
      .set('Authorization', `Bearer ${participant1Token}`);
    expect(badDate.status).toBe(422);
    expect(badDate.body.error.code).toBe('INVALID_DATE_FORMAT');
  });

  it('returns Month Mode and Year Mode stats & heatmaps accurately without challengeStatus', async () => {
    const monthRes = await request(app)
      .get(`/api/habits/${activeHabitId}/stats?mode=month&month=11&year=2026&date=2026-11-26`)
      .set('Authorization', `Bearer ${participant1Token}`);

    expect(monthRes.status).toBe(200);
    expect(monthRes.body.habit).toMatchObject({
      id: activeHabitId,
      title: 'Daily Reading',
      category: 'Learning',
      colorHex: '#009688',
      frequency: 'DAILY',
      programId: null,
    });
    expect(monthRes.body.habit.challengeStatus).toBeUndefined();
    expect(monthRes.body.streaks).toEqual({
      currentStreak: 4,
      highestStreak: 4,
    });
    expect(monthRes.body.heatmap.mode).toBe('month');
    expect(monthRes.body.heatmap.month).toBe(11);
    expect(monthRes.body.heatmap.year).toBe(2026);
    expect(monthRes.body.heatmap.cells).toHaveLength(30);
    expect(monthRes.body.heatmap.cells.find((c: any) => c.key === '2026-11-01')?.opacity).toBe(1.0);
    expect(monthRes.body.heatmap.cells.find((c: any) => c.key === '2026-11-02')?.opacity).toBe(0);

    const yearRes = await request(app)
      .get(`/api/habits/${activeHabitId}/stats?mode=year&year=2026&date=2026-11-26`)
      .set('Authorization', `Bearer ${participant1Token}`);

    expect(yearRes.status).toBe(200);
    expect(yearRes.body.heatmap.mode).toBe('year');
    expect(yearRes.body.heatmap.month).toBeNull();
    expect(yearRes.body.heatmap.year).toBe(2026);
    expect(yearRes.body.heatmap.cells).toHaveLength(365);
    expect(yearRes.body.heatmap.cells[0]).toMatchObject({
      key: '2026-01-01',
      weekday: 4,
      weekIndex: 0,
      month: 1,
      completedCount: 0,
      scheduledCount: 0,
      opacity: 0,
    });
    expect(yearRes.body.heatmap.cells[364].key).toBe('2026-12-31');

    const nov26Cell = yearRes.body.heatmap.cells.find((c: any) => c.key === '2026-11-26');
    const nov27Cell = yearRes.body.heatmap.cells.find((c: any) => c.key === '2026-11-27');
    expect(nov26Cell).toMatchObject({
      key: '2026-11-26',
      weekday: 4,
      month: 11,
      scheduled: true,
      completedCount: 1,
      scheduledCount: 1,
      opacity: 1.0,
    });
    expect(nov27Cell).toMatchObject({
      key: '2026-11-27',
      weekday: 5,
      month: 11,
      scheduled: true,
      completedCount: 0,
      scheduledCount: 1,
      opacity: 0,
    });
  });
});
