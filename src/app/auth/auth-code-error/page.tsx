import { Alert, Box, Button, Container, Typography } from '@mui/material';
import Link from 'next/link';

export default function AuthCodeErrorPage() {
  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Authentication Error
        </Typography>

        <Alert severity="error" sx={{ mb: 3 }}>
          There was an error processing your authentication request. This could
          be due to:
          <ul style={{ textAlign: 'left', marginTop: '8px' }}>
            <li>An expired or invalid authentication link</li>
            <li>The link has already been used</li>
            <li>A network connectivity issue</li>
          </ul>
        </Alert>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Please try signing in again or request a new password reset link if
          needed.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            component={Link}
            href="/login"
            variant="contained"
            size="large"
          >
            Back to Login
          </Button>

          <Button
            component={Link}
            href="/reset-password"
            variant="outlined"
            size="large"
          >
            Reset Password
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
