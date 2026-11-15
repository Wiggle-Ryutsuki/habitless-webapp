import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/db/prisma.js';
import { Role } from '@prisma/client';

describe('Reflection Notes API (API-11)', () => {
  let participant1Token: string;
  let participant2Token: string;
  let managerToken: string;
  let p1HabitId: number;
  let p2HabitId: number;

  const p1Email = `notes.p1.${Date.now()}@example.com`;
  const p2Email = `notes.p2.${Date.now()}@example.com`;
  const mgrEmail = `notes.mgr.${Date.now()}@example.com`;
  const password = 'Password123!';

  beforeAll(async () => {
    // 1. Participant 1
    const p1Res = await request(app).post('/api/auth/register').send({
      email: p1Email,
      password,
      fullName: 'Notes Tester One',
      role: Role.PARTICIPANT,
    });
    participant1Token = p1Res.body.token;

    // 2. Participant 2
    const p2Res = await request(app).post('/api/auth/register').send({
      email: p2Email,
      password,
      fullName: 'Notes Tester Two',
      role: Role.PARTICIPANT,
    });
    participant2Token = p2Res.body.token;

    // 3. Manager
    const mgrRes = await request(app).post('/api/auth/register').send({
      email: mgrEmail,
      password,
      fullName: 'Notes Manager',
      role: Role.PROGRAM_MANAGER,
    });
    managerToken = mgrRes.body.token;

    // Create a habit for P1
    const h1Res = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${participant1Token}`)
      .send({
        title: 'Meditation Practice',
        colorHex: '#8bc34a',
        frequency: 'DAILY',
      });
    p1HabitId = h1Res.body.id;

    // Create a habit for P2
    const h2Res = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${participant2Token}`)
      .send({
        title: 'Private Journal',
        colorHex: '#ad1457',
        frequency: 'DAILY',
      });
    p2HabitId = h2Res.body.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: { in: [p1Email, p2Email, mgrEmail] },
      },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/tracking/notes (API-11)', () => {
    it('creates a new timestamped reflection note linked to an owned habit', async () => {
      const res = await request(app)
        .post('/api/tracking/notes')
        .set('Authorization', `Bearer ${participant1Token}`)
        .send({
          noteDate: '2021-03-18',
          content: 'Felt calm and present after 15 minutes of breathing exercises.',
          habitId: p1HabitId,
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.habitId).toBe(p1HabitId);
      expect(res.body.habitTitle).toBe('Meditation Practice');
      expect(res.body.noteDate).toBe('2021-03-18');
      expect(res.body.content).toBe('Felt calm and present after 15 minutes of breathing exercises.');
      expect(res.body.timestamp).toBeDefined();
    });

    it('creates a standalone note without a linked habitId', async () => {
      const res = await request(app)
        .post('/api/tracking/notes')
        .set('Authorization', `Bearer ${participant1Token}`)
        .send({
          noteDate: '2021-03-19',
          content: 'General reflection: good progress this week on personal routines.',
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.habitId).toBeNull();
      expect(res.body.habitTitle).toBeNull();
      expect(res.body.noteDate).toBe('2021-03-19');
    });

    it('rejects linking a habitId belonging to another participant with 404 Not Found', async () => {
      const res = await request(app)
        .post('/api/tracking/notes')
        .set('Authorization', `Bearer ${participant1Token}`)
        .send({
          noteDate: '2021-03-18',
          content: 'Attempting to attach to someone else habit.',
          habitId: p2HabitId,
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('HABIT_NOT_FOUND');
    });

    it('rejects empty or whitespace-only content with 422', async () => {
      const res = await request(app)
        .post('/api/tracking/notes')
        .set('Authorization', `Bearer ${participant1Token}`)
        .send({
          noteDate: '2021-03-18',
          content: '   ',
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('INVALID_NOTE_CONTENT');
    });

    it('rejects content exceeding 1000 characters with 422', async () => {
      const longContent = 'A'.repeat(1001);
      const res = await request(app)
        .post('/api/tracking/notes')
        .set('Authorization', `Bearer ${participant1Token}`)
        .send({
          noteDate: '2021-03-18',
          content: longContent,
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('INVALID_NOTE_CONTENT');
    });

    it('rejects invalid noteDate format with 422', async () => {
      const res = await request(app)
        .post('/api/tracking/notes')
        .set('Authorization', `Bearer ${participant1Token}`)
        .send({
          noteDate: 'invalid-date',
          content: 'Note with bad date.',
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('INVALID_DATE_FORMAT');
    });

    it('rejects unauthenticated requests with 401 and manager with 403', async () => {
      const res1 = await request(app)
        .post('/api/tracking/notes')
        .send({ noteDate: '2021-03-18', content: 'No auth note' });
      expect(res1.status).toBe(401);

      const res2 = await request(app)
        .post('/api/tracking/notes')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ noteDate: '2021-03-18', content: 'Manager note' });
      expect(res2.status).toBe(403);
    });
  });

  describe('GET /api/tracking/notes', () => {
    it('lists notes ordered descending by date, isolated to the authenticated user', async () => {
      const res = await request(app)
        .get('/api/tracking/notes')
        .set('Authorization', `Bearer ${participant1Token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);

      // Verify descending order
      expect(res.body[0].noteDate >= res.body[1].noteDate).toBe(true);

      // Verify participant 2 sees empty or only their own notes
      const p2Res = await request(app)
        .get('/api/tracking/notes')
        .set('Authorization', `Bearer ${participant2Token}`);

      expect(p2Res.status).toBe(200);
      expect(p2Res.body.length).toBe(0);
    });

    it('filters notes by month and year query parameters', async () => {
      const res = await request(app)
        .get('/api/tracking/notes?month=3&year=2021')
        .set('Authorization', `Bearer ${participant1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
      for (const note of res.body) {
        expect(note.noteDate.startsWith('2021-03')).toBe(true);
      }
    });
  });

  describe('PUT /api/tracking/notes/:id (Editable Notes)', () => {
    let noteToEditId: number;

    beforeAll(async () => {
      const createRes = await request(app)
        .post('/api/tracking/notes')
        .set('Authorization', `Bearer ${participant1Token}`)
        .send({
          noteDate: '2021-03-20',
          content: 'Original note text before edit.',
          habitId: p1HabitId,
        });
      noteToEditId = createRes.body.id;
    });

    it('updates note content, date, and habit successfully for owner', async () => {
      const res = await request(app)
        .put(`/api/tracking/notes/${noteToEditId}`)
        .set('Authorization', `Bearer ${participant1Token}`)
        .send({
          content: 'Updated reflection text with more depth.',
          noteDate: '2021-03-21',
        });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(noteToEditId);
      expect(res.body.content).toBe('Updated reflection text with more depth.');
      expect(res.body.noteDate).toBe('2021-03-21');
      expect(res.body.habitTitle).toBe('Meditation Practice');
    });

    it('can remove linked habit by sending habitId: null', async () => {
      const res = await request(app)
        .put(`/api/tracking/notes/${noteToEditId}`)
        .set('Authorization', `Bearer ${participant1Token}`)
        .send({
          habitId: null,
        });

      expect(res.status).toBe(200);
      expect(res.body.habitId).toBeNull();
      expect(res.body.habitTitle).toBeNull();
    });

    it('rejects editing empty content with 422', async () => {
      const res = await request(app)
        .put(`/api/tracking/notes/${noteToEditId}`)
        .set('Authorization', `Bearer ${participant1Token}`)
        .send({
          content: '   ',
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('INVALID_NOTE_CONTENT');
    });

    it('rejects editing another participant note with 404 Not Found', async () => {
      const res = await request(app)
        .put(`/api/tracking/notes/${noteToEditId}`)
        .set('Authorization', `Bearer ${participant2Token}`)
        .send({
          content: 'Hacked note content',
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOTE_NOT_FOUND');
    });
  });

  describe('DELETE /api/tracking/notes/:id (Removable Notes)', () => {
    let noteToDeleteId: number;

    beforeAll(async () => {
      const createRes = await request(app)
        .post('/api/tracking/notes')
        .set('Authorization', `Bearer ${participant1Token}`)
        .send({
          noteDate: '2021-03-22',
          content: 'Note scheduled for deletion.',
        });
      noteToDeleteId = createRes.body.id;
    });

    it('rejects deleting another participant note with 404 Not Found', async () => {
      const res = await request(app)
        .delete(`/api/tracking/notes/${noteToDeleteId}`)
        .set('Authorization', `Bearer ${participant2Token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOTE_NOT_FOUND');
    });

    it('deletes owner note successfully with 204 No Content', async () => {
      const res = await request(app)
        .delete(`/api/tracking/notes/${noteToDeleteId}`)
        .set('Authorization', `Bearer ${participant1Token}`);

      expect(res.status).toBe(204);

      // Verify removed from database
      const dbNote = await prisma.dailyNote.findUnique({
        where: { id: noteToDeleteId },
      });
      expect(dbNote).toBeNull();
    });

    it('returns 404 when deleting an already deleted note', async () => {
      const res = await request(app)
        .delete(`/api/tracking/notes/${noteToDeleteId}`)
        .set('Authorization', `Bearer ${participant1Token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOTE_NOT_FOUND');
    });

    it('rejects unauthenticated requests with 401 and manager with 403', async () => {
      const res1 = await request(app).delete(`/api/tracking/notes/9999`);
      expect(res1.status).toBe(401);

      const res2 = await request(app)
        .delete(`/api/tracking/notes/9999`)
        .set('Authorization', `Bearer ${managerToken}`);
      expect(res2.status).toBe(403);
    });
  });
});

