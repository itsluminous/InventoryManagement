import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuthContext } from '../AuthProvider';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(() => null),
  })),
  usePathname: jest.fn(() => '/'),
}));

// Mock Supabase
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: jest
        .fn()
        .mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
    },
  }),
}));

// Mock the useAuth hook to avoid actual Supabase calls
jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    user: null,
    session: null,
    loading: false,
  })),
  useAuthActions: jest.fn(() => ({
    signOut: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    resetPassword: jest.fn(),
    updatePassword: jest.fn(),
  })),
}));

// Test component that uses the auth context
function TestComponent() {
  const { user, loading } = useAuthContext();

  if (loading) return <div>Loading...</div>;
  if (user) return <div>Authenticated: {user.email}</div>;
  return <div>Not authenticated</div>;
}

// Mock window.location for testing redirects
Object.defineProperty(window, 'location', {
  value: {
    pathname: '/',
  },
  writable: true,
});

function renderWithProviders(component: React.ReactElement) {
  return render(
    <ThemeProvider>
      <AuthProvider>{component}</AuthProvider>
    </ThemeProvider>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('provides authentication context to children', async () => {
    renderWithProviders(<TestComponent />);

    // Should show not authenticated when no user and not loading
    expect(screen.getByText('Not authenticated')).toBeInTheDocument();
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuthContext must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });
});
