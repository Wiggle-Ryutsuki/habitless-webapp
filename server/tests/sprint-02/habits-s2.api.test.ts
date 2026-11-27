import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/db/prisma.js';
import { Role } from '@prisma/client';

describe('Feature 5 Habit Category & Palette API (API-S2-01)', () => {
  let participant1Token: string;
  let participant2Token: string;
  let managerToken: string;

  const p1Email = `habits.s2.p1.${Date.now()}@example.com`;
  const p2Email = `habits.s2.p2.${Date.now()}@example.com`;
  const mgrEmail = `habits.s2.mgr.${Date.now()}@example.com`;
  const password = 'Password123!';

  let presetHabitId: number;
  let uncategorizedHabitId: number;

  beforeAll(async () => {
    const p1Res = await request(app).post('/api/auth/register').send({
      email: p1Email,
      password,
      fullName: 'Sprint2 P1',
      role: Role.PARTICIPANT,
    });
    participant1Token = p1Res.body.token;

    const p2Res = await request(app).post('/api/auth/register').send({
      email: p2Email,
      password,
      fullName: 'Sprint2 P2',
      role: Role.PARTICIPANT,
    });
    participant2Token = p2Res.body.token;

    const mgrRes = await request(app).post('/api/auth/register').send({
      email: mgrEmail,
      password,
      fullName: 'Sprint2 Manager',
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

  it('creates a habit with Sprint 1 palette hex and preset category', async () => {
    const res = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${participant1Token}`)
      .send({
        title: 'Morning Run',
        description: '5km around the park',
        category: 'Health & Fitness',
        colorHex: '#448aff',
        frequency: 'DAILY',
        daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
        targetCount: 20,
      });

    expect(res.status).toBe(201);
    expect(res.body.colorHex).toBe('#448aff');
    expect(res.body.category).toBe('Health & Fitness');
    expect(res.body.programId).toBeNull();
    presetHabitId = res.body.id;
  });

  it('creates a habit with trimmed custom category and normalizes blank/omitted category to null', async () => {
    const customRes = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${participant1Token}`)
      .send({
        title: 'Breathwork',
        category: '  Morning Routine  ',
        colorHex: '#009688',
        frequency: 'DAILY',
      });

    expect(customRes.status).toBe(201);
    expect(customRes.body.category).toBe('Morning Routine');

    const emptyRes = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${participant1Token}`)
      .send({
        title: 'Water Intake',
        category: '   ',
        colorHex: '#ff9800',
        frequency: 'DAILY',
      });

    expect(emptyRes.status).toBe(201);
    expect(emptyRes.body.category).toBeNull();
    uncategorizedHabitId = emptyRes.body.id;
  });

  it('rejects category > 50 characters or non-string category with 422 INVALID_HABIT_CATEGORY', async () => {
    const tooLong = 'A'.repeat(51);
    const longRes = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${participant1Token}`)
      .send({
        title: 'Long Category Test',
        category: tooLong,
        colorHex: '#448aff',
        frequency: 'DAILY',
      });

    expect(longRes.status).toBe(422);
    expect(longRes.body.error.code).toBe('INVALID_HABIT_CATEGORY');

    const nonStringRes = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${participant1Token}`)
      .send({
        title: 'Numeric Category Test',
        category: 12345,
        colorHex: '#448aff',
        frequency: 'DAILY',
      });

    expect(nonStringRes.status).toBe(422);
    expect(nonStringRes.body.error.code).toBe('INVALID_HABIT_CATEGORY');
  });

  it('preserves Sprint 1 palette allowlist (rejects #9c27b0 with 422 INVALID_HABIT_COLOR)', async () => {
    const res = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${participant1Token}`)
      .send({
        title: 'Non-Palette Color Habit',
        category: 'Mindfulness',
        colorHex: '#9c27b0',
        frequency: 'DAILY',
      });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('INVALID_HABIT_COLOR');
  });

  it('updates category (including clearing to null) and includes category + programId on tracking endpoints', async () => {
    const putRes = await request(app)
      .put(`/api/habits/${presetHabitId}`)
      .set('Authorization', `Bearer ${participant1Token}`)
      .send({
        category: 'Learning',
        colorHex: '#1565c0',
      });

    expect(putRes.status).toBe(200);
    expect(putRes.body.category).toBe('Learning');
    expect(putRes.body.colorHex).toBe('#1565c0');

    const badPut = await request(app)
      .put(`/api/habits/${presetHabitId}`)
      .set('Authorization', `Bearer ${participant1Token}`)
      .send({
        category: 'B'.repeat(51),
      });
    expect(badPut.status).toBe(422);
    expect(badPut.body.error.code).toBe('INVALID_HABIT_CATEGORY');

    const todayStr = new Date().toISOString().split('T')[0];
    const [yearStr, monthStr] = todayStr.split('-');

    const listRes = await request(app)
      .get('/api/habits')
      .set('Authorization', `Bearer ${participant1Token}`);
    expect(listRes.status).toBe(200);
    const updatedItem = listRes.body.find((h: any) => h.id === presetHabitId);
    expect(updatedItem.category).toBe('Learning');

    const calRes = await request(app)
      .get(`/api/tracking/calendar?month=${Number(monthStr)}&year=${Number(yearStr)}`)
      .set('Authorization', `Bearer ${participant1Token}`);
    expect(calRes.status).toBe(200);
    const calHabit = calRes.body.habits.find((h: any) => h.habitId === presetHabitId);
    expect(calHabit.category).toBe('Learning');
    expect(calHabit.programId).toBeNull();
    expect(calRes.body.habits.find((h: any) => h.habitId === uncategorizedHabitId).category).toBeNull();

    const todayRes = await request(app)
      .get(`/api/tracking/today?date=${todayStr}`)
      .set('Authorization', `Bearer ${participant1Token}`);
    expect(todayRes.status).toBe(200);
    const todayItem = todayRes.body.items.find((i: any) => i.habitId === presetHabitId);
    expect(todayItem.category).toBe('Learning');
    expect(todayItem.programId).toBeNull();

    const clearRes = await request(app)
      .put(`/api/habits/${presetHabitId}`)
      .set('Authorization', `Bearer ${participant1Token}`)
      .send({ category: null });
    expect(clearRes.status).toBe(200);
    expect(clearRes.body.category).toBeNull();
  });

  it('enforces role/ownership guards and soft-archives via DELETE while preserving logs and notes', async () => {
    const todayStr = new Date().toISOString().split('T')[0];

    await request(app)
      .post('/api/tracking/log')
      .set('Authorization', `Bearer ${participant1Token}`)
      .send({ habitId: presetHabitId, date: todayStr, completed: true });

    await request(app)
      .post('/api/tracking/notes')
      .set('Authorization', `Bearer ${participant1Token}`)
      .send({ habitId: presetHabitId, noteDate: todayStr, content: 'Preserved note' });

    const crossPut = await request(app)
      .put(`/api/habits/${presetHabitId}`)
      .set('Authorization', `Bearer ${participant2Token}`)
      .send({ category: 'Finance' });
    expect(crossPut.status).toBe(404);
    expect(crossPut.body.error.code).toBe('HABIT_NOT_FOUND');

    const crossDelete = await request(app)
      .delete(`/api/habits/${presetHabitId}`)
      .set('Authorization', `Bearer ${participant2Token}`);
    expect(crossDelete.status).toBe(404);
    expect(crossDelete.body.error.code).toBe('HABIT_NOT_FOUND');

    const mgrPost = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ title: 'Mgr Habit', colorHex: '#448aff', frequency: 'DAILY' });
    expect(mgrPost.status).toBe(403);
    expect(mgrPost.body.error.code).toBe('PARTICIPANT_ROLE_REQUIRED');

    const delRes = await request(app)
      .delete(`/api/habits/${presetHabitId}`)
      .set('Authorization', `Bearer ${participant1Token}`);
    expect(delRes.status).toBe(204);

    const dbHabit = await prisma.habit.findUnique({ where: { id: presetHabitId } });
    expect(dbHabit?.isActive).toBe(false);

    const logs = await prisma.habitLog.findMany({ where: { habitId: presetHabitId } });
    expect(logs.length).toBe(1);

    const notes = await prisma.dailyNote.findMany({ where: { habitId: presetHabitId } });
    expect(notes.length).toBe(1);
  });
});
