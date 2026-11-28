import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/db/prisma.js';
import { Role } from '@prisma/client';

describe('Feature 8 Challenges Hub & Join API (API-S2-04)', () => {
  let p1Token: string;
  let p2Token: string;
  let mgrToken: string;

  const p1Email = `hub.p1.${Date.now()}@example.com`;
  const p2Email = `hub.p2.${Date.now()}@example.com`;
  const mgrEmail = `hub.mgr.${Date.now()}@example.com`;
  const password = 'Password123!';

  let programAId: number;
  let programBId: number;
  let programAActivityId: number;

  beforeAll(async () => {
    const p1Res = await request(app).post('/api/auth/register').send({
      email: p1Email,
      password,
      fullName: 'Hub Participant 1',
      role: Role.PARTICIPANT,
    });
    p1Token = p1Res.body.token;

    const p2Res = await request(app).post('/api/auth/register').send({
      email: p2Email,
      password,
      fullName: 'Hub Participant 2',
      role: Role.PARTICIPANT,
    });
    p2Token = p2Res.body.token;

    const mgrRes = await request(app).post('/api/auth/register').send({
      email: mgrEmail,
      password,
      fullName: 'Hub Manager',
      role: Role.PROGRAM_MANAGER,
    });
    mgrToken = mgrRes.body.token;

    // Create Program A
    const progARes = await request(app)
      .post('/api/manager/programs')
      .set('Authorization', `Bearer ${mgrToken}`)
      .send({
        title: 'Cardio Boost Sprint Challenge',
        description: 'Boost endurance with daily cardio exercises.',
        category: 'Health & Fitness',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        activities: [
          {
            title: 'Morning 5K Jog',
            description: 'Run at steady conversational pace.',
            frequency: 'DAILY',
            daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
            targetCount: 20,
          },
        ],
      });
    programAId = progARes.body.id;
    programAActivityId = progARes.body.activities[0].id;

    // Deploy Program A
    await request(app)
      .put(`/api/manager/programs/${programAId}/deploy`)
      .set('Authorization', `Bearer ${mgrToken}`);

    // Create Program B
    const progBRes = await request(app)
      .post('/api/manager/programs')
      .set('Authorization', `Bearer ${mgrToken}`)
      .send({
        title: 'Daily Mindfulness Habit',
        description: 'Reduce stress with guided meditation sessions.',
        category: 'Mindfulness',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
        activities: [
          {
            title: 'Headspace Meditation',
            description: '10 minute mindfulness practice.',
            frequency: 'WEEKDAYS',
            daysOfWeek: [1, 2, 3, 4, 5],
            targetCount: 10,
          },
        ],
      });
    programBId = progBRes.body.id;

    // Deploy Program B
    await request(app)
      .put(`/api/manager/programs/${programBId}/deploy`)
      .set('Authorization', `Bearer ${mgrToken}`);
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
          in: [p1Email, p2Email, mgrEmail],
        },
      },
    });
    await prisma.$disconnect();
  });

  it('lists published challenges with search and category filtering (GET /api/challenges)', async () => {
    const res = await request(app)
      .get('/api/challenges')
      .set('Authorization', `Bearer ${p1Token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const ids = res.body.map((p: any) => p.id);
    expect(ids).toContain(programAId);
    expect(ids).toContain(programBId);

    // Search query
    const searchRes = await request(app)
      .get('/api/challenges?q=Cardio')
      .set('Authorization', `Bearer ${p1Token}`);
    expect(searchRes.status).toBe(200);
    const searchIds = searchRes.body.map((p: any) => p.id);
    expect(searchIds).toContain(programAId);
    expect(searchIds).not.toContain(programBId);

    // Category filter
    const catRes = await request(app)
      .get('/api/challenges?category=Mindfulness')
      .set('Authorization', `Bearer ${p1Token}`);
    expect(catRes.status).toBe(200);
    const catIds = catRes.body.map((p: any) => p.id);
    expect(catIds).toContain(programBId);
    expect(catIds).not.toContain(programAId);
  });

  it('joins a challenge and clones habits with snapshot fields (POST /api/challenges/:id/join)', async () => {
    const joinRes = await request(app)
      .post(`/api/challenges/${programAId}/join`)
      .set('Authorization', `Bearer ${p1Token}`);

    expect(joinRes.status).toBe(201);
    expect(joinRes.body).toHaveProperty('enrollmentId');
    expect(joinRes.body.habitsCreatedCount).toBe(1);

    // Verify Habit created in database
    const habit = await prisma.habit.findFirst({
      where: {
        programId: programAId,
        sourceActivityId: programAActivityId,
      },
    });

    expect(habit).not.toBeNull();
    expect(habit!.challengeStatus).toBe('ACTIVE');
    expect(habit!.syncedVersion).toBe(1);
    expect(habit!.category).toBe('Health & Fitness');

    // Attempting to join again while ACTIVE returns 409
    const dupRes = await request(app)
      .post(`/api/challenges/${programAId}/join`)
      .set('Authorization', `Bearer ${p1Token}`);
    expect(dupRes.status).toBe(409);
    expect(dupRes.body.error.code).toBe('ALREADY_ENROLLED');
  });

  it('returns extended details for enrolled and non-enrolled participants (GET /api/challenges/:id)', async () => {
    // For enrolled participant 1
    const p1Detail = await request(app)
      .get(`/api/challenges/${programAId}`)
      .set('Authorization', `Bearer ${p1Token}`);

    expect(p1Detail.status).toBe(200);
    expect(p1Detail.body.id).toBe(programAId);
    expect(p1Detail.body.version).toBe(1);
    expect(p1Detail.body.myEnrollment).not.toBeNull();
    expect(p1Detail.body.myEnrollment.status).toBe('ACTIVE');
    expect(p1Detail.body.myEnrollment.updateAvailable).toBe(false);
    expect(p1Detail.body.myEnrollment.hasUnresolvedEndedHabits).toBe(false);

    // For non-enrolled participant 2
    const p2Detail = await request(app)
      .get(`/api/challenges/${programAId}`)
      .set('Authorization', `Bearer ${p2Token}`);

    expect(p2Detail.status).toBe(200);
    expect(p2Detail.body.myEnrollment).toBeNull();
  });

  it('filters challenges by status: ENROLLED vs AVAILABLE (GET /api/challenges)', async () => {
    const enrolledRes = await request(app)
      .get('/api/challenges?status=ENROLLED')
      .set('Authorization', `Bearer ${p1Token}`);

    expect(enrolledRes.status).toBe(200);
    const enrolledIds = enrolledRes.body.map((p: any) => p.id);
    expect(enrolledIds).toContain(programAId);
    expect(enrolledIds).not.toContain(programBId);

    const availableRes = await request(app)
      .get('/api/challenges?status=AVAILABLE')
      .set('Authorization', `Bearer ${p1Token}`);

    expect(availableRes.status).toBe(200);
    const availableIds = availableRes.body.map((p: any) => p.id);
    expect(availableIds).not.toContain(programAId);
    expect(availableIds).toContain(programBId);
  });
});
