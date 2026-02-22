'use client';

import { Typography, Box, Card, CardContent, Stack } from '@mui/material';
import { useAuthContext } from '@/lib/auth/AuthProvider';
import { ProtectedRoute } from '@/lib/auth/ProtectedRoute';
import DashboardLayout from './(dashboard)/layout';

function DashboardContent() {
  const { user } = useAuthContext();

  return (
    <Box sx={{ textAlign: 'center', mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome to Your Dashboard
      </Typography>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        Hello, {user?.user_metadata?.full_name || user?.email}!
      </Typography>

      <Stack spacing={3} sx={{ mt: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              🔐 Authentication Complete
            </Typography>
            <Typography variant="body1" color="text.secondary">
              You are successfully logged in to the Inventory Management System.
              The authentication system includes login, signup, password reset,
              and session management with Supabase Auth.
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              🎨 Features Available
            </Typography>
            <Typography variant="body1" color="text.secondary">
              • Secure authentication with email verification
              <br />
              • Password reset functionality
              <br />
              • Persistent sessions across browser restarts
              <br />
              • Server-side route protection with Next.js middleware
              <br />
              • Material-UI with custom theme and light/dark mode
              <br />
              • Row Level Security (RLS) for data isolation
              <br />• PWA support for mobile app-like experience
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              📋 Coming Next
            </Typography>
            <Typography variant="body1" color="text.secondary">
              The core authentication system is now complete with both
              client-side and server-side route protection. Next steps include
              implementing the inventory management features, master data
              management, FIFO calculations, and reporting capabilities.
            </Typography>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}

export default function HomePage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <DashboardContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
