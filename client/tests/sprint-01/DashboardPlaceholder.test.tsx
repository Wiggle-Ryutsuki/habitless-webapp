import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DashboardPage } from '../../src/pages/DashboardPage.js';
import * as AuthContextModule from '../../src/context/AuthContext.js';

describe('Dashboard Under-Construction Component (UI-08)', () => {
  const mockUser = {
    id: 10,
    email: 'alex@example.com',
    fullName: 'Alex Rivera',
    role: 'PARTICIPANT' as const,
    isActive: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
    });
  });

  it('renders under-construction announcement and triggers toast notification', () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    // Toast notification
    const toast = screen.getByRole('status');
    expect(toast).toHaveTextContent(/dashboard is still under construction/i);
    expect(toast).toHaveAttribute('aria-live', 'polite');

    // Under-construction card
    expect(screen.getByRole('heading', { name: /dashboard under construction/i })).toBeInTheDocument();
    expect(
      screen.getByText(/the participant dashboard is currently under construction\. please use the habit calendar to track your daily habits\./i)
    ).toBeInTheDocument();

    // Link to Habit Calendar
    const calendarLink = screen.getByRole('link', { name: /go to habit calendar/i });
    expect(calendarLink).toHaveAttribute('href', '/calendar');
  });

  it('allows dismissing the toast notification', () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    const toast = screen.getByRole('status');
    expect(toast).toBeInTheDocument();

    const dismissBtn = screen.getByRole('button', { name: /dismiss notification/i });
    fireEvent.click(dismissBtn);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

