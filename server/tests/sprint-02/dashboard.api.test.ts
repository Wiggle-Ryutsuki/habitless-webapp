import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/db/prisma.js';
import { Role } from '@prisma/client';

describe('Participant Dashboard API (API-S2-02 / Endpoint API-S2-01)', () => {
  let participantToken: string;
  let managerToken: string;
  let programId: number;

  const pEmail = `dashboard.p1.${Date.now()}@example.com`;
  const mgrEmail = `dashboard.mgr.${Date.now()}@example.com`;
  const password = 'Password123!';

  beforeAll(async () => {
    const pRes = await request(app).post('/api/auth/register').send({
      email: pEmail,
      password,
      fullName: 'Dashboard Participant',
      role: Role.PARTICIPANT,
    });
    participantToken = pRes.body.token;

    const mgrRes = await request(app).post('/api/auth/register').send({
      email: mgrEmail,
      password,
      fullName: 'Dashboard Manager',
      role: Role.PROGRAM_MANAGER,
    });
    managerToken = mgrRes.body.token;

    const createProg = await request(app)
      .post('/api/manager/programs')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        title: 'Sprint 2 Dashboard Challenge',
        category: 'Health & Fitness',
        description: '7-day momentum challenge',
        startDate: '2026-11-23T00:00:00.000Z',
        endDate: '2026-11-30T00:00:00.000Z',
        activities: [
          {
            title: 'Challenge Hydration',
            description: '2L water daily',
            frequency: 'DAILY',
            daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
            targetCount: 1,
          },
        ],
      });
    programId = createProg.body.id;

    await request(app)
      .put(`/api/manager/programs/${programId}/deploy`)
      .set('Authorization', `Bearer ${managerToken}`);
  });

  afterAll(async () => {
    await prisma.habit.deleteMany({
      where: { user: { email: pEmail } },
    });
    await prisma.programEnrollment.deleteMany({
      where: { programId },
    });
    await prisma.challengeProgram.deleteMany({
      where: { id: programId },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [pEmail, mgrEmail] } },
    });
    await prisma.$disconnect();
  });

  it('enforces auth & RBAC guards (401 unauthenticated, 403 manager) and validates date query', async () => {
    const unauth = await request(app).get('/api/tracking/dashboard');
    expect(unauth.status).toBe(401);

    const mgrRes = await request(app)
      .get('/api/tracking/dashboard')
      .set('Authorization', `Bearer ${managerToken}`);
    expect(mgrRes.status).toBe(403);
    expect(mgrRes.body.error.code).toBe('PARTICIPANT_ROLE_REQUIRED');

    const badDate = await request(app)
      .get('/api/tracking/dashboard?date=bad-date')
      .set('Authorization', `Bearer ${participantToken}`);
    expect(badDate.status).toBe(422);
    expect(badDate.body.error.code).toBe('INVALID_DATE_FORMAT');

    const rolloverDate = await request(app)
      .get('/api/tracking/dashboard?date=2026-02-31')
      .set('Authorization', `Bearer ${participantToken}`);
    expect(rolloverDate.status).toBe(422);
    expect(rolloverDate.body.error.code).toBe('INVALID_DATE_FORMAT');
  });

  it('returns empty dashboard payload with 7 weekDays and 0 programCompletion when user has no habits', async () => {
    const res = await request(app)
      .get('/api/tracking/dashboard?date=2026-11-26')
      .set('Authorization', `Bearer ${participantToken}`);

    expect(res.status).toBe(200);
    expect(res.body.date).toBe('2026-11-26');
    expect(res.body.weekStart).toBe('2026-11-23');
    expect(res.body.weekEnd).toBe('2026-11-29');
    expect(res.body.weekDays).toHaveLength(7);
    expect(res.body.weekDays.find((d: any) => d.date === '2026-11-26')?.isToday).toBe(true);
    expect(res.body.todayFocus).toEqual({
      totalScheduled: 0,
      completedCount: 0,
      items: [],
    });
    expect(res.body.weeklyProgress).toEqual([]);
    expect(res.body.programCompletion).toEqual({
      activeProgramsCount: 0,
      totalCompletedLogs: 0,
      totalScheduledDaysToDate: 0,
      percentage: 0,
    });
  });

  it('returns todayFocus, weeklyProgress, and programCompletion while ignoring archived habits', async () => {
    const journalRes = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${participantToken}`)
      .send({
        title: 'Evening Journal',
        category: 'Mindfulness',
        colorHex: '#ff9800',
        frequency: 'DAILY',
        daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
        startDate: '2026-11-20T00:00:00.000Z',
        targetCount: 20,
      });
    const journalId = journalRes.body.id;

    const workoutRes = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${participantToken}`)
      .send({
        title: 'Gym Session',
        category: null,
        colorHex: '#009688',
        frequency: 'THREE_TIMES_WEEKLY',
        daysOfWeek: [1, 3, 5],
        startDate: '2026-11-20T00:00:00.000Z',
        targetCount: 12,
      });
    const workoutId = workoutRes.body.id;

    const archivedRes = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${participantToken}`)
      .send({
        title: 'Archived Habit',
        colorHex: '#f44336',
        frequency: 'DAILY',
        daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
        startDate: '2026-11-20T00:00:00.000Z',
      });
    await request(app)
      .delete(`/api/habits/${archivedRes.body.id}`)
      .set('Authorization', `Bearer ${participantToken}`);

    // Join published challenge -> creates Challenge Hydration with programId
    await request(app)
      .post(`/api/challenges/${programId}/join`)
      .set('Authorization', `Bearer ${participantToken}`);

    // Force deterministic startDate on cloned challenge habit so test works independent of today's date
    await prisma.habit.updateMany({
      where: { user: { email: pEmail }, programId },
      data: { startDate: new Date('2026-11-23T00:00:00.000Z') },
    });

    const todayStr = new Date().toISOString().split('T')[0];
    // Log completions in current week for 2026-11-23..2026-11-26? Note logHabit caps at tomorrow UTC,
    // so log past/today relative to actual wall clock for DB integration:
    await request(app)
      .post('/api/tracking/log')
      .set('Authorization', `Bearer ${participantToken}`)
      .send({ habitId: journalId, date: todayStr, completed: true });

    const clonedChallengeHabit = await prisma.habit.findFirstOrThrow({
      where: { user: { email: pEmail }, programId },
    });
    await request(app)
      .post('/api/tracking/log')
      .set('Authorization', `Bearer ${participantToken}`)
      .send({ habitId: clonedChallengeHabit.id, date: todayStr, completed: true });

    const dashRes = await request(app)
      .get(`/api/tracking/dashboard?date=${todayStr}`)
      .set('Authorization', `Bearer ${participantToken}`);

    expect(dashRes.status).toBe(200);
    expect(dashRes.body.weekDays).toHaveLength(7);

    const focusJournal = dashRes.body.todayFocus.items.find(
      (i: any) => i.habitId === journalId
    );
    expect(focusJournal).toMatchObject({
      habitId: journalId,
      title: 'Evening Journal',
      category: 'Mindfulness',
      colorHex: '#ff9800',
      isCompleted: true,
    });

    const archivedFocus = dashRes.body.todayFocus.items.find(
      (i: any) => i.title === 'Archived Habit'
    );
    expect(archivedFocus).toBeUndefined();

    const journalBar = dashRes.body.weeklyProgress.find(
      (w: any) => w.habitId === journalId
    );
    expect(journalBar).toMatchObject({
      habitId: journalId,
      category: 'Mindfulness',
      colorHex: '#ff9800',
      scheduledDaysThisWeek: 7,
    });
    expect(journalBar.completedDaysThisWeek).toBeGreaterThanOrEqual(1);

    const workoutBar = dashRes.body.weeklyProgress.find(
      (w: any) => w.habitId === workoutId
    );
    expect(workoutBar).toMatchObject({
      habitId: workoutId,
      category: null,
      colorHex: '#009688',
      scheduledDaysThisWeek: 3,
      completedDaysThisWeek: 0,
      percentage: 0,
    });

    expect(dashRes.body.programCompletion.activeProgramsCount).toBe(1);
    expect(dashRes.body.programCompletion.totalCompletedLogs).toBeGreaterThanOrEqual(1);
    expect(dashRes.body.programCompletion.totalScheduledDaysToDate).toBeGreaterThanOrEqual(1);
    expect(dashRes.body.programCompletion.percentage).toBeGreaterThan(0);
  });
});
