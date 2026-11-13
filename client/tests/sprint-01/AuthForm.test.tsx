import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthForm } from '../../src/components/AuthForm.js';
import * as AuthContextModule from '../../src/context/AuthContext.js';

describe('AuthForm UI Component (UI-01)', () => {
  const mockLogin = vi.fn();
  const mockRegister = vi.fn();
  const mockClearError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      isLoading: false,
      error: null,
      login: mockLogin,
      register: mockRegister,
      logout: vi.fn(),
      clearError: mockClearError,
    });
  });

  it('renders login mode with email, password, and sign in button', () => {
    render(
      <MemoryRouter>
        <AuthForm mode="login" />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /habitless/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account\?/i)).toBeInTheDocument();
  });

  it('renders register mode with full name and role radio selector', () => {
    render(
      <MemoryRouter>
        <AuthForm mode="register" />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/participant/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/program manager/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('enforces required field validations and client-side password min length of 8', async () => {
    render(
      <MemoryRouter>
        <AuthForm mode="register" />
      </MemoryRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Full name is required.')).toBeInTheDocument();
      expect(screen.getByText('Email is required.')).toBeInTheDocument();
      expect(screen.getByText('Password is required.')).toBeInTheDocument();
    });

    // Test password < 8 chars
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'short' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters long.')).toBeInTheDocument();
    });
  });

  it('displays inline validation errors with aria-live="polite"', async () => {
    render(
      <MemoryRouter>
        <AuthForm mode="register" />
      </MemoryRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      const politeAlerts = screen.getAllByText((_content, element) => {
        return element?.getAttribute('aria-live') === 'polite';
      });
      expect(politeAlerts.length).toBeGreaterThan(0);
    });
  });

  it('disables submit button and shows loading text during form submission', async () => {
    mockLogin.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 300)));

    render(
      <MemoryRouter>
        <AuthForm mode="login" />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password123!' } });

    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(submitBtn).toBeDisabled();
  });
});
