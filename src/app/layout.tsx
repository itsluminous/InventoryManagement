import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import { AuthErrorBoundary } from '@/lib/auth/AuthErrorBoundary';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { FeedbackProvider } from '@/components/layout/FeedbackSystem';
import { PWAInstallPrompt } from '@/components/layout/PWAInstallPrompt';
import { OfflineIndicator } from '@/components/layout/OfflineIndicator';
import { PerformanceMonitor } from '@/components/layout/PerformanceMonitor';

export const metadata: Metadata = {
  title: {
    default: 'Inventory Management System',
    template: '%s | Inventory Management System',
  },
  description:
    'A comprehensive inventory management system for marriage hall businesses with real-time tracking, FIFO costing, and advanced reporting capabilities.',
  keywords: [
    'inventory',
    'management',
    'business',
    'tracking',
    'FIFO',
    'marriage hall',
    'wedding',
    'event management',
  ],
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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://inventory-management-system.vercel.app',
    title: 'Inventory Management System',
    description:
      'Professional inventory management for marriage hall businesses',
    siteName: 'Inventory Management System',
  },
  robots: {
    index: false, // Private business application
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1976d2' },
    { media: '(prefers-color-scheme: dark)', color: '#90caf9' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <meta name="theme-color" content="#1976d2" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body style={{ margin: 0, padding: 0, minHeight: '100vh' }}>
        <ErrorBoundary>
          <ThemeProvider>
            <FeedbackProvider>
              <AuthErrorBoundary>
                <AuthProvider>
                  {children}
                  <PWAInstallPrompt showInSnackbar />
                  <OfflineIndicator />
                  <PerformanceMonitor />
                </AuthProvider>
              </AuthErrorBoundary>
            </FeedbackProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
