'use client';

import { useEffect } from 'react';

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface PerformanceMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
}

interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
}

// Performance monitoring hook
export function usePerformanceMonitor() {
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      process.env.NODE_ENV !== 'production'
    ) {
      return;
    }

    const metrics: PerformanceMetrics = {};

    // Measure Core Web Vitals
    const observer = new PerformanceObserver(list => {
      list.getEntries().forEach(entry => {
        switch (entry.entryType) {
          case 'paint':
            if (entry.name === 'first-contentful-paint') {
              metrics.fcp = entry.startTime;
            }
            break;
          case 'largest-contentful-paint':
            metrics.lcp = entry.startTime;
            break;
          case 'first-input':
            metrics.fid =
              (entry as PerformanceEventTiming).processingStart -
              entry.startTime;
            break;
          case 'layout-shift':
            if (!(entry as LayoutShift).hadRecentInput) {
              metrics.cls = (metrics.cls || 0) + (entry as LayoutShift).value;
            }
            break;
          case 'navigation':
            const navEntry = entry as PerformanceNavigationTiming;
            metrics.ttfb = navEntry.responseStart - navEntry.requestStart;
            break;
        }
      });
    });

    // Observe different entry types
    try {
      observer.observe({
        entryTypes: [
          'paint',
          'largest-contentful-paint',
          'first-input',
          'layout-shift',
          'navigation',
        ],
      });
    } catch (e) {
      // Fallback for browsers that don't support all entry types
      console.warn('Performance monitoring not fully supported');
    }

    // Report metrics after page load
    const reportMetrics = () => {
      if (Object.keys(metrics).length > 0) {
        console.log('Performance Metrics:', metrics);

        // In production, you would send these to your analytics service
        // Example: analytics.track('performance_metrics', metrics);
      }
    };

    // Report after a delay to capture all metrics
    const timeoutId = setTimeout(reportMetrics, 5000);

    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, []);
}

// Component to automatically monitor performance
export function PerformanceMonitor() {
  usePerformanceMonitor();
  return null;
}

// Resource loading optimization
export function preloadCriticalResources() {
  if (typeof window === 'undefined') return;

  // Preload critical fonts
  const fontLink = document.createElement('link');
  fontLink.rel = 'preload';
  fontLink.href = '/fonts/roboto-v30-latin-regular.woff2';
  fontLink.as = 'font';
  fontLink.type = 'font/woff2';
  fontLink.crossOrigin = 'anonymous';
  document.head.appendChild(fontLink);

  // Preload critical images
  const logoImg = new Image();
  logoImg.src = '/icons/icon-192x192.png';

  // Prefetch likely next pages
  const prefetchPages = ['/masterlist', '/reports'];
  prefetchPages.forEach(page => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = page;
    document.head.appendChild(link);
  });
}

// Memory usage monitoring (development only)
export function useMemoryMonitor() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as { memory: MemoryInfo }).memory;
        console.log('Memory Usage:', {
          used: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
          total: Math.round(memory.totalJSHeapSize / 1048576) + ' MB',
          limit: Math.round(memory.jsHeapSizeLimit / 1048576) + ' MB',
        });
      }
    };

    const interval = setInterval(checkMemory, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);
}
