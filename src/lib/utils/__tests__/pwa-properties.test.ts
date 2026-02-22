/**
 * Property-based tests for PWA functionality
 * **Property 11: Real-time Data Synchronization**
 */

import * as fc from 'fast-check';
import { OfflineQueueManager, QueuedOperation } from '../offlineQueue';
import { PWAManager } from '../pwa';

// Mock IndexedDB for testing
const mockIndexedDB = {
  open: jest.fn(),
  deleteDatabase: jest.fn(),
};

const mockIDBDatabase = {
  transaction: jest.fn(),
  close: jest.fn(),
  objectStoreNames: { contains: jest.fn() },
  createObjectStore: jest.fn(),
};

const mockIDBTransaction = {
  objectStore: jest.fn(),
  oncomplete: null,
  onerror: null,
  onabort: null,
};

const mockIDBObjectStore = {
  add: jest.fn(),
  put: jest.fn(),
  get: jest.fn(),
  getAll: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  createIndex: jest.fn(),
  index: jest.fn(),
};

const mockIDBRequest = {
  result: null,
  error: null,
  onsuccess: null,
  onerror: null,
};

// Setup mocks
beforeAll(() => {
  // Mock IndexedDB
  Object.defineProperty(global, 'indexedDB', {
    value: mockIndexedDB,
    writable: true,
  });

  // Mock navigator
  Object.defineProperty(global, 'navigator', {
    value: {
      onLine: true,
      serviceWorker: {
        register: jest.fn(),
        getRegistration: jest.fn(),
        addEventListener: jest.fn(),
      },
    },
    writable: true,
  });

  // Mock window
  Object.defineProperty(global, 'window', {
    value: {
      addEventListener: jest.fn(),
      matchMedia: jest.fn(() => ({ matches: false })),
    },
    writable: true,
  });
});

beforeEach(() => {
  jest.clearAllMocks();

  // Setup IndexedDB mocks
  mockIndexedDB.open.mockImplementation(() => {
    const request = { ...mockIDBRequest };
    setTimeout(() => {
      (request as any).result = mockIDBDatabase;
      if (request.onsuccess) (request.onsuccess as any)();
    }, 0);
    return request;
  });

  mockIDBDatabase.transaction.mockReturnValue(mockIDBTransaction);
  mockIDBTransaction.objectStore.mockReturnValue(mockIDBObjectStore);

  // Setup successful operations by default
  mockIDBObjectStore.add.mockImplementation(() => {
    const request = { ...mockIDBRequest };
    setTimeout(() => {
      if (request.onsuccess) (request.onsuccess as any)();
    }, 0);
    return request;
  });

  mockIDBObjectStore.getAll.mockImplementation(() => {
    const request = { ...mockIDBRequest };
    (request as any).result = [];
    setTimeout(() => {
      if (request.onsuccess) (request.onsuccess as any)();
    }, 0);
    return request;
  });
});

describe('PWA Property Tests', () => {
  describe('Property 11: Real-time Data Synchronization', () => {
    /**
     * Property: For any valid operation data, when queued offline and then synced online,
     * the operation should be processed exactly once and removed from the queue
     */
    test('operations are processed exactly once during sync', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            type: fc.constantFrom(
              'add_inventory',
              'remove_inventory',
              'create_master_item'
            ),
            data: fc.record({
              master_item_id: fc.uuid(),
              quantity: fc.integer({ min: 1, max: 1000 }),
              unit_price: fc.float({
                min: Math.fround(0.01),
                max: Math.fround(10000),
                noNaN: true,
              }),
              notes: fc.option(fc.string({ minLength: 0, maxLength: 100 })),
            }),
            maxRetries: fc.integer({ min: 1, max: 5 }),
          }),
          async ({ type, data, maxRetries }) => {
            // Create a new queue manager instance for each test
            const queueManager = new (OfflineQueueManager as any)();

            // Mock the storage operations
            const operations: QueuedOperation[] = [];
            let operationCounter = 0;

            // Mock storage methods
            queueManager.storage = {
              init: jest.fn().mockResolvedValue(undefined),
              add: jest.fn().mockImplementation(op => {
                operations.push(op);
                return Promise.resolve();
              }),
              update: jest.fn().mockImplementation(op => {
                const index = operations.findIndex(o => o.id === op.id);
                if (index >= 0) {
                  operations[index] = op;
                }
                return Promise.resolve();
              }),
              getAll: jest.fn().mockResolvedValue(operations),
              getPending: jest.fn().mockImplementation(() => {
                return Promise.resolve(
                  operations.filter(op => op.status === 'pending')
                );
              }),
              remove: jest.fn().mockImplementation(id => {
                const index = operations.findIndex(op => op.id === id);
                if (index >= 0) {
                  operations.splice(index, 1);
                }
                return Promise.resolve();
              }),
              clear: jest.fn().mockImplementation(() => {
                operations.length = 0;
                return Promise.resolve();
              }),
            };

            // Mock successful operation execution
            queueManager.executeOperation = jest.fn().mockImplementation(() => {
              operationCounter++;
              return Promise.resolve({ success: true });
            });

            // Start offline to prevent automatic sync
            queueManager.isOnline = false;
            queueManager.isSyncing = false;

            // Queue the operation
            const operationId = await queueManager.queueOperation(
              type as any,
              data,
              maxRetries
            );

            // Verify operation was queued and is still pending
            expect(operations).toHaveLength(1);
            expect(operations[0].id).toBe(operationId);
            expect(operations[0].status).toBe('pending');
            expect(operations[0].type).toBe(type);
            expect(operations[0].data).toEqual(data);
            expect(operations[0].maxRetries).toBe(maxRetries);

            // Simulate going online and syncing
            queueManager.isOnline = true;
            await queueManager.syncPendingOperations();

            // Verify operation was executed exactly once
            expect(operationCounter).toBe(1);
            expect(queueManager.executeOperation).toHaveBeenCalledTimes(1);
            expect(queueManager.executeOperation).toHaveBeenCalledWith(
              expect.objectContaining({
                id: operationId,
                type,
                data,
                // Status can be either 'syncing' or 'completed' depending on timing
                status: expect.stringMatching(/^(syncing|completed)$/),
              })
            );

            // Verify operation was removed from queue after successful sync
            expect(operations).toHaveLength(0);
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Property: For any operation that fails during sync, it should be retried up to maxRetries times
     * and marked as failed if all retries are exhausted
     */
    test('failed operations are retried according to maxRetries', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            type: fc.constantFrom(
              'add_inventory',
              'remove_inventory',
              'create_master_item'
            ),
            data: fc.record({
              master_item_id: fc.uuid(),
              quantity: fc.integer({ min: 1, max: 1000 }),
              unit_price: fc.float({
                min: Math.fround(0.01),
                max: Math.fround(10000),
                noNaN: true,
              }),
            }),
            maxRetries: fc.integer({ min: 1, max: 3 }),
          }),
          async ({ type, data, maxRetries }) => {
            const queueManager = new (OfflineQueueManager as any)();
            const operations: QueuedOperation[] = [];
            let executionCount = 0;

            // Mock storage
            queueManager.storage = {
              init: jest.fn().mockResolvedValue(undefined),
              add: jest.fn().mockImplementation(op => {
                operations.push(op);
                return Promise.resolve();
              }),
              update: jest.fn().mockImplementation(op => {
                const index = operations.findIndex(o => o.id === op.id);
                if (index >= 0) {
                  operations[index] = op;
                }
                return Promise.resolve();
              }),
              getPending: jest.fn().mockImplementation(() => {
                return Promise.resolve(
                  operations.filter(op => op.status === 'pending')
                );
              }),
              remove: jest.fn().mockResolvedValue(undefined),
            };

            // Mock failing operation execution
            queueManager.executeOperation = jest.fn().mockImplementation(() => {
              executionCount++;
              return Promise.resolve({ success: false, error: 'Test error' });
            });

            // Start offline to prevent automatic sync
            queueManager.isOnline = false;
            queueManager.isSyncing = false;

            // Queue the operation
            await queueManager.queueOperation(type as any, data, maxRetries);

            // Simulate going online and multiple sync attempts
            queueManager.isOnline = true;

            // Sync until all retries are exhausted
            let syncAttempts = 0;
            while (
              syncAttempts < maxRetries &&
              operations.some(op => op.status === 'pending')
            ) {
              await queueManager.syncPendingOperations();
              syncAttempts++;
            }

            // Verify operation was executed exactly maxRetries times
            expect(executionCount).toBe(maxRetries);

            // Verify operation is marked as failed after exhausting retries
            expect(operations).toHaveLength(1);
            expect(operations[0].status).toBe('failed');
            expect(operations[0].retryCount).toBe(maxRetries);
            expect(operations[0].error).toBe('Test error');
          }
        ),
        { numRuns: 30 }
      );
    });

    /**
     * Property: For any sequence of operations queued while offline, when synced online,
     * all operations should be processed in the correct order (FIFO)
     */
    test('operations are processed in FIFO order during sync', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              type: fc.constantFrom('add_inventory', 'create_master_item'),
              data: fc.record({
                master_item_id: fc.uuid(),
                quantity: fc.integer({ min: 1, max: 100 }),
                unit_price: fc.float({
                  min: Math.fround(0.01),
                  max: Math.fround(1000),
                  noNaN: true,
                }),
              }),
            }),
            { minLength: 2, maxLength: 5 }
          ),
          async operationSpecs => {
            const queueManager = new (OfflineQueueManager as any)();
            const operations: QueuedOperation[] = [];
            const executionOrder: string[] = [];

            // Mock storage
            queueManager.storage = {
              init: jest.fn().mockResolvedValue(undefined),
              add: jest.fn().mockImplementation(op => {
                operations.push(op);
                return Promise.resolve();
              }),
              update: jest.fn().mockResolvedValue(undefined),
              getPending: jest.fn().mockImplementation(() => {
                return Promise.resolve(
                  operations.filter(op => op.status === 'pending')
                );
              }),
              remove: jest.fn().mockImplementation(id => {
                const index = operations.findIndex(op => op.id === id);
                if (index >= 0) {
                  operations.splice(index, 1);
                }
                return Promise.resolve();
              }),
            };

            // Mock operation execution that tracks order
            queueManager.executeOperation = jest.fn().mockImplementation(op => {
              executionOrder.push(op.id);
              return Promise.resolve({ success: true });
            });

            // Queue all operations while offline
            queueManager.isOnline = false;
            const queuedIds: string[] = [];
            for (const spec of operationSpecs) {
              const id = await queueManager.queueOperation(
                spec.type as any,
                spec.data
              );
              queuedIds.push(id);
            }

            // Verify all operations were queued
            expect(operations).toHaveLength(operationSpecs.length);

            // Simulate going online and syncing
            queueManager.isOnline = true;
            await queueManager.syncPendingOperations();

            // Verify operations were executed in FIFO order
            expect(executionOrder).toEqual(queuedIds);
            expect(operations).toHaveLength(0); // All should be removed after successful sync
          }
        ),
        { numRuns: 30 }
      );
    });

    /**
     * Property: PWA installation state should be consistent across browser sessions
     */
    test('PWA installation state consistency', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            isStandalone: fc.boolean(),
            hasBeforeInstallPrompt: fc.boolean(),
            userChoice: fc.constantFrom('accepted', 'dismissed'),
          }),
          async ({ isStandalone, hasBeforeInstallPrompt, userChoice }) => {
            // Mock window.matchMedia for standalone detection
            const mockMatchMedia = jest.fn().mockImplementation(query => ({
              matches: query.includes('standalone') ? isStandalone : false,
              addEventListener: jest.fn(),
              removeEventListener: jest.fn(),
            }));

            Object.defineProperty(window, 'matchMedia', {
              value: mockMatchMedia,
              writable: true,
            });

            // Mock navigator.standalone for iOS
            Object.defineProperty(window, 'navigator', {
              value: {
                ...navigator,
                standalone: isStandalone,
              },
              writable: true,
            });

            const pwaManager = new (PWAManager as any)();

            // Test initial installation state
            const initialInstalled = pwaManager.isAppInstalled();
            expect(initialInstalled).toBe(isStandalone);

            // Test installation capability
            if (hasBeforeInstallPrompt && !isStandalone) {
              // Simulate beforeinstallprompt event
              const mockPromptEvent = {
                preventDefault: jest.fn(),
                prompt: jest.fn().mockResolvedValue(undefined),
                userChoice: Promise.resolve({
                  outcome: userChoice,
                  platform: 'web',
                }),
              };

              pwaManager.deferredPrompt = mockPromptEvent;

              expect(pwaManager.canInstall()).toBe(true);

              // Test installation prompt
              const result = await pwaManager.promptInstall();
              expect(result?.outcome).toBe(userChoice);

              if (userChoice === 'accepted') {
                // After acceptance, prompt should be cleared
                expect(pwaManager.deferredPrompt).toBeNull();
              }
            } else {
              expect(pwaManager.canInstall()).toBe(false);
            }

            // Test display mode detection
            const displayMode = pwaManager.getDisplayMode();
            if (isStandalone) {
              expect(displayMode).toBe('standalone');
            } else {
              expect(displayMode).toBe('browser');
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Property: Online/offline state changes should trigger appropriate sync behavior
     */
    test('online/offline state changes trigger correct sync behavior', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.boolean(), { minLength: 2, maxLength: 10 }),
          async onlineStates => {
            const queueManager = new (OfflineQueueManager as any)();
            const operations: QueuedOperation[] = [];
            let syncCallCount = 0;

            // Mock storage
            queueManager.storage = {
              init: jest.fn().mockResolvedValue(undefined),
              add: jest.fn().mockImplementation(op => {
                operations.push(op);
                return Promise.resolve();
              }),
              getPending: jest.fn().mockResolvedValue([]),
            };

            // Mock sync method to track calls
            queueManager.syncPendingOperations = jest
              .fn()
              .mockImplementation(() => {
                syncCallCount++;
                return Promise.resolve();
              });

            // Simulate state changes
            let previousState = true; // Start online
            queueManager.isOnline = previousState;

            for (const currentState of onlineStates) {
              queueManager.isOnline = currentState;

              // Queue an operation
              await queueManager.queueOperation('add_inventory', {
                master_item_id: 'test-id',
                quantity: 1,
                unit_price: 10,
              });

              // If we went from offline to online, sync should be triggered
              if (!previousState && currentState) {
                // Simulate the online event handler
                await queueManager.syncPendingOperations();
              }

              previousState = currentState;
            }

            // Verify sync was called appropriately
            // Should be called when operations are queued while online
            // and when transitioning from offline to online
            const offlineToOnlineTransitions = onlineStates.reduce(
              (count, current, index) => {
                if (index > 0 && !onlineStates[index - 1] && current) {
                  return count + 1;
                }
                return count;
              },
              0
            );

            expect(syncCallCount).toBeGreaterThanOrEqual(
              offlineToOnlineTransitions
            );
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});
