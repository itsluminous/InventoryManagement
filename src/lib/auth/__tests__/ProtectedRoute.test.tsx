import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '../ProtectedRoute';
import { AuthProvider } from '../AuthProvider';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock Supabase
const mockAuth = {
  getSession: jest.fn(),
  onAuthStateChange: jest.fn().mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } },
  }),
  signInWithPassword: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  resetPasswordForEmail: jest.fn(),
  updateUser: jest.fn(),
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: mockAuth }),
}));

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push: mockPush });

function renderWithProviders(component: React.ReactElement) {
  return render(
    <ThemeProvider>
      <AuthProvider>{component}</AuthProvider>
    </ThemeProvider>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state initially', () => {
    mockAuth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    renderWithProviders(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('redirects to login when user is not authenticated', async () => {
    mockAuth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    renderWithProviders(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    );

    // Wait for auth state to resolve
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('renders children when user is authenticated', async () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    const mockSession = { user: mockUser, access_token: 'token' };

    mockAuth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    renderWithProviders(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    );

    // Wait for auth state to resolve and component to update
    await waitFor(() => {
      expect(screen.getByText('Protected content')).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('renders custom fallback when provided', () => {
    mockAuth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    renderWithProviders(
      <ProtectedRoute fallback={<div>Custom loading...</div>}>
        <div>Protected content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Custom loading...')).toBeInTheDocument();
  });
});
