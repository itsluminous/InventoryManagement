// Performance optimization utilities
import React from 'react';

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

// Debounce function for search inputs and API calls
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function for scroll events and frequent updates
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Lazy loading utility for components
export function createLazyComponent<T extends React.ComponentType<unknown>>(
  importFunc: () => Promise<{ default: T }>
) {
  return React.lazy(importFunc);
}

// Memory-efficient array chunking for large datasets
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

// Virtual scrolling helper for large lists
export function calculateVisibleItems(
  containerHeight: number,
  itemHeight: number,
  scrollTop: number,
  totalItems: number,
  overscan: number = 5
) {
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    totalItems - 1,
    startIndex + visibleCount + overscan * 2
  );

  return {
    startIndex,
    endIndex,
    visibleCount,
    offsetY: startIndex * itemHeight,
  };
}

// Intersection Observer utility for lazy loading
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }

  return new IntersectionObserver(callback, {
    threshold: 0.1,
    rootMargin: '50px',
    ...options,
  });
}

// Preload resources for better performance
export function preloadResource(href: string, as: string, type?: string) {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (type) link.type = type;

  document.head.appendChild(link);
}

// Prefetch next page for better navigation
export function prefetchPage(href: string) {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;

  document.head.appendChild(link);
}

// Optimize images by converting to WebP if supported
export function getOptimizedImageSrc(
  src: string,
  width?: number,
  quality: number = 85
): string {
  if (typeof window === 'undefined') return src;

  const supportsWebP = (() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  })();

  if (supportsWebP && !src.includes('.svg')) {
    const url = new URL(src, window.location.origin);
    url.searchParams.set('format', 'webp');
    url.searchParams.set('quality', quality.toString());
    if (width) url.searchParams.set('width', width.toString());
    return url.toString();
  }

  return src;
}

// Bundle size analyzer helper
export function analyzeBundleSize() {
  if (process.env.NODE_ENV !== 'development') return;

  console.log('Bundle Analysis:');
  console.log('- React:', React);
  console.log('- Total modules loaded:', Object.keys(window).length);

  // Analyze memory usage if available
  if ('memory' in performance) {
    const memory = (performance as { memory: MemoryInfo }).memory;
    console.log('Memory Usage:', {
      used: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
      total: Math.round(memory.totalJSHeapSize / 1048576) + ' MB',
      limit: Math.round(memory.jsHeapSizeLimit / 1048576) + ' MB',
    });
  }
}
