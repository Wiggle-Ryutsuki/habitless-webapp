import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/db/prisma.js';
import { Role } from '@prisma/client';

describe('Web Challenge Invitation & Participant Joining API (API-15)', () => {
  let managerToken: string;
  let participantToken: string;
  let managerUser: any;
  let participantUser: any;

  let publishedChallengeId: number;
  let draftChallengeId: number;
  let archivedChallengeId: number;

  const mgrEmail = `chal.mgr.${Date.now()}@habitless.test`;
  const partEmail = `chal.part.${Date.now()}@habitless.test`;
  const password = 'Password123!';

  beforeAll(async () => {
    // 1. Register Manager
    const mRes = await request(app).post('/api/auth/register').send({
      email: mgrEmail,
      password,
      fullName: 'Dr. Challenge Director',
      role: Role.PROGRAM_MANAGER,
    });
    managerToken = mRes.body.token;
    managerUser = mRes.body.user;

    // 2. Register Participant
    const pRes = await request(app).post('/api/auth/register').send({
      email: partEmail,
      password,
      fullName: 'Participant Jordan',
      role: Role.PARTICIPANT,
    });
    participantToken = pRes.body.token;
    participantUser = pRes.body.user;

    // 3. Create Published Challenge with 3 activities
    const pubRes = await request(app)
      .post('/api/manager/programs')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        title: '30-Day Active Wellness Challenge',
        category: 'Wellness',
        description: 'Comprehensive fitness, hydration, and mindful routine.',
        startDate: '2026-12-01T00:00:00.000Z',
        endDate: '2026-12-30T00:00:00.000Z',
        activities: [
          {
            title: 'Daily Water (2L)',
            description: 'Hydration goal',
            frequency: 'DAILY',
            targetCount: 1,
          },
          {
            title: 'Fast Walking (3x/week)',
            description: 'Cardio exercise',
            frequency: 'THREE_TIMES_WEEKLY',
            targetCount: 3,
          },
          {
            title: 'Weekday Journal',
            description: 'Focus journal',
            frequency: 'WEEKDAYS',
            targetCount: 1,
          },
        ],
      });
    publishedChallengeId = pubRes.body.id;

    // Deploy it to PUBLISHED
    await request(app)
      .put(`/api/manager/programs/${publishedChallengeId}/deploy`)
      .set('Authorization', `Bearer ${managerToken}`);

    // 4. Create Draft Challenge
    const draftRes = await request(app)
      .post('/api/manager/programs')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        title: 'Unpublished Draft Primer',
        category: 'Mindfulness',
        startDate: '2026-12-01',
        endDate: '2026-12-15',
        activities: [{ title: 'Secret activity', frequency: 'DAILY' }],
      });
    draftChallengeId = draftRes.body.id;

    // 5. Create Archived Challenge
    const archRes = await request(app)
      .post('/api/manager/programs')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        title: 'Retired Summer Challenge',
        category: 'Fitness',
        startDate: '2026-06-01',
        endDate: '2026-06-30',
        activities: [{ title: 'Summer run', frequency: 'DAILY' }],
      });
    archivedChallengeId = archRes.body.id;
    await request(app)
      .put(`/api/manager/programs/${archivedChallengeId}/archive`)
      .set('Authorization', `Bearer ${managerToken}`);
  });

  afterAll(async () => {
    // Clean up created programs and users
    await prisma.habit.deleteMany({
      where: { userId: participantUser.id },
    });

    await prisma.challengeProgram.deleteMany({
      where: { managerId: managerUser.id },
    });

    await prisma.user.deleteMany({
      where: {
        email: { in: [mgrEmail, partEmail] },
      },
    });

    await prisma.$disconnect();
  });

  describe('GET /api/challenges/:id (Public Web Invitation View)', () => {
    it('returns 200 OK with challenge metadata, organizer name, and activities for PUBLISHED challenge', async () => {
      const res = await request(app).get(`/api/challenges/${publishedChallengeId}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(publishedChallengeId);
      expect(res.body.title).toBe('30-Day Active Wellness Challenge');
      expect(res.body.status).toBe('PUBLISHED');
      expect(res.body.manager.fullName).toBe('Dr. Challenge Director');
      expect(res.body.activities).toHaveLength(3);
      expect(res.body.activities[0].title).toBe('Daily Water (2L)');
      // Zero sensitive data leaks
      expect(res.body.manager.passwordHash).toBeUndefined();
      expect(res.body.manager.email).toBeUndefined();
    });

    it('returns 404 Not Found for challenge in DRAFT status', async () => {
      const res = await request(app).get(`/api/challenges/${draftChallengeId}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('CHALLENGE_NOT_FOUND');
    });

    it('returns 404 Not Found for challenge in ARCHIVED status', async () => {
      const res = await request(app).get(`/api/challenges/${archivedChallengeId}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('CHALLENGE_NOT_FOUND');
    });

    it('returns 404 Not Found for non-existent challenge ID', async () => {
      const res = await request(app).get('/api/challenges/999999');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('CHALLENGE_NOT_FOUND');
    });

    it('returns 400 Bad Request for malformed non-integer ID', async () => {
      const res = await request(app).get('/api/challenges/invalid-id');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
    });
  });

  describe('POST /api/challenges/:id/join (API-15)', () => {
    it('API-15: participant enrolls in challenge and materializes personal Habit records on calendar', async () => {
      const res = await request(app)
        .post(`/api/challenges/${publishedChallengeId}/join`)
        .set('Authorization', `Bearer ${participantToken}`);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('enrollmentId');
      expect(res.body.programId).toBe(publishedChallengeId);
      expect(res.body.participantId).toBe(participantUser.id);
      expect(res.body.habitsCreatedCount).toBe(3);
      expect(res.body.message).toContain('Enrolled in challenge successfully');

      // Verify DB ProgramEnrollment
      const enrollment = await prisma.programEnrollment.findUnique({
        where: {
          programId_participantId: {
            programId: publishedChallengeId,
            participantId: participantUser.id,
          },
        },
      });
      expect(enrollment).not.toBeNull();
      expect(enrollment?.isActive).toBe(true);

      // Verify DB materialized Habit records for participant
      const userHabits = await prisma.habit.findMany({
        where: {
          userId: participantUser.id,
          programId: publishedChallengeId,
        },
        orderBy: { id: 'asc' },
      });
      expect(userHabits).toHaveLength(3);
      expect(userHabits[0].title).toBe('Daily Water (2L)');
      expect(userHabits[0].frequency).toBe('DAILY');
      expect(userHabits[0].daysOfWeek).toEqual([1, 2, 3, 4, 5, 6, 7]);
      expect(userHabits[0].colorHex).toBe('#448aff');

      expect(userHabits[1].title).toBe('Fast Walking (3x/week)');
      expect(userHabits[1].frequency).toBe('THREE_TIMES_WEEKLY');
      expect(userHabits[1].daysOfWeek).toEqual([1, 3, 5]);

      expect(userHabits[2].title).toBe('Weekday Journal');
      expect(userHabits[2].frequency).toBe('WEEKDAYS');
      expect(userHabits[2].daysOfWeek).toEqual([1, 2, 3, 4, 5]);
    });

    it('API-15 Duplicate Guard: rejects re-enrollment with 409 Conflict (ALREADY_ENROLLED)', async () => {
      const res = await request(app)
        .post(`/api/challenges/${publishedChallengeId}/join`)
        .set('Authorization', `Bearer ${participantToken}`);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('ALREADY_ENROLLED');
      expect(res.body.error.message).toContain('already enrolled');
    });

    it('rejects unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app).post(`/api/challenges/${publishedChallengeId}/join`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects program manager join attempt with 403 Forbidden', async () => {
      const res = await request(app)
        .post(`/api/challenges/${publishedChallengeId}/join`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('returns 404 Not Found when attempting to join a DRAFT challenge', async () => {
      const res = await request(app)
        .post(`/api/challenges/${draftChallengeId}/join`)
        .set('Authorization', `Bearer ${participantToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('CHALLENGE_NOT_FOUND');
    });

    it('returns 404 Not Found when attempting to join an ARCHIVED challenge', async () => {
      const res = await request(app)
        .post(`/api/challenges/${archivedChallengeId}/join`)
        .set('Authorization', `Bearer ${participantToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('CHALLENGE_NOT_FOUND');
    });
  });
});
