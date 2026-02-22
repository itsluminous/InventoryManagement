import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import { AuthErrorBoundary } from '@/lib/auth/AuthErrorBoundary';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { FeedbackProvider } from '@/components/layout/FeedbackSystem';
import { PWAInstallPrompt } from '@/components/layout/PWAInstallPrompt';
import { OfflineIndicator } from '@/components/layout/OfflineIndicator';

export const metadata: Metadata = {
  title: {
    default: 'Inventory Management System',
    template: '%s | Inventory Management System',
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
    title: 'Inventory Management System',
  },
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/inventory-icon.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#9e9e9e' },
    { media: '(prefers-color-scheme: dark)', color: '#9e9e9e' },
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
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body>
        <ErrorBoundary>
          <ThemeProvider>
            <FeedbackProvider>
              <AuthErrorBoundary>
                <AuthProvider>
                  {children}
                  <PWAInstallPrompt showInSnackbar />
                  <OfflineIndicator />
                </AuthProvider>
              </AuthErrorBoundary>
            </FeedbackProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
