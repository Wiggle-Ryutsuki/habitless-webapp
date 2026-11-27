import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DashboardPage } from '../../src/pages/DashboardPage.js';
import * as AuthContextModule from '../../src/context/AuthContext.js';
import * as HabitsService from '../../src/services/habits.service.js';

describe('Program Manager Dashboard Fallback Component (UI-08)', () => {
  const mockManager = {
    id: 20,
    email: 'manager@example.com',
    fullName: 'Dr. Jordan Wells',
    role: 'PROGRAM_MANAGER' as const,
    isActive: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockManager,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
    });
  });

  it('renders Manager fallback card linking to /manager without calling Participant dashboard API', () => {
    const dashboardSpy = vi.spyOn(HabitsService, 'fetchParticipantDashboard');

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    expect(dashboardSpy).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: /dashboard under construction/i })).toBeInTheDocument();
    expect(
      screen.getByText(
        /the program manager dashboard is currently under construction\. please use the programs tab to manage and deploy your challenges\./i
      )
    ).toBeInTheDocument();

    const programsLink = screen.getByRole('link', { name: /go to programs/i });
    expect(programsLink).toHaveAttribute('href', '/manager');
  });

  it('keeps Manager Header Dashboard link placeholder toast intact until Feature 9', () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    const dashboardLinks = screen.getAllByRole('link', { name: 'Dashboard' });
    fireEvent.click(dashboardLinks[0]);

    const toast = screen.getByRole('status');
    expect(toast).toHaveTextContent(/dashboard is still under construction/i);
  });
});
