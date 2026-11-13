import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isParticipant = user.role === 'PARTICIPANT';

  const triggerUnderConstruction = () => {
    setToastMessage('Dashboard is still under construction');
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  return (
    <>
      <header style={{
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--papaya-whip)',
        padding: '0 1.5rem',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        {/* Brand & Desktop Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link to={isParticipant ? '/calendar' : '/manager'} style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--walnut)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            textDecoration: 'none',
          }}>
            HabitLess
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="desktop-nav" style={{ display: 'flex', gap: '1rem' }}>
            {isParticipant ? (
              <>
                <Link to="/calendar" style={{
                  color: 'var(--walnut)',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                }}>
                  Habit Calendar
                </Link>
                <Link
                  to="/dashboard"
                  onClick={triggerUnderConstruction}
                  style={{
                    color: 'var(--color-text-muted)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.9375rem',
                    fontWeight: 500,
                  }}
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <Link to="/manager" style={{
                color: 'var(--walnut)',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.9375rem',
                fontWeight: 600,
              }}>
                Programs
              </Link>
            )}
          </nav>
      </div>

      {/* Desktop User Info & Logout */}
      <div className="desktop-user-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.875rem',
        }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
            {user.fullName}
          </span>
          <span style={{
            backgroundColor: 'var(--golden-sand)',
            color: 'var(--walnut)',
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            {user.role === 'PARTICIPANT' ? 'Participant' : 'Manager'}
          </span>
        </div>

        <button
          onClick={handleLogout}
          style={{
            backgroundColor: 'transparent',
            border: '1px solid var(--walnut)',
            color: 'var(--walnut)',
            padding: '6px 14px',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '0.875rem',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--walnut)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--walnut)';
          }}
        >
          Log Out
        </button>
      </div>

      {/* Mobile Hamburger Toggle Button */}
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle Navigation Menu"
        style={{
          display: 'none',
          background: 'none',
          border: 'none',
          fontSize: '1.5rem',
          color: 'var(--walnut)',
          padding: '4px 8px',
        }}
      >
        ☰
      </button>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="mobile-drawer"
          style={{
            position: 'fixed',
            top: '64px',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(45, 28, 11, 0.4)',
            zIndex: 99,
          }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              borderBottom: '2px solid var(--walnut)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--papaya-whip)' }}>
              <div style={{ fontWeight: 700, color: 'var(--walnut)' }}>{user.fullName}</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{user.email}</div>
              <span style={{
                display: 'inline-block',
                marginTop: '4px',
                backgroundColor: 'var(--golden-sand)',
                color: 'var(--walnut)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px',
              }}>
                {user.role}
              </span>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {isParticipant ? (
                <>
                  <Link
                    to="/calendar"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ padding: '8px 0', fontWeight: 600, color: 'var(--walnut)' }}
                  >
                    Habit Calendar
                  </Link>
                  <Link
                    to="/dashboard"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      triggerUnderConstruction();
                    }}
                    style={{ padding: '8px 0', color: 'var(--color-text-muted)' }}
                  >
                    Dashboard
                  </Link>
                </>
              ) : (
                <Link
                  to="/manager"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ padding: '8px 0', fontWeight: 600, color: 'var(--walnut)' }}
                >
                  Programs
                </Link>
              )}
            </nav>

            <button
              onClick={handleLogout}
              style={{
                marginTop: '0.5rem',
                backgroundColor: 'var(--walnut)',
                color: '#fff',
                border: 'none',
                padding: '10px',
                borderRadius: '6px',
                fontWeight: 600,
              }}
            >
              Log Out
            </button>
          </div>
        </div>
      )}

      {/* Embedded Responsive Media Queries */}
      <style>{`
        @media (max-width: 767px) {
          .desktop-nav, .desktop-user-actions {
            display: none !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
        }
      `}</style>
    </header>

    {/* Floating Toast Notification */}
    {toastMessage && (
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed',
          top: '76px',
          right: '1.5rem',
          backgroundColor: 'var(--walnut)',
          color: '#ffffff',
          padding: '0.75rem 1.25rem',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(114, 67, 25, 0.25)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.9375rem',
          fontWeight: 600,
        }}
      >
        <span>🚧 {toastMessage}</span>
        <button
          onClick={() => setToastMessage(null)}
          aria-label="Dismiss notification"
          style={{
            background: 'none',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '1rem',
            padding: '0 4px',
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>
    )}
    </>
  );
};

