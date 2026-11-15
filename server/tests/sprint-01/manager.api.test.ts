import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/db/prisma.js';
import { Role } from '@prisma/client';

describe('Program Manager API Suite (API-12, API-13, API-14)', () => {
  let manager1Token: string;
  let manager2Token: string;
  let participantToken: string;
  let manager1Id: number;
  let createdProgramId: number;

  const mgr1Email = `mgr1.${Date.now()}@habitless.test`;
  const mgr2Email = `mgr2.${Date.now()}@habitless.test`;
  const partEmail = `part.${Date.now()}@habitless.test`;
  const password = 'Password123!';

  beforeAll(async () => {
    // 1. Register Manager 1
    const m1Res = await request(app).post('/api/auth/register').send({
      email: mgr1Email,
      password,
      fullName: 'Dr. Evelyn Reed (Manager One)',
      role: Role.PROGRAM_MANAGER,
    });
    manager1Token = m1Res.body.token;
    manager1Id = m1Res.body.user.id;

    // 2. Register Manager 2
    const m2Res = await request(app).post('/api/auth/register').send({
      email: mgr2Email,
      password,
      fullName: 'Marcus Vance (Manager Two)',
      role: Role.PROGRAM_MANAGER,
    });
    manager2Token = m2Res.body.token;

    // 3. Register Participant
    const pRes = await request(app).post('/api/auth/register').send({
      email: partEmail,
      password,
      fullName: 'Participant Tester',
      role: Role.PARTICIPANT,
    });
    participantToken = pRes.body.token;
  });

  afterAll(async () => {
    // Clean up created challenge programs, enrollments, habits, and users
    await prisma.challengeProgram.deleteMany({
      where: {
        managerId: {
          in: [manager1Id],
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          in: [mgr1Email, mgr2Email, partEmail],
        },
      },
    });

    await prisma.$disconnect();
  });

  describe('POST /api/manager/programs (API-12)', () => {
    it('API-12: creates a challenge program with activities in DRAFT status', async () => {
      const res = await request(app)
        .post('/api/manager/programs')
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({
          title: '30-Day Wellness Challenge',
          category: 'Wellness',
          description: 'Establish healthy hydration, meditation, and exercise routines.',
          startDate: '2026-12-01T00:00:00.000Z',
          endDate: '2026-12-30T00:00:00.000Z',
          activities: [
            {
              title: 'Daily Hydration (2L)',
              description: 'Drink 2 liters daily',
              frequency: 'DAILY',
              targetCount: 1,
            },
            {
              title: 'Morning Meditation (10 min)',
              description: '10 min mindful breathing',
              frequency: 'DAILY',
              targetCount: 1,
            },
            {
              title: '30 min Cardio (3x/week)',
              description: 'Cardio workout',
              frequency: 'THREE_TIMES_WEEKLY',
              targetCount: 3,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('30-Day Wellness Challenge');
      expect(res.body.category).toBe('Wellness');
      expect(res.body.status).toBe('DRAFT');
      expect(res.body.inviteUrl).toBeNull();
      expect(res.body.activities).toHaveLength(3);
      expect(res.body.activities[0].title).toBe('Daily Hydration (2L)');

      createdProgramId = res.body.id;

      // Verify database persistence
      const dbProg = await prisma.challengeProgram.findUnique({
        where: { id: createdProgramId },
        include: { activities: true },
      });
      expect(dbProg).not.toBeNull();
      expect(dbProg?.status).toBe('DRAFT');
      expect(dbProg?.activities).toHaveLength(3);
      expect(dbProg?.activities[0].daysOfWeek).toEqual([1, 2, 3, 4, 5, 6, 7]);
      expect(dbProg?.activities[2].daysOfWeek).toEqual([1, 3, 5]);
    });

    it('API-12: persists custom daysOfWeek array for curriculum activities', async () => {
      const res = await request(app)
        .post('/api/manager/programs')
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({
          title: 'MWF Strength Routine',
          category: 'Fitness',
          startDate: '2026-12-01T00:00:00.000Z',
          endDate: '2026-12-30T00:00:00.000Z',
          activities: [
            {
              title: 'Bench & Squat',
              daysOfWeek: [1, 3, 5],
              targetCount: 3,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.activities[0].daysOfWeek).toEqual([1, 3, 5]);
      expect(res.body.activities[0].frequency).toBe('THREE_TIMES_WEEKLY');
    });

    it('API-12 Boundary Pass: accepts title of exactly 3 characters', async () => {
      const res = await request(app)
        .post('/api/manager/programs')
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({
          title: 'Run',
          category: 'Fitness',
          startDate: '2026-12-01',
          endDate: '2026-12-10',
          activities: [{ title: 'Daily Jog', frequency: 'DAILY' }],
        });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Run');
    });

    it('API-12 Boundary Pass: accepts title of exactly 100 characters', async () => {
      const title100 = 'A'.repeat(100);
      const res = await request(app)
        .post('/api/manager/programs')
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({
          title: title100,
          category: 'Fitness',
          startDate: '2026-12-01',
          endDate: '2026-12-10',
          activities: [{ title: 'Daily Jog', frequency: 'DAILY' }],
        });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe(title100);
    });

    it('API-12 Boundary Pass: accepts single-day challenge (startDate === endDate)', async () => {
      const res = await request(app)
        .post('/api/manager/programs')
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({
          title: '1-Day Detox Challenge',
          category: 'Wellness',
          startDate: '2026-12-05',
          endDate: '2026-12-05',
          activities: [{ title: 'Water fast', frequency: 'DAILY' }],
        });

      expect(res.status).toBe(201);
    });

    it('API-12 Validation Fail: rejects title < 3 characters with 422', async () => {
      const res = await request(app)
        .post('/api/manager/programs')
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({
          title: 'AB',
          category: 'Wellness',
          startDate: '2026-12-01',
          endDate: '2026-12-10',
          activities: [{ title: 'Walk', frequency: 'DAILY' }],
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.fieldErrors.some((fe: any) => fe.field === 'title')).toBe(true);
    });

    it('API-12 Validation Fail: rejects title > 100 characters with 422', async () => {
      const res = await request(app)
        .post('/api/manager/programs')
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({
          title: 'X'.repeat(101),
          category: 'Wellness',
          startDate: '2026-12-01',
          endDate: '2026-12-10',
          activities: [{ title: 'Walk', frequency: 'DAILY' }],
        });

      expect(res.status).toBe(422);
      expect(res.body.error.fieldErrors.some((fe: any) => fe.field === 'title')).toBe(true);
    });

    it('API-12 Validation Fail: rejects inverted date range (endDate < startDate) with 422 (BR-05)', async () => {
      const res = await request(app)
        .post('/api/manager/programs')
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({
          title: 'Invalid Dates Challenge',
          category: 'Fitness',
          startDate: '2026-12-20',
          endDate: '2026-12-10',
          activities: [{ title: 'Jogging', frequency: 'DAILY' }],
        });

      expect(res.status).toBe(422);
      expect(res.body.error.fieldErrors.some((fe: any) => fe.field === 'endDate')).toBe(true);
    });

    it('API-12 Validation Fail: rejects empty activities array with 422', async () => {
      const res = await request(app)
        .post('/api/manager/programs')
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({
          title: 'No Activities Challenge',
          category: 'Fitness',
          startDate: '2026-12-01',
          endDate: '2026-12-10',
          activities: [],
        });

      expect(res.status).toBe(422);
      expect(res.body.error.fieldErrors.some((fe: any) => fe.field === 'activities')).toBe(true);
    });

    it('API-12 Validation Fail: rejects description > 500 characters with 422 (BR-04)', async () => {
      const res = await request(app)
        .post('/api/manager/programs')
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({
          title: 'Long Description Challenge',
          category: 'Fitness',
          description: 'D'.repeat(501),
          startDate: '2026-12-01',
          endDate: '2026-12-10',
          activities: [{ title: 'Jogging', frequency: 'DAILY' }],
        });

      expect(res.status).toBe(422);
      expect(res.body.error.fieldErrors.some((fe: any) => fe.field === 'description')).toBe(true);
    });
  });

  describe('GET /api/manager/programs', () => {
    it('lists all programs owned by the authenticated manager', async () => {
      const res = await request(app)
        .get('/api/manager/programs')
        .set('Authorization', `Bearer ${manager1Token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body.some((p: any) => p.id === createdProgramId)).toBe(true);
    });
  });

  describe('GET /api/manager/programs/:id', () => {
    it('retrieves single program by ID with activities', async () => {
      const res = await request(app)
        .get(`/api/manager/programs/${createdProgramId}`)
        .set('Authorization', `Bearer ${manager1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(createdProgramId);
      expect(res.body.activities).toHaveLength(3);
    });

    it('returns 403 Forbidden when requesting a program owned by another manager', async () => {
      const res = await request(app)
        .get(`/api/manager/programs/${createdProgramId}`)
        .set('Authorization', `Bearer ${manager2Token}`);

      expect(res.status).toBe(403);
    });

    it('returns 404 Not Found for non-existent program ID', async () => {
      const res = await request(app)
        .get('/api/manager/programs/999999')
        .set('Authorization', `Bearer ${manager1Token}`);

      expect(res.status).toBe(404);
    });

    it('returns 400 Bad Request for non-integer ID', async () => {
      const res = await request(app)
        .get('/api/manager/programs/invalid-id')
        .set('Authorization', `Bearer ${manager1Token}`);

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/manager/programs/:id (Draft Modification)', () => {
    it('updates a draft program and its curriculum activities', async () => {
      const res = await request(app)
        .put(`/api/manager/programs/${createdProgramId}`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({
          title: '30-Day Holistic Wellness Challenge',
          category: 'Wellness',
          description: 'Updated guidelines for hydration and sleep',
          startDate: '2026-12-01',
          endDate: '2026-12-30',
          activities: [
            {
              title: 'Daily Hydration (2.5L)',
              description: 'Extra water',
              frequency: 'DAILY',
              targetCount: 1,
            },
            {
              title: 'Restful Sleep (8h)',
              description: '8 hours sleep',
              frequency: 'DAILY',
              targetCount: 1,
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('30-Day Holistic Wellness Challenge');
      expect(res.body.activities).toHaveLength(2);
      expect(res.body.activities[0].title).toBe('Daily Hydration (2.5L)');
    });

    it('rejects cross-manager update with 403 Forbidden', async () => {
      const res = await request(app)
        .put(`/api/manager/programs/${createdProgramId}`)
        .set('Authorization', `Bearer ${manager2Token}`)
        .send({
          title: 'Hijacked Challenge',
          category: 'Wellness',
          startDate: '2026-12-01',
          endDate: '2026-12-30',
          activities: [{ title: 'Act', frequency: 'DAILY' }],
        });

      expect(res.status).toBe(403);
    });
  });

  describe('Role Barrier Checks (API-13)', () => {
    it('API-13: rejects participant POST /api/manager/programs with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/manager/programs')
        .set('Authorization', `Bearer ${participantToken}`)
        .send({
          title: 'Participant Challenge Attempt',
          category: 'Wellness',
          startDate: '2026-12-01',
          endDate: '2026-12-30',
          activities: [{ title: 'Activity', frequency: 'DAILY' }],
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('API-13: rejects participant GET /api/manager/programs with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/manager/programs')
        .set('Authorization', `Bearer ${participantToken}`);

      expect(res.status).toBe(403);
    });

    it('API-13: rejects participant PUT /api/manager/programs/:id/deploy with 403 Forbidden', async () => {
      const res = await request(app)
        .put(`/api/manager/programs/${createdProgramId}/deploy`)
        .set('Authorization', `Bearer ${participantToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/manager/programs/:id/deploy (API-14)', () => {
    it('API-14: deploys draft challenge, transitions status to PUBLISHED, and returns inviteUrl', async () => {
      const res = await request(app)
        .put(`/api/manager/programs/${createdProgramId}/deploy`)
        .set('Authorization', `Bearer ${manager1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(createdProgramId);
      expect(res.body.status).toBe('PUBLISHED');
      expect(res.body.inviteUrl).toBe(`/challenges/${createdProgramId}`);
      expect(res.body).toHaveProperty('deployedAt');

      // Verify DB persistence
      const dbProg = await prisma.challengeProgram.findUnique({
        where: { id: createdProgramId },
      });
      expect(dbProg?.status).toBe('PUBLISHED');
    });

    it('API-14: deploying an already PUBLISHED program is idempotent (returns 200 OK)', async () => {
      const res = await request(app)
        .put(`/api/manager/programs/${createdProgramId}/deploy`)
        .set('Authorization', `Bearer ${manager1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('PUBLISHED');
      expect(res.body.inviteUrl).toBe(`/challenges/${createdProgramId}`);
    });

    it('rejects cross-manager deploy with 403 Forbidden', async () => {
      const res = await request(app)
        .put(`/api/manager/programs/${createdProgramId}/deploy`)
        .set('Authorization', `Bearer ${manager2Token}`);

      expect(res.status).toBe(403);
    });

    it('returns 404 Not Found when deploying non-existent program', async () => {
      const res = await request(app)
        .put('/api/manager/programs/999999/deploy')
        .set('Authorization', `Bearer ${manager1Token}`);

      expect(res.status).toBe(404);
    });

    it('returns 422 Unprocessable Entity when modifying a published program', async () => {
      const res = await request(app)
        .put(`/api/manager/programs/${createdProgramId}`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({
          title: 'Attempt Modify Published Program',
          category: 'Wellness',
          startDate: '2026-12-01',
          endDate: '2026-12-30',
          activities: [{ title: 'New Act', frequency: 'DAILY' }],
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('PROGRAM_NOT_EDITABLE');
    });
  });

  describe('PUT /api/manager/programs/:id/archive', () => {
    it('archives a program, transitioning status to ARCHIVED', async () => {
      const res = await request(app)
        .put(`/api/manager/programs/${createdProgramId}/archive`)
        .set('Authorization', `Bearer ${manager1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(createdProgramId);
      expect(res.body.status).toBe('ARCHIVED');
      expect(res.body).toHaveProperty('archivedAt');

      // Verify DB persistence
      const dbProg = await prisma.challengeProgram.findUnique({
        where: { id: createdProgramId },
      });
      expect(dbProg?.status).toBe('ARCHIVED');
    });

    it('rejects cross-manager archive with 403 Forbidden', async () => {
      const res = await request(app)
        .put(`/api/manager/programs/${createdProgramId}/archive`)
        .set('Authorization', `Bearer ${manager2Token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/manager/programs/:id (Delete Draft Program)', () => {
    let draftToDeleteId: number;

    beforeEach(async () => {
      // Create a fresh draft program
      const draft = await prisma.challengeProgram.create({
        data: {
          managerId: manager1Id,
          title: 'Draft To Delete',
          category: 'Wellness',
          startDate: new Date('2026-12-01'),
          endDate: new Date('2026-12-31'),
          status: 'DRAFT',
          activities: {
            create: [
              {
                title: 'Activity 1',
                frequency: 'DAILY',
                daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
                targetCount: 1,
              },
            ],
          },
        },
      });
      draftToDeleteId = draft.id;
    });

    it('deletes a draft challenge program successfully', async () => {
      const res = await request(app)
        .delete(`/api/manager/programs/${draftToDeleteId}`)
        .set('Authorization', `Bearer ${manager1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deleted successfully');
      expect(res.body.id).toBe(draftToDeleteId);

      const dbCheck = await prisma.challengeProgram.findUnique({
        where: { id: draftToDeleteId },
      });
      expect(dbCheck).toBeNull();
    });

    it('rejects deletion with 403 Forbidden if not the program owner', async () => {
      const res = await request(app)
        .delete(`/api/manager/programs/${draftToDeleteId}`)
        .set('Authorization', `Bearer ${manager2Token}`);

      expect(res.status).toBe(403);
    });

    it('rejects deletion with 422 if program is already published or archived', async () => {
      // Transition program to published
      await prisma.challengeProgram.update({
        where: { id: draftToDeleteId },
        data: { status: 'PUBLISHED' },
      });

      const res = await request(app)
        .delete(`/api/manager/programs/${draftToDeleteId}`)
        .set('Authorization', `Bearer ${manager1Token}`);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('CANNOT_DELETE_PUBLISHED');
    });

    it('returns 404 for non-existent program ID', async () => {
      const res = await request(app)
        .delete('/api/manager/programs/999999')
        .set('Authorization', `Bearer ${manager1Token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/manager/programs/:id/unpublish (Unpublish Published Program)', () => {
    let publishedProgramId: number;

    beforeEach(async () => {
      const prog = await prisma.challengeProgram.create({
        data: {
          managerId: manager1Id,
          title: 'Challenge To Unpublish',
          category: 'Wellness',
          startDate: new Date('2026-12-01'),
          endDate: new Date('2026-12-31'),
          status: 'PUBLISHED',
          previouslyPublished: false,
          activities: {
            create: [
              {
                title: 'Activity 1',
                frequency: 'DAILY',
                daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
                targetCount: 1,
              },
            ],
          },
        },
      });
      publishedProgramId = prog.id;
    });

    it('unpublishes a published challenge program with 0 enrollments, reverting to DRAFT and marking previouslyPublished', async () => {
      const res = await request(app)
        .put(`/api/manager/programs/${publishedProgramId}/unpublish`)
        .set('Authorization', `Bearer ${manager1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(publishedProgramId);
      expect(res.body.status).toBe('DRAFT');
      expect(res.body.previouslyPublished).toBe(true);
      expect(res.body.enrollmentsCount).toBe(0);
      expect(res.body.inviteUrl).toBeNull();
      expect(res.body.message).toContain('unpublished successfully');

      // Verify DB persistence
      const dbProg = await prisma.challengeProgram.findUnique({
        where: { id: publishedProgramId },
      });
      expect(dbProg?.status).toBe('DRAFT');
      expect(dbProg?.previouslyPublished).toBe(true);
    });

    it('unpublishes a challenge program with active enrollments and deactivates participant enrollments', async () => {
      // Find the participant user created in beforeAll
      const participant = await prisma.user.findUnique({
        where: { email: partEmail },
      });
      expect(participant).toBeDefined();

      // Create an enrollment
      const enrollment = await prisma.programEnrollment.create({
        data: {
          programId: publishedProgramId,
          participantId: participant!.id,
          isActive: true,
        },
      });
      expect(enrollment.isActive).toBe(true);

      const res = await request(app)
        .put(`/api/manager/programs/${publishedProgramId}/unpublish`)
        .set('Authorization', `Bearer ${manager1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('DRAFT');
      expect(res.body.previouslyPublished).toBe(true);
      expect(res.body.enrollmentsCount).toBe(1);

      // Verify that enrollment status became inactive in DB
      const updatedEnrollment = await prisma.programEnrollment.findUnique({
        where: { id: enrollment.id },
      });
      expect(updatedEnrollment?.isActive).toBe(false);
    });

    it('rejects unpublishing with 422 if program is not PUBLISHED (e.g. already DRAFT)', async () => {
      // Revert to draft first
      await prisma.challengeProgram.update({
        where: { id: publishedProgramId },
        data: { status: 'DRAFT' },
      });

      const res = await request(app)
        .put(`/api/manager/programs/${publishedProgramId}/unpublish`)
        .set('Authorization', `Bearer ${manager1Token}`);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('PROGRAM_NOT_PUBLISHED');
    });

    it('rejects cross-manager unpublish with 403 Forbidden', async () => {
      const res = await request(app)
        .put(`/api/manager/programs/${publishedProgramId}/unpublish`)
        .set('Authorization', `Bearer ${manager2Token}`);

      expect(res.status).toBe(403);
    });

    it('returns 404 for non-existent program ID', async () => {
      const res = await request(app)
        .put('/api/manager/programs/999999/unpublish')
        .set('Authorization', `Bearer ${manager1Token}`);

      expect(res.status).toBe(404);
    });
  });
});
