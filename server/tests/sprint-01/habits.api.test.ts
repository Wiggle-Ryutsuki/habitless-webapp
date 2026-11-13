import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/db/prisma.js';
import { Role } from '@prisma/client';

describe('Habit Management API (API-05, API-06, API-07, API-08)', () => {
  let participant1Token: string;
  let participant2Token: string;
  let managerToken: string;
  let createdHabitId: number;

  const p1Email = `habits.p1.${Date.now()}@example.com`;
  const p2Email = `habits.p2.${Date.now()}@example.com`;
  const mgrEmail = `habits.mgr.${Date.now()}@example.com`;
  const password = 'Password123!';

  beforeAll(async () => {
    // 1. Create Participant 1
    const p1Res = await request(app).post('/api/auth/register').send({
      email: p1Email,
      password,
      fullName: 'Habit Tester One',
      role: Role.PARTICIPANT,
    });
    participant1Token = p1Res.body.token;

    // 2. Create Participant 2
    const p2Res = await request(app).post('/api/auth/register').send({
      email: p2Email,
      password,
      fullName: 'Habit Tester Two',
      role: Role.PARTICIPANT,
    });
    participant2Token = p2Res.body.token;

    // 3. Create Program Manager
    const mgrRes = await request(app).post('/api/auth/register').send({
      email: mgrEmail,
      password,
      fullName: 'Habit Manager Tester',
      role: Role.PROGRAM_MANAGER,
    });
    managerToken = mgrRes.body.token;
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

  describe('POST /api/habits (API-05 & API-06)', () => {
    it('API-05: creates a new habit with valid title, fixed palette color, frequency, and target count', async () => {
      const res = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${participant1Token}`)
        .send({
          title: 'Daily Journaling',
          description: 'Evening reflection in notebook',
          colorHex: '#ff9800', // Amber Glow
          frequency: 'DAILY',
          daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
          targetCount: 20,
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe('Daily Journaling');
      expect(res.body.description).toBe('Evening reflection in notebook');
      expect(res.body.colorHex).toBe('#ff9800');
      expect(res.body.frequency).toBe('DAILY');
      expect(res.body.targetCount).toBe(20);
      expect(res.body.isActive).toBe(true);

      createdHabitId = res.body.id;
    });

    it('API-06: rejects habit creation with arbitrary hex color outside the 8 approved palette colors with 422', async () => {
      const res = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${participant1Token}`)
        .send({
          title: 'Invalid Color Habit',
          colorHex: '#9C27B0', // Purple (not in palette)
          frequency: 'DAILY',
        });

      expect(res.status).toBe(422);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('INVALID_HABIT_COLOR');
    });

    it('rejects title shorter than 2 characters with 422', async () => {
      const res = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${participant1Token}`)
        .send({
          title: 'A',
          colorHex: '#448aff',
          frequency: 'DAILY',
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('INVALID_HABIT_TITLE');
    });

    it('rejects whitespace-only title with 422', async () => {
      const res = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${participant1Token}`)
        .send({
          title: '     ',
          colorHex: '#448aff',
          frequency: 'DAILY',
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('INVALID_HABIT_TITLE');
    });

    it('rejects description longer than 500 characters with 422', async () => {
      const longDescription = 'A'.repeat(501);
      const res = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${participant1Token}`)
        .send({
          title: 'Valid Habit Title',
          description: longDescription,
          colorHex: '#448aff',
          frequency: 'DAILY',
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('INVALID_HABIT_DESCRIPTION');
    });

    it('rejects endDate strictly less than startDate with 422 INVALID_DATE_RANGE', async () => {
      const res = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${participant1Token}`)
        .send({
          title: 'Inverted Dates Habit',
          colorHex: '#448aff',
          frequency: 'DAILY',
          startDate: '2026-11-20',
          endDate: '2026-11-10',
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('INVALID_DATE_RANGE');
    });

    it('rejects targetCount outside range 1..31 with 422', async () => {
      const resZero = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${participant1Token}`)
        .send({
          title: 'Zero Target Habit',
          colorHex: '#448aff',
          frequency: 'DAILY',
          targetCount: 0,
        });

      expect(resZero.status).toBe(422);
      expect(resZero.body.error.code).toBe('INVALID_TARGET_COUNT');

      const resTooBig = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${participant1Token}`)
        .send({
          title: '32 Target Habit',
          colorHex: '#448aff',
          frequency: 'DAILY',
          targetCount: 32,
        });

      expect(resTooBig.status).toBe(422);
      expect(resTooBig.body.error.code).toBe('INVALID_TARGET_COUNT');
    });

    it('rejects CUSTOM_DAYS frequency when daysOfWeek is empty with 422', async () => {
      const res = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${participant1Token}`)
        .send({
          title: 'Custom Days Empty',
          colorHex: '#448aff',
          frequency: 'CUSTOM_DAYS',
          daysOfWeek: [],
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('INVALID_DAYS_OF_WEEK');
    });
  });

  describe('GET /api/habits (API-07 Data Isolation)', () => {
    it('returns only habits belonging to the authenticated participant', async () => {
      // Participant 1 creates habit
      const p1Habits = await request(app)
        .get('/api/habits')
        .set('Authorization', `Bearer ${participant1Token}`);

      expect(p1Habits.status).toBe(200);
      expect(Array.isArray(p1Habits.body)).toBe(true);
      expect(p1Habits.body.some((h: { id: number }) => h.id === createdHabitId)).toBe(true);

      // Participant 2 calls GET /api/habits -> must NOT see Participant 1's habit
      const p2Habits = await request(app)
        .get('/api/habits')
        .set('Authorization', `Bearer ${participant2Token}`);

      expect(p2Habits.status).toBe(200);
      expect(p2Habits.body.some((h: { id: number }) => h.id === createdHabitId)).toBe(false);
    });

    it('filters by status=active or status=archived', async () => {
      const activeRes = await request(app)
        .get('/api/habits?status=active')
        .set('Authorization', `Bearer ${participant1Token}`);
      expect(activeRes.status).toBe(200);
      expect(activeRes.body.every((h: { isActive: boolean }) => h.isActive === true)).toBe(true);
    });
  });

  describe('GET /api/habits/:id (Resource Isolation & Enumeration Defense)', () => {
    it('returns habit details for the owner', async () => {
      const res = await request(app)
        .get(`/api/habits/${createdHabitId}`)
        .set('Authorization', `Bearer ${participant1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(createdHabitId);
      expect(res.body.title).toBe('Daily Journaling');
    });

    it('returns 404 Not Found when another participant attempts to fetch the habit', async () => {
      const res = await request(app)
        .get(`/api/habits/${createdHabitId}`)
        .set('Authorization', `Bearer ${participant2Token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('HABIT_NOT_FOUND');
    });

    it('returns 404 Not Found for non-existent habit ID', async () => {
      const res = await request(app)
        .get('/api/habits/999999')
        .set('Authorization', `Bearer ${participant1Token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('HABIT_NOT_FOUND');
    });
  });

  describe('PUT /api/habits/:id (API-08)', () => {
    it('updates habit details successfully for owner and returns HTTP 200', async () => {
      const res = await request(app)
        .put(`/api/habits/${createdHabitId}`)
        .set('Authorization', `Bearer ${participant1Token}`)
        .send({
          title: 'Nightly Reflection Journal',
          targetCount: 25,
          colorHex: '#009688', // Verdigris
        });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Nightly Reflection Journal');
      expect(res.body.targetCount).toBe(25);
      expect(res.body.colorHex).toBe('#009688');
    });

    it('rejects update with invalid palette color with 422', async () => {
      const res = await request(app)
        .put(`/api/habits/${createdHabitId}`)
        .set('Authorization', `Bearer ${participant1Token}`)
        .send({
          colorHex: '#123456',
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('INVALID_HABIT_COLOR');
    });

    it('rejects update on other participant habit with 404 Not Found', async () => {
      const res = await request(app)
        .put(`/api/habits/${createdHabitId}`)
        .set('Authorization', `Bearer ${participant2Token}`)
        .send({
          title: 'Hacked Title',
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('HABIT_NOT_FOUND');
    });
  });

  describe('DELETE /api/habits/:id (Soft Archive)', () => {
    it('rejects delete on another participant habit with 404 Not Found', async () => {
      const res = await request(app)
        .delete(`/api/habits/${createdHabitId}`)
        .set('Authorization', `Bearer ${participant2Token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('HABIT_NOT_FOUND');
    });

    it('soft-archives the habit for owner with 204 No Content', async () => {
      const res = await request(app)
        .delete(`/api/habits/${createdHabitId}`)
        .set('Authorization', `Bearer ${participant1Token}`);

      expect(res.status).toBe(204);

      // Verify in DB that isActive is false
      const archived = await prisma.habit.findUnique({
        where: { id: createdHabitId },
      });
      expect(archived?.isActive).toBe(false);
    });
  });

  describe('Role-Based Access Control (BR-01 Barrier)', () => {
    it('rejects PROGRAM_MANAGER from calling POST /api/habits with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          title: 'Manager Habit',
          colorHex: '#448aff',
          frequency: 'DAILY',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('PARTICIPANT_ROLE_REQUIRED');
    });

    it('rejects PROGRAM_MANAGER from calling GET /api/habits with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/habits')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('PARTICIPANT_ROLE_REQUIRED');
    });

    it('rejects unauthenticated requests with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/habits');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});

