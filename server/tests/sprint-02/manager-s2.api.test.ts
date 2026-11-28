import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/db/prisma.js';

describe('Feature 9: Manager Analytics, Directory & Details API (API-S2-08 / API-S2-10..12)', () => {
  const manager1Email = 'mgr1_feat9@habitless.internal';
  const manager2Email = 'mgr2_feat9@habitless.internal';
  const participantEmail = 'part_feat9@habitless.internal';

  let manager1Token: string;
  let manager2Token: string;
  let participantToken: string;
  let participantId: number;

  let prog1Id: number; // Manager 1, PUBLISHED, Preset category ("Health & Fitness")
  let prog2Id: number; // Manager 2, PUBLISHED, Custom category ("Speed Reading")
  let progDraftId: number; // Manager 2, DRAFT

  beforeAll(async () => {
    // 1. Create Manager 1
    const m1Res = await request(app)
      .post('/api/auth/register')
      .send({
        email: manager1Email,
        password: 'Password123!',
        fullName: 'Manager One',
        role: 'PROGRAM_MANAGER',
      });
    manager1Token = m1Res.body.token;

    // 2. Create Manager 2
    const m2Res = await request(app)
      .post('/api/auth/register')
      .send({
        email: manager2Email,
        password: 'Password123!',
        fullName: 'Manager Two',
        role: 'PROGRAM_MANAGER',
      });
    manager2Token = m2Res.body.token;

    // 3. Create Participant
    const pRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: participantEmail,
        password: 'Password123!',
        fullName: 'Participant Pat',
        role: 'PARTICIPANT',
      });
    participantToken = pRes.body.token;
    participantId = pRes.body.user.id;

    // 4. Create Program 1 (Manager 1, Preset Category)
    const p1Res = await request(app)
      .post('/api/manager/programs')
      .set('Authorization', `Bearer ${manager1Token}`)
      .send({
        title: 'Manager 1 Cardio Program',
        category: 'Health & Fitness',
        description: 'Preset category cardio sprint',
        durationDays: 30,
        activities: [
          {
            title: 'Daily Run 5K',
            frequency: 'DAILY',
            targetCount: 20,
          },
        ],
      });
    prog1Id = p1Res.body.id;

    // Deploy Program 1
    await request(app)
      .put(`/api/manager/programs/${prog1Id}/deploy`)
      .set('Authorization', `Bearer ${manager1Token}`);

    // 5. Create Program 2 (Manager 2, Custom Category)
    const p2Res = await request(app)
      .post('/api/manager/programs')
      .set('Authorization', `Bearer ${manager2Token}`)
      .send({
        title: 'Manager 2 Speed Reading Challenge',
        category: 'Speed Reading', // Non-preset custom category
        description: 'Read 50 pages daily',
        durationDays: 14,
        activities: [
          {
            title: 'Read 50 pages',
            frequency: 'DAILY',
            targetCount: 14,
          },
        ],
      });
    prog2Id = p2Res.body.id;

    // Deploy Program 2
    await request(app)
      .put(`/api/manager/programs/${prog2Id}/deploy`)
      .set('Authorization', `Bearer ${manager2Token}`);

    // 6. Create Draft Program (Manager 2)
    const draftRes = await request(app)
      .post('/api/manager/programs')
      .set('Authorization', `Bearer ${manager2Token}`)
      .send({
        title: 'Manager 2 Secret Draft',
        category: 'Productivity',
        description: 'Draft not yet published',
        durationDays: 7,
        activities: [
          {
            title: 'Secret Deep Work',
            frequency: 'WEEKDAYS',
            targetCount: 5,
          },
        ],
      });
    progDraftId = draftRes.body.id;

    // 7. Participant joins Program 1 (ACTIVE enrollment)
    await request(app)
      .post(`/api/challenges/${prog1Id}/join`)
      .set('Authorization', `Bearer ${participantToken}`);

    // 8. Participant rates Program 1
    await request(app)
      .put(`/api/challenges/${prog1Id}/rating`)
      .set('Authorization', `Bearer ${participantToken}`)
      .send({ rating: 5 });

    // 9. Participant comments on Program 1
    await request(app)
      .post(`/api/challenges/${prog1Id}/comments`)
      .set('Authorization', `Bearer ${participantToken}`)
      .send({ content: 'Outstanding program!' });
  });

  afterAll(async () => {
    await prisma.challengeProgram.deleteMany({
      where: {
        manager: {
          email: { in: [manager1Email, manager2Email] },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: { in: [manager1Email, manager2Email, participantEmail] },
      },
    });
  });

  describe('GET /api/manager/analytics (API-S2-10)', () => {
    it('enforces 401 for unauthenticated requests and 403 for PARTICIPANT', async () => {
      const unauth = await request(app).get('/api/manager/analytics');
      expect(unauth.status).toBe(401);

      const partRes = await request(app)
        .get('/api/manager/analytics')
        .set('Authorization', `Bearer ${participantToken}`);
      expect(partRes.status).toBe(403);
    });

    it('returns platform-wide summary, popular challenges, and topCategories with custom Other rollup', async () => {
      const res = await request(app)
        .get('/api/manager/analytics')
        .set('Authorization', `Bearer ${manager1Token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('summary');
      expect(res.body.summary.totalPublishedChallenges).toBeGreaterThanOrEqual(2);
      expect(res.body.summary.totalActiveEnrollments).toBeGreaterThanOrEqual(1);

      // Most Popular Challenges
      expect(Array.isArray(res.body.mostPopularChallenges)).toBe(true);
      const prog1Popular = res.body.mostPopularChallenges.find((p: any) => p.id === prog1Id);
      expect(prog1Popular).toBeDefined();
      expect(prog1Popular.title).toBe('Manager 1 Cardio Program');
      expect(prog1Popular.category).toBe('Health & Fitness');
      expect(prog1Popular.managerName).toBe('Manager One');
      expect(prog1Popular.enrollmentCount).toBeGreaterThanOrEqual(1);
      expect(prog1Popular.averageRating).toBe(5);

      // Top Categories
      expect(Array.isArray(res.body.topCategories)).toBe(true);
      const presetCat = res.body.topCategories.find((c: any) => c.category === 'Health & Fitness');
      expect(presetCat).toBeDefined();
      expect(presetCat.isPreset).toBe(true);
      expect(presetCat.challengesCount).toBeGreaterThanOrEqual(1);

      // Other category rollup for "Speed Reading"
      const otherCat = res.body.topCategories.find((c: any) => c.category === 'Other');
      expect(otherCat).toBeDefined();
      expect(otherCat.isPreset).toBe(false);
      expect(otherCat.challengesCount).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(otherCat.customCategories)).toBe(true);
      const speedReading = otherCat.customCategories.find((c: any) => c.category === 'Speed Reading');
      expect(speedReading).toBeDefined();
      expect(speedReading.challengesCount).toBe(1);
    });
  });

  describe('GET /api/manager/directory (API-S2-11)', () => {
    it('enforces 403 for PARTICIPANT', async () => {
      const res = await request(app)
        .get('/api/manager/directory')
        .set('Authorization', `Bearer ${participantToken}`);
      expect(res.status).toBe(403);
    });

    it('returns all PUBLISHED challenges across managers, flagging isOwnedByMe correctly', async () => {
      // Requested by Manager 1
      const res = await request(app)
        .get('/api/manager/directory')
        .set('Authorization', `Bearer ${manager1Token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      const p1 = res.body.find((p: any) => p.id === prog1Id);
      const p2 = res.body.find((p: any) => p.id === prog2Id);
      const draft = res.body.find((p: any) => p.id === progDraftId);

      // Both published programs visible
      expect(p1).toBeDefined();
      expect(p1.isOwnedByMe).toBe(true); // Owned by Manager 1
      expect(p1.manager.fullName).toBe('Manager One');
      expect(p1.averageRating).toBe(5);

      expect(p2).toBeDefined();
      expect(p2.isOwnedByMe).toBe(false); // Owned by Manager 2
      expect(p2.manager.fullName).toBe('Manager Two');

      // Draft program is omitted from global directory
      expect(draft).toBeUndefined();
    });

    it('filters global directory by search query and category', async () => {
      const searchRes = await request(app)
        .get('/api/manager/directory?q=Speed+Reading')
        .set('Authorization', `Bearer ${manager1Token}`);
      expect(searchRes.status).toBe(200);
      expect(searchRes.body.some((p: any) => p.id === prog2Id)).toBe(true);
      expect(searchRes.body.some((p: any) => p.id === prog1Id)).toBe(false);

      const catRes = await request(app)
        .get('/api/manager/directory?category=Health+%26+Fitness')
        .set('Authorization', `Bearer ${manager1Token}`);
      expect(catRes.status).toBe(200);
      expect(catRes.body.some((p: any) => p.id === prog1Id)).toBe(true);
      expect(catRes.body.some((p: any) => p.id === prog2Id)).toBe(false);
    });
  });

  describe('GET /api/manager/directory/:id (API-S2-12)', () => {
    it('returns full challenge details with isOwnedByMe and comments thread', async () => {
      // Manager 2 inspects Manager 1's program
      const res = await request(app)
        .get(`/api/manager/directory/${prog1Id}`)
        .set('Authorization', `Bearer ${manager2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(prog1Id);
      expect(res.body.title).toBe('Manager 1 Cardio Program');
      expect(res.body.isOwnedByMe).toBe(false);
      expect(res.body.manager.fullName).toBe('Manager One');
      expect(res.body.activities).toHaveLength(1);
      expect(res.body.averageRating).toBe(5);

      // Comments thread
      expect(Array.isArray(res.body.comments)).toBe(true);
      expect(res.body.comments.length).toBeGreaterThanOrEqual(1);
      expect(res.body.comments[0].content).toBe('Outstanding program!');
    });

    it('allows manager to view their own DRAFT challenge on directory detail, but rejects other managers with 404', async () => {
      // Manager 2 views their own draft
      const ownerRes = await request(app)
        .get(`/api/manager/directory/${progDraftId}`)
        .set('Authorization', `Bearer ${manager2Token}`);
      expect(ownerRes.status).toBe(200);
      expect(ownerRes.body.id).toBe(progDraftId);
      expect(ownerRes.body.isOwnedByMe).toBe(true);

      // Manager 1 views Manager 2's draft -> 404
      const otherRes = await request(app)
        .get(`/api/manager/directory/${progDraftId}`)
        .set('Authorization', `Bearer ${manager1Token}`);
      expect(otherRes.status).toBe(404);
      expect(otherRes.body.error.code).toBe('CHALLENGE_NOT_FOUND');
    });

    it('Manager 2 can post a 1-level reply to participant comment on Manager 1 program', async () => {
      // Fetch comment id from program 1
      const detRes = await request(app)
        .get(`/api/manager/directory/${prog1Id}`)
        .set('Authorization', `Bearer ${manager2Token}`);
      const parentCommentId = detRes.body.comments[0].id;

      // Manager 2 replies
      const replyRes = await request(app)
        .post(`/api/challenges/${prog1Id}/comments`)
        .set('Authorization', `Bearer ${manager2Token}`)
        .send({
          content: 'Thank you for participating!',
          parentCommentId,
        });

      expect(replyRes.status).toBe(201);
      expect(replyRes.body.parentCommentId).toBe(parentCommentId);
      expect(replyRes.body.author.fullName).toBe('Manager Two');
      expect(replyRes.body.author.role).toBe('PROGRAM_MANAGER');

      // Verify reply appears nested in directory detail
      const updatedDet = await request(app)
        .get(`/api/manager/directory/${prog1Id}`)
        .set('Authorization', `Bearer ${manager1Token}`);
      const parent = updatedDet.body.comments.find((c: any) => c.id === parentCommentId);
      expect(parent.replies).toHaveLength(1);
      expect(parent.replies[0].content).toBe('Thank you for participating!');
    });
  });

  describe('Cross-Manager Isolation Invariant (BR-S2-10)', () => {
    it('prevents Manager 1 from modifying, deploying, unpublishing, or deleting Manager 2 program', async () => {
      // Modify
      const editRes = await request(app)
        .put(`/api/manager/programs/${prog2Id}`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({
          title: 'Hacked Title',
          category: 'Health & Fitness',
          durationDays: 30,
          activities: [{ title: 'Hacked', frequency: 'DAILY', targetCount: 1 }],
        });
      expect(editRes.status).toBe(403);
      expect(editRes.body.error.code).toBe('FORBIDDEN');

      // Deploy
      const deployRes = await request(app)
        .put(`/api/manager/programs/${prog2Id}/deploy`)
        .set('Authorization', `Bearer ${manager1Token}`);
      expect(deployRes.status).toBe(403);

      // Unpublish
      const unpubRes = await request(app)
        .put(`/api/manager/programs/${prog2Id}/unpublish`)
        .set('Authorization', `Bearer ${manager1Token}`);
      expect(unpubRes.status).toBe(403);

      // Delete
      const delRes = await request(app)
        .delete(`/api/manager/programs/${prog2Id}`)
        .set('Authorization', `Bearer ${manager1Token}`);
      expect(delRes.status).toBe(403);
    });
  });
});
