'use client';

import { Container, Typography, Box, Card, CardContent } from '@mui/material';

export default function ReportsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Reports & Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View detailed reports and analytics for your inventory
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Coming Soon
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The reporting functionality will be implemented in upcoming tasks.
            This will include period selection, item filtering, trend analysis,
            and comprehensive expense reports.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
}
