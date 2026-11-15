import { describe, it, expect, vi, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/db/prisma.js';

describe('Health and Readiness API (API-01)', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('GET /api/health returns 200 with service status and timestamp', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('HabitLess API');
    expect(res.body.timestamp).toBeDefined();
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
  });

  it('GET /api/ready returns 200 when database connection is healthy', async () => {
    const res = await request(app).get('/api/ready');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ready');
    expect(res.body.db).toBe('connected');
  });

  it('GET /api/ready returns 503 with sanitized error envelope when database fails', async () => {
    const queryRawSpy = vi.spyOn(prisma, '$queryRaw').mockRejectedValueOnce(new Error('Connection terminated unexpectedly'));

    const res = await request(app).get('/api/ready');

    expect(res.status).toBe(503);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('SERVICE_UNAVAILABLE');
    expect(res.body.error.message).toBe('Database connection is not ready.');
    expect(res.body.error.correlationId).toBeDefined();
    // Verify no raw DB driver leak
    expect(JSON.stringify(res.body)).not.toContain('Connection terminated');

    queryRawSpy.mockRestore();
  });
});

