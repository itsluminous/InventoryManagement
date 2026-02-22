/**
 * PWA utilities for handling installation, offline detection, and service worker management
 */

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

/**
 * PWA installation and management utilities
 */
export class PWAManager {
  private static instance: PWAManager;
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isInstalled = false;
  private isOnline = true;
  private listeners: Map<string, Set<(...args: unknown[]) => void>> = new Map();

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializeEventListeners();
      this.checkInstallationStatus();
      this.checkOnlineStatus();
    }
  }

  static getInstance(): PWAManager {
    if (!PWAManager.instance) {
      PWAManager.instance = new PWAManager();
    }
    return PWAManager.instance;
  }

  private initializeEventListeners() {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.emit('installable', true);
    });

    // Listen for appinstalled event
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.deferredPrompt = null;
      this.emit('installed', true);
    });

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.emit('online', true);
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.emit('offline', true);
    });

    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        this.emit('updated', true);
      });
    }
  }

  private checkInstallationStatus() {
    if (typeof window === 'undefined') {
      this.isInstalled = false;
      return;
    }

    // Check if app is installed (running in standalone mode)
    this.isInstalled =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
  }

  private checkOnlineStatus() {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      this.isOnline = true; // Default to online during SSR
      return;
    }

    this.isOnline = navigator.onLine;
  }

  /**
   * Check if PWA can be installed
   */
  canInstall(): boolean {
    return this.deferredPrompt !== null && !this.isInstalled;
  }

  /**
   * Check if PWA is already installed
   */
  isAppInstalled(): boolean {
    return this.isInstalled;
  }

  /**
   * Check if device is online
   */
  isDeviceOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Prompt user to install PWA
   */
  async promptInstall(): Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  } | null> {
    if (!this.deferredPrompt) {
      return null;
    }

    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;
      return choiceResult;
    } catch (error) {
      console.error('Error prompting for install:', error);
      return null;
    }
  }

  /**
   * Register service worker manually if needed
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  /**
   * Update service worker
   */
  async updateServiceWorker(): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Service Worker update failed:', error);
      return false;
    }
  }

  /**
   * Add event listener
   */
  on(event: string, callback: (...args: unknown[]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: (...args: unknown[]) => void) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data: unknown) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  /**
   * Get PWA display mode
   */
  getDisplayMode(): 'browser' | 'standalone' | 'minimal-ui' | 'fullscreen' {
    if (typeof window === 'undefined') {
      return 'browser'; // Default to browser during SSR
    }

    if (window.matchMedia('(display-mode: fullscreen)').matches) {
      return 'fullscreen';
    }
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return 'standalone';
    }
    if (window.matchMedia('(display-mode: minimal-ui)').matches) {
      return 'minimal-ui';
    }
    return 'browser';
  }

  /**
   * Check if device supports PWA features
   */
  isPWASupported(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false; // No PWA support during SSR
    }

    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }
}

/**
 * Hook for using PWA functionality in React components
 */
export function usePWA() {
  const pwaManager = PWAManager.getInstance();

  return {
    canInstall: pwaManager.canInstall(),
    isInstalled: pwaManager.isAppInstalled(),
    isOnline: pwaManager.isDeviceOnline(),
    displayMode: pwaManager.getDisplayMode(),
    isSupported: pwaManager.isPWASupported(),
    promptInstall: () => pwaManager.promptInstall(),
    updateServiceWorker: () => pwaManager.updateServiceWorker(),
    on: (event: string, callback: (...args: unknown[]) => void) =>
      pwaManager.on(event, callback),
    off: (event: string, callback: (...args: unknown[]) => void) =>
      pwaManager.off(event, callback),
  };
}
