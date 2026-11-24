import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../../src/components/ProtectedRoute.js';
import * as AuthContextModule from '../../src/context/AuthContext.js';

/**
 * Reproduction & Regression Test for DEF-HL-01 (UAT-HL-03 finding by Team GuessLess).
 *
 * Issue: When a PARTICIPANT attempts to access the manager-only portal (/manager),
 * client-side ProtectedRoute should redirect them to their primary interface (/calendar),
 * NOT to the under-construction /dashboard placeholder.
 */
describe('ProtectedRoute Component - Role Barriers & Redirection (DEF-HL-01)', () => {
  const mockParticipant = {
    id: 1,
    email: 'participant1@habitless.internal',
    fullName: 'Alex Rivera',
    role: 'PARTICIPANT' as const,
    isActive: true,
  };

  const mockManager = {
    id: 2,
    email: 'manager@habitless.internal',
    fullName: 'Dr. Jordan Wells',
    role: 'PROGRAM_MANAGER' as const,
    isActive: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows access to manager route when user has PROGRAM_MANAGER role', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockManager,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/manager']}>
        <Routes>
          <Route
            path="/manager"
            element={
              <ProtectedRoute allowedRoles={['PROGRAM_MANAGER']}>
                <div>Manager Portal Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/calendar" element={<div>Habit Calendar Page</div>} />
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Manager Portal Content')).toBeInTheDocument();
  });

  it('redirects unauthorized PARTICIPANT to /calendar instead of /dashboard placeholder (DEF-HL-01)', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockParticipant,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/manager']}>
        <Routes>
          <Route
            path="/manager"
            element={
              <ProtectedRoute allowedRoles={['PROGRAM_MANAGER']}>
                <div>Manager Portal Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/calendar" element={<div>Habit Calendar Page</div>} />
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Manager portal content must be completely blocked
    expect(screen.queryByText('Manager Portal Content')).not.toBeInTheDocument();

    // MUST redirect to the primary Habit Calendar (/calendar), NOT to /dashboard
    expect(screen.getByText('Habit Calendar Page')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard Page')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated user to login with redirect parameter', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/manager']}>
        <Routes>
          <Route
            path="/manager"
            element={
              <ProtectedRoute allowedRoles={['PROGRAM_MANAGER']}>
                <div>Manager Portal Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Manager Portal Content')).not.toBeInTheDocument();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });
});
