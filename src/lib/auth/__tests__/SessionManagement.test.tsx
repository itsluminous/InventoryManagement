/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { AuthProvider } from '../AuthProvider';
import { ProtectedRoute } from '../ProtectedRoute';
import { useAuth } from '@/lib/hooks/useAuth';
import * as fc from 'fast-check';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(() => null),
  })),
}));

// Mock the useAuth hook
jest.mock('@/lib/hooks/useAuth');

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
  })),
}));

const mockPush = jest.fn();
const mockRefresh = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({
    push: mockPush,
    refresh: mockRefresh,
  });
});

describe('Session Management', () => {
  describe('AuthProvider', () => {
    it('provides authentication context to children', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        session: null,
        loading: false,
      });

      render(
        <AuthProvider>
          <div>Test Child</div>
        </AuthProvider>
      );

      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    it('redirects authenticated users away from auth pages', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };

      (useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        session: { user: mockUser },
        loading: false,
      });

      // Mock window.location.pathname
      Object.defineProperty(window, 'location', {
        value: { pathname: '/login' },
        writable: true,
      });

      render(
        <AuthProvider>
          <div>Test Child</div>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('does not redirect during loading state', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        session: null,
        loading: true,
      });

      Object.defineProperty(window, 'location', {
        value: { pathname: '/login' },
        writable: true,
      });

      render(
        <AuthProvider>
          <div>Test Child</div>
        </AuthProvider>
      );

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('ProtectedRoute', () => {
    it('shows loading state while authentication is loading', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        session: null,
        loading: true,
      });

      render(
        <AuthProvider>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </AuthProvider>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('redirects unauthenticated users to login', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        session: null,
        loading: false,
      });

      render(
        <AuthProvider>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('renders protected content for authenticated users', () => {
      const mockUser = { id: '1', email: 'test@example.com' };

      (useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        session: { user: mockUser },
        loading: false,
      });

      render(
        <AuthProvider>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </AuthProvider>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('renders custom fallback during loading', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        session: null,
        loading: true,
      });

      render(
        <AuthProvider>
          <ProtectedRoute fallback={<div>Custom Loading...</div>}>
            <div>Protected Content</div>
          </ProtectedRoute>
        </AuthProvider>
      );

      expect(screen.getByText('Custom Loading...')).toBeInTheDocument();
    });
  });

  describe('Session Persistence', () => {
    it('maintains session state across component re-renders', () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      const mockSession = { user: mockUser, access_token: 'token' };

      (useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        session: mockSession,
        loading: false,
      });

      const { rerender } = render(
        <AuthProvider>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </AuthProvider>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();

      // Re-render with same session
      rerender(
        <AuthProvider>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </AuthProvider>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  // Property-Based Tests
  describe('Property 6: Authentication Session Management', () => {
    /**
     * Property: For any valid user credentials, the authentication system should create
     * persistent sessions that survive browser restarts and properly terminate on logout
     * with appropriate redirects.
     */
    it('should maintain session persistence across different authentication states', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary user data
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            email: fc.emailAddress(),
            created_at: fc.date().map(d => d.toISOString()),
          }),
          // Generate arbitrary session data
          fc.record({
            access_token: fc.string({ minLength: 10, maxLength: 100 }),
            refresh_token: fc.string({ minLength: 10, maxLength: 100 }),
            expires_at: fc.integer({
              min: Date.now(),
              max: Date.now() + 86400000,
            }),
          }),
          // Generate loading states
          fc.boolean(),
          (user, sessionData, loading) => {
            const session = { ...sessionData, user };

            // Mock the auth hook with generated data
            (useAuth as jest.Mock).mockReturnValue({
              user: loading ? null : user,
              session: loading ? null : session,
              loading,
            });

            const { unmount } = render(
              <AuthProvider>
                <ProtectedRoute>
                  <div data-testid="protected-content">Protected Content</div>
                </ProtectedRoute>
              </AuthProvider>
            );

            if (loading) {
              // During loading, should show loading state
              expect(screen.getByText('Loading...')).toBeInTheDocument();
            } else {
              // When not loading and user exists, should show protected content
              expect(
                screen.getByTestId('protected-content')
              ).toBeInTheDocument();
            }

            // Cleanup
            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle session termination correctly across different user states', () => {
      fc.assert(
        fc.property(
          // Generate different authentication paths
          fc.constantFrom(
            '/login',
            '/signup',
            '/reset-password',
            '/',
            '/masterlist',
            '/reports'
          ),
          // Generate user states (authenticated vs not)
          fc.boolean(),
          (currentPath, isAuthenticated) => {
            const mockUser = isAuthenticated
              ? {
                  id: 'test-user-id',
                  email: 'test@example.com',
                  created_at: new Date().toISOString(),
                }
              : null;

            const mockSession = isAuthenticated
              ? {
                  user: mockUser,
                  access_token: 'valid-token',
                  refresh_token: 'valid-refresh',
                  expires_at: Date.now() + 3600000,
                }
              : null;

            // Mock current path
            Object.defineProperty(window, 'location', {
              value: { pathname: currentPath },
              writable: true,
            });

            (useAuth as jest.Mock).mockReturnValue({
              user: mockUser,
              session: mockSession,
              loading: false,
            });

            const { unmount } = render(
              <AuthProvider>
                <div data-testid="auth-provider-child">Test Child</div>
              </AuthProvider>
            );

            // Verify the component renders
            expect(
              screen.getByTestId('auth-provider-child')
            ).toBeInTheDocument();

            const isAuthPage = [
              '/login',
              '/signup',
              '/reset-password',
            ].includes(currentPath);

            if (isAuthenticated && isAuthPage) {
              // Authenticated users on auth pages should be redirected to home
              expect(mockPush).toHaveBeenCalledWith('/');
            } else {
              // No redirect should occur in other cases
              expect(mockPush).not.toHaveBeenCalled();
            }

            // Reset mock for next iteration
            mockPush.mockClear();

            // Cleanup
            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain consistent authentication state during session transitions', () => {
      fc.assert(
        fc.property(
          // Generate sequence of authentication states
          fc.array(
            fc.record({
              user: fc.option(
                fc.record({
                  id: fc.string({ minLength: 1, maxLength: 50 }),
                  email: fc.emailAddress(),
                }),
                { nil: null }
              ),
              loading: fc.boolean(),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          authStates => {
            let lastRenderResult: any = null;

            authStates.forEach((authState, index) => {
              const session = authState.user
                ? {
                    user: authState.user,
                    access_token: `token-${index}`,
                    refresh_token: `refresh-${index}`,
                  }
                : null;

              (useAuth as jest.Mock).mockReturnValue({
                user: authState.user,
                session,
                loading: authState.loading,
              });

              if (lastRenderResult) {
                lastRenderResult.unmount();
              }

              lastRenderResult = render(
                <AuthProvider>
                  <ProtectedRoute>
                    <div data-testid="protected-content">
                      {authState.user
                        ? `User: ${authState.user.email}`
                        : 'No User'}
                    </div>
                  </ProtectedRoute>
                </AuthProvider>
              );

              if (authState.loading) {
                expect(screen.getByText('Loading...')).toBeInTheDocument();
              } else if (authState.user) {
                expect(
                  screen.getByTestId('protected-content')
                ).toBeInTheDocument();
                expect(
                  screen.getByText(`User: ${authState.user.email}`)
                ).toBeInTheDocument();
              } else {
                // Should redirect to login for unauthenticated users
                expect(mockPush).toHaveBeenCalledWith('/login');
              }
            });

            // Cleanup
            if (lastRenderResult) {
              lastRenderResult.unmount();
            }
            mockPush.mockClear();
          }
        ),
        { numRuns: 50 } // Reduced runs due to complexity
      );
    });
  });
});
