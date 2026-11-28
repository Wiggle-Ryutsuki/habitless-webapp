import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/db/prisma.js';
import { Role } from '@prisma/client';

describe('Feature 8 Challenge Ratings & Threaded Comments API (API-S2-07)', () => {
  let p1Token: string;
  let p2Token: string;
  let nonEnrolledToken: string;
  let managerToken: string;

  const p1Email = `social.p1.${Date.now()}@example.com`;
  const p2Email = `social.p2.${Date.now()}@example.com`;
  const nonEnrolledEmail = `social.noenr.${Date.now()}@example.com`;
  const mgrEmail = `social.mgr.${Date.now()}@example.com`;
  const password = 'Password123!';

  let programId: number;

  beforeAll(async () => {
    const p1Res = await request(app).post('/api/auth/register').send({
      email: p1Email,
      password,
      fullName: 'Social Participant 1',
      role: Role.PARTICIPANT,
    });
    p1Token = p1Res.body.token;

    const p2Res = await request(app).post('/api/auth/register').send({
      email: p2Email,
      password,
      fullName: 'Social Participant 2',
      role: Role.PARTICIPANT,
    });
    p2Token = p2Res.body.token;

    const noEnrRes = await request(app).post('/api/auth/register').send({
      email: nonEnrolledEmail,
      password,
      fullName: 'Non Enrolled Participant',
      role: Role.PARTICIPANT,
    });
    nonEnrolledToken = noEnrRes.body.token;

    const mgrRes = await request(app).post('/api/auth/register').send({
      email: mgrEmail,
      password,
      fullName: 'Social Manager',
      role: Role.PROGRAM_MANAGER,
    });
    managerToken = mgrRes.body.token;

    // Create & Deploy Challenge
    const progRes = await request(app)
      .post('/api/manager/programs')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        title: 'Community Wellness Challenge',
        description: 'Interactive wellness program with ratings and feedback.',
        category: 'Health & Fitness',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        activities: [
          {
            title: 'Daily Water Goal',
            description: 'Drink 2 liters of water.',
            frequency: 'DAILY',
            daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
            targetCount: 20,
          },
        ],
      });
    programId = progRes.body.id;

    await request(app)
      .put(`/api/manager/programs/${programId}/deploy`)
      .set('Authorization', `Bearer ${managerToken}`);

    // Enroll p1 and p2
    await request(app)
      .post(`/api/challenges/${programId}/join`)
      .set('Authorization', `Bearer ${p1Token}`);

    await request(app)
      .post(`/api/challenges/${programId}/join`)
      .set('Authorization', `Bearer ${p2Token}`);
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
          in: [p1Email, p2Email, nonEnrolledEmail, mgrEmail],
        },
      },
    });
    await prisma.$disconnect();
  });

  describe('PUT /api/challenges/:id/rating (API-S2-08)', () => {
    it('rejects un-enrolled participant with 403 ENROLLMENT_REQUIRED', async () => {
      const res = await request(app)
        .put(`/api/challenges/${programId}/rating`)
        .set('Authorization', `Bearer ${nonEnrolledToken}`)
        .send({ rating: 5 });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('ENROLLMENT_REQUIRED');
    });

    it('rejects invalid rating values with 422 INVALID_RATING', async () => {
      const resUnder = await request(app)
        .put(`/api/challenges/${programId}/rating`)
        .set('Authorization', `Bearer ${p1Token}`)
        .send({ rating: 0 });
      expect(resUnder.status).toBe(422);

      const resOver = await request(app)
        .put(`/api/challenges/${programId}/rating`)
        .set('Authorization', `Bearer ${p1Token}`)
        .send({ rating: 6 });
      expect(resOver.status).toBe(422);

      const resDecimal = await request(app)
        .put(`/api/challenges/${programId}/rating`)
        .set('Authorization', `Bearer ${p1Token}`)
        .send({ rating: 4.5 });
      expect(resDecimal.status).toBe(422);
    });

    it('submits rating 5 and upserts rating 4 for participant 1', async () => {
      const res1 = await request(app)
        .put(`/api/challenges/${programId}/rating`)
        .set('Authorization', `Bearer ${p1Token}`)
        .send({ rating: 5 });

      expect(res1.status).toBe(200);
      expect(res1.body.rating).toBe(5);
      expect(res1.body.averageRating).toBe(5);
      expect(res1.body.ratingsCount).toBe(1);

      // Resubmission updates existing rating
      const res2 = await request(app)
        .put(`/api/challenges/${programId}/rating`)
        .set('Authorization', `Bearer ${p1Token}`)
        .send({ rating: 4 });

      expect(res2.status).toBe(200);
      expect(res2.body.rating).toBe(4);
      expect(res2.body.averageRating).toBe(4);
      expect(res2.body.ratingsCount).toBe(1);
    });

    it('participant 2 rates 5, updating average rating to 4.5', async () => {
      const res = await request(app)
        .put(`/api/challenges/${programId}/rating`)
        .set('Authorization', `Bearer ${p2Token}`)
        .send({ rating: 5 });

      expect(res.status).toBe(200);
      expect(res.body.averageRating).toBe(4.5);
      expect(res.body.ratingsCount).toBe(2);
    });
  });

  describe('POST /api/challenges/:id/comments (API-S2-09)', () => {
    let topLevelCommentId: number;
    let managerReplyId: number;

    it('rejects top-level comment from un-enrolled participant with 403', async () => {
      const res = await request(app)
        .post(`/api/challenges/${programId}/comments`)
        .set('Authorization', `Bearer ${nonEnrolledToken}`)
        .send({ content: 'I am not enrolled!' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('ENROLLMENT_REQUIRED');
    });

    it('rejects top-level comment from manager with 403', async () => {
      const res = await request(app)
        .post(`/api/challenges/${programId}/comments`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ content: 'Managers cannot make top level comments' });

      expect(res.status).toBe(403);
    });

    it('enrolled participant posts top-level comment', async () => {
      const res = await request(app)
        .post(`/api/challenges/${programId}/comments`)
        .set('Authorization', `Bearer ${p1Token}`)
        .send({ content: 'This challenge is super motivating!' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.content).toBe('This challenge is super motivating!');
      expect(res.body.parentCommentId).toBeNull();
      expect(res.body.author.fullName).toBe('Social Participant 1');

      topLevelCommentId = res.body.id;
    });

    it('rejects reply from participant with 403', async () => {
      const res = await request(app)
        .post(`/api/challenges/${programId}/comments`)
        .set('Authorization', `Bearer ${p2Token}`)
        .send({
          content: 'Replying to fellow participant',
          parentCommentId: topLevelCommentId,
        });

      expect(res.status).toBe(403);
    });

    it('program manager posts 1-level reply to top-level comment', async () => {
      const res = await request(app)
        .post(`/api/challenges/${programId}/comments`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          content: 'Glad to hear that, keep up the great effort!',
          parentCommentId: topLevelCommentId,
        });

      expect(res.status).toBe(201);
      expect(res.body.parentCommentId).toBe(topLevelCommentId);
      expect(res.body.author.fullName).toBe('Social Manager');
      expect(res.body.author.role).toBe('PROGRAM_MANAGER');

      managerReplyId = res.body.id;
    });

    it('rejects 2-level nested reply with 422 NESTED_REPLY_NOT_ALLOWED', async () => {
      const res = await request(app)
        .post(`/api/challenges/${programId}/comments`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          content: 'Nested reply to reply',
          parentCommentId: managerReplyId,
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('NESTED_REPLY_NOT_ALLOWED');
    });

    it('GET /api/challenges/:id includes nested comment thread', async () => {
      const res = await request(app)
        .get(`/api/challenges/${programId}`)
        .set('Authorization', `Bearer ${p1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.comments.length).toBeGreaterThanOrEqual(1);
      const topComment = res.body.comments.find((c: any) => c.id === topLevelCommentId);
      expect(topComment).toBeDefined();
      expect(topComment.replies.length).toBe(1);
      expect(topComment.replies[0].id).toBe(managerReplyId);
    });
  });
});
