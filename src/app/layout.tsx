import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import { AuthErrorBoundary } from '@/lib/auth/AuthErrorBoundary';

export const metadata: Metadata = {
  title: {
    default: 'Inventory Management System',
    template: '%s | IMS',
  },
  description:
    'A comprehensive inventory management system for marriage hall businesses',
  keywords: ['inventory', 'management', 'business', 'tracking', 'FIFO'],
  authors: [{ name: 'IMS Team' }],
  creator: 'IMS Team',
  publisher: 'IMS Team',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'IMS',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1976d2' },
    { media: '(prefers-color-scheme: dark)', color: '#90caf9' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body>
        <ThemeProvider>
          <AuthErrorBoundary>
            <AuthProvider>{children}</AuthProvider>
          </AuthErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
