import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/db/prisma.js';
import { Role } from '@prisma/client';

describe('User Authentication & RBAC API (API-02, API-03, API-04)', () => {
  const testParticipantEmail = `test.participant.${Date.now()}@example.com`;
  const testManagerEmail = `test.manager.${Date.now()}@example.com`;
  const testPassword = 'SecurePassword123!';

  beforeAll(async () => {
    // Clean up any lingering test users if needed
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test.',
        },
      },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register (API-02)', () => {
    it('registers a new PARTICIPANT, hashes password, sets HttpOnly cookie, and omits passwordHash', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: testParticipantEmail.toUpperCase(), // Test case normalization
          password: testPassword,
          fullName: 'Test Participant',
          role: 'PARTICIPANT',
        });

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(testParticipantEmail.toLowerCase());
      expect(res.body.user.fullName).toBe('Test Participant');
      expect(res.body.user.role).toBe('PARTICIPANT');
      expect(res.body.user.isActive).toBe(true);
      expect(res.body.token).toBeDefined();

      // SECURITY ASSERTION: password and passwordHash must NEVER be in response
      expect(res.body.user.passwordHash).toBeUndefined();
      expect(res.body.user.password).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toContain('passwordHash');

      // Verify cookie
      const cookies = (res.headers['set-cookie'] || []) as unknown as string[];
      expect(cookies).toBeDefined();
      const tokenCookie = cookies.find((c: string) => c.startsWith('token='));
      expect(tokenCookie).toBeDefined();
      expect(tokenCookie).toContain('HttpOnly');
      expect(tokenCookie).toContain('SameSite=Lax');

      // Verify in DB that password is encrypted
      const userInDb = await prisma.user.findUnique({
        where: { email: testParticipantEmail.toLowerCase() },
      });
      expect(userInDb).toBeDefined();
      expect(userInDb!.passwordHash).not.toBe(testPassword);
      expect(userInDb!.passwordHash.startsWith('$2')).toBe(true);
    });

    it('registers a new PROGRAM_MANAGER successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: testManagerEmail,
          password: testPassword,
          fullName: 'Test Manager',
          role: 'PROGRAM_MANAGER',
        });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('PROGRAM_MANAGER');
    });

    it('rejects registration when password is less than 8 characters with 422', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'shortpass@example.com',
          password: 'short',
          fullName: 'Short Pass',
          role: 'PARTICIPANT',
        });

      expect(res.status).toBe(422);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.fieldErrors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'password' }),
        ])
      );
    });

    it('rejects registration with invalid email format with 422', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email-format',
          password: testPassword,
          fullName: 'Bad Email',
          role: 'PARTICIPANT',
        });

      expect(res.status).toBe(422);
      expect(res.body.error.fieldErrors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'email' }),
        ])
      );
    });

    it('rejects registration with invalid role enum with 422', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'badrole@example.com',
          password: testPassword,
          fullName: 'Bad Role',
          role: 'ADMIN',
        });

      expect(res.status).toBe(422);
      expect(res.body.error.fieldErrors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'role' }),
        ])
      );
    });

    it('rejects registration with short or whitespace-only fullName with 422', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'noname@example.com',
          password: testPassword,
          fullName: '   ',
          role: 'PARTICIPANT',
        });

      expect(res.status).toBe(422);
      expect(res.body.error.fieldErrors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'fullName' }),
        ])
      );
    });
  });

  describe('POST /api/auth/register duplicate email (API-03)', () => {
    it('returns 409 Conflict when attempting to register existing email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: testParticipantEmail,
          password: testPassword,
          fullName: 'Duplicate Alex',
          role: 'PARTICIPANT',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
      expect(res.body.error.message).toBe('An account with this email already exists.');
    });

    it('returns 409 Conflict even when email casing differs', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: testParticipantEmail.toUpperCase(),
          password: testPassword,
          fullName: 'Duplicate Alex Upper',
          role: 'PARTICIPANT',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });
  });

  describe('POST /api/auth/login and session management (API-04)', () => {
    it('logs in successfully with valid credentials and sets HttpOnly cookie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testParticipantEmail,
          password: testPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(testParticipantEmail.toLowerCase());
      expect(res.body.user.passwordHash).toBeUndefined();
      expect(res.body.token).toBeDefined();

      const cookies = (res.headers['set-cookie'] || []) as unknown as string[];
      expect(cookies).toBeDefined();
      const tokenCookie = cookies.find((c: string) => c.startsWith('token='));
      expect(tokenCookie).toBeDefined();
      expect(tokenCookie).toContain('HttpOnly');
    });

    it('rejects login with invalid password with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testParticipantEmail,
          password: 'WrongPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
      expect(res.body.error.message).toBe('Invalid email or password.');
    });

    it('rejects login for non-existent email with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testPassword,
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects login for inactive user account with 401 Unauthorized', async () => {
      // Create deactivated user
      const inactiveEmail = `inactive.${Date.now()}@example.com`;
      await prisma.user.create({
        data: {
          email: inactiveEmail,
          passwordHash: 'hash',
          fullName: 'Inactive User',
          role: Role.PARTICIPANT,
          isActive: false,
        },
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: inactiveEmail,
          password: testPassword,
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('POST /api/auth/logout clears the session cookie', async () => {
      // First log in to get session
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: testParticipantEmail,
          password: testPassword,
        });
      const cookie = loginRes.headers['set-cookie'];

      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', cookie);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.message).toBe('Logged out successfully');

      const logoutCookies = (logoutRes.headers['set-cookie'] || []) as unknown as string[];
      expect(logoutCookies).toBeDefined();
      const tokenCookie = logoutCookies.find((c: string) => c.startsWith('token=;'));
      expect(tokenCookie).toBeDefined();
    });

    it('GET /api/auth/me returns current user profile when authenticated with cookie', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: testParticipantEmail,
          password: testPassword,
        });
      const cookie = loginRes.headers['set-cookie'];

      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Cookie', cookie);

      expect(meRes.status).toBe(200);
      expect(meRes.body.email).toBe(testParticipantEmail.toLowerCase());
      expect(meRes.body.fullName).toBe('Test Participant');
      expect(meRes.body.role).toBe('PARTICIPANT');
      expect(meRes.body.passwordHash).toBeUndefined();
    });

    it('GET /api/auth/me also supports Authorization: Bearer token header', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: testParticipantEmail,
          password: testPassword,
        });
      const token = loginRes.body.token;

      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.email).toBe(testParticipantEmail.toLowerCase());
    });

    it('GET /api/auth/me returns 401 Unauthorized when unauthenticated', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('RBAC test: Participant token receives 403 Forbidden on Manager-only route', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: testParticipantEmail,
          password: testPassword,
        });
      const cookie = loginRes.headers['set-cookie'];

      const rbacRes = await request(app)
        .get('/api/auth/manager-only-check')
        .set('Cookie', cookie);

      expect(rbacRes.status).toBe(403);
      expect(rbacRes.body.error.code).toBe('FORBIDDEN');
      expect(rbacRes.body.error.message).toBe('Access denied: insufficient permissions.');
    });

    it('RBAC test: Manager token receives 200 OK on Manager-only route', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: testManagerEmail,
          password: testPassword,
        });
      const cookie = loginRes.headers['set-cookie'];

      const rbacRes = await request(app)
        .get('/api/auth/manager-only-check')
        .set('Cookie', cookie);

      expect(rbacRes.status).toBe(200);
      expect(rbacRes.body.message).toBe('Manager access granted.');
    });
  });
});
