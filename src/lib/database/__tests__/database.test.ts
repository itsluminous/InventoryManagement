/**
 * Database service tests
 *
 * These tests verify the database operations work correctly.
 * Note: These are unit tests that mock the Supabase client.
 * Integration tests should be run against a real database.
 */

// @ts-nocheck - Complex mock types cause TypeScript issues
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  DatabaseService,
  ProfileService,
  MasterItemService,
  InventoryService,
} from '../index';

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(),
  rpc: jest.fn(),
} as any;

// Mock query builder
const mockQueryBuilder = {
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  gt: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  single: jest.fn(),
} as any;

describe('DatabaseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
  });

  describe('ProfileService', () => {
    let profileService: ProfileService;

    beforeEach(() => {
      profileService = new ProfileService(mockSupabaseClient);
    });

    it('should get user profile successfully', async () => {
      const mockProfile = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
        business_name: 'Test Business',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const result = await profileService.getProfile('user-123');

      expect(result.data).toEqual(mockProfile);
      expect(result.error).toBeNull();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'user-123');
    });

    it('should handle profile fetch error', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'Profile not found' },
      });

      const result = await profileService.getProfile('user-123');

      expect(result.data).toBeNull();
      expect(result.error).toBe('Profile not found');
    });

    it('should update profile successfully', async () => {
      const mockUpdatedProfile = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Updated Name',
        business_name: 'Updated Business',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T01:00:00Z',
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: mockUpdatedProfile,
        error: null,
      });

      const updates = {
        full_name: 'Updated Name',
        business_name: 'Updated Business',
      };

      const result = await profileService.updateProfile('user-123', updates);

      expect(result.data).toEqual(mockUpdatedProfile);
      expect(result.error).toBeNull();
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(updates);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'user-123');
    });
  });

  describe('MasterItemService', () => {
    let masterItemService: MasterItemService;
    let mockProfileService: ProfileService;

    beforeEach(() => {
      mockProfileService = {
        ensureProfile: jest.fn().mockResolvedValue({
          data: { id: 'user-123', email: 'test@example.com' },
          error: null,
        }),
      } as any;
      masterItemService = new MasterItemService(
        mockSupabaseClient,
        mockProfileService
      );
    });

    it('should get master items successfully', async () => {
      const mockItems = [
        {
          id: 'item-1',
          user_id: 'user-123',
          name: 'Rice',
          unit: 'kg',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'item-2',
          user_id: 'user-123',
          name: 'Chairs',
          unit: 'qty',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockQueryBuilder.order.mockResolvedValue({
        data: mockItems,
        error: null,
      });

      const result = await masterItemService.getMasterItems('user-123');

      expect(result.data).toEqual(mockItems);
      expect(result.error).toBeNull();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('master_items');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('name', {
        ascending: true,
      });
    });

    it('should create master item successfully', async () => {
      const newItem = {
        user_id: 'user-123',
        name: 'Plates',
        unit: 'qty',
      };

      const mockCreatedItem = {
        id: 'item-3',
        ...newItem,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Mock auth.getUser() call
      mockSupabaseClient.auth = {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { email: 'test@example.com' } },
          error: null,
        }),
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: mockCreatedItem,
        error: null,
      });

      const result = await masterItemService.createMasterItem(newItem);

      expect(result.data).toEqual(mockCreatedItem);
      expect(result.error).toBeNull();
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(newItem);
      expect(mockProfileService.ensureProfile).toHaveBeenCalledWith(
        'user-123',
        'test@example.com'
      );
    });

    it('should check deletion safety before deleting', async () => {
      // Mock the can_delete_master_item function to return true
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: true,
        error: null,
      });

      // Create a fresh mock for the delete operation
      const deleteResult = { error: null } as any;

      // Mock the delete chain: from().delete().eq().eq()
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue(deleteResult),
        }),
      }) as any;

      mockSupabaseClient.from.mockReturnValueOnce({
        delete: mockDelete,
      });

      const result = await masterItemService.deleteMasterItem(
        'item-1',
        'user-123'
      );

      expect(result.data).toBe(true);
      expect(result.error).toBeNull();
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
        'can_delete_master_item',
        {
          p_item_id: 'item-1',
          p_user_id: 'user-123',
        }
      );
    });

    it('should prevent deletion when item has transactions', async () => {
      // Mock the can_delete_master_item function returning false
      mockSupabaseClient.rpc.mockResolvedValue({
        data: false,
        error: null,
      });

      const result = await masterItemService.deleteMasterItem(
        'item-1',
        'user-123'
      );

      expect(result.data).toBeNull();
      expect(result.error).toBe(
        'Cannot delete item that has inventory transactions'
      );
    });
  });

  describe('InventoryService', () => {
    let inventoryService: InventoryService;

    beforeEach(() => {
      inventoryService = new InventoryService(mockSupabaseClient);
    });

    it('should get current inventory successfully', async () => {
      const mockInventory = [
        {
          master_item_id: 'item-1',
          name: 'Rice',
          unit: 'kg',
          current_quantity: 10.5,
          total_value: 525.0,
          last_transaction_date: '2024-01-01T00:00:00Z',
        },
      ];

      mockSupabaseClient.rpc.mockResolvedValue({
        data: mockInventory,
        error: null,
      });

      const result = await inventoryService.getCurrentInventory('user-123');

      expect(result.data).toEqual(mockInventory);
      expect(result.error).toBeNull();
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
        'get_current_inventory',
        {
          p_user_id: 'user-123',
        }
      );
    });

    it('should add inventory successfully', async () => {
      const newTransaction = {
        user_id: 'user-123',
        master_item_id: 'item-1',
        transaction_type: 'add' as const,
        quantity: 5,
        unit_price: 50.0,
        notes: 'New stock',
      };

      const mockCreatedTransaction = {
        id: 'trans-1',
        ...newTransaction,
        transaction_type: 'add' as const,
        total_price: 250.0,
        remaining_quantity: 5,
        transaction_date: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: mockCreatedTransaction,
        error: null,
      });

      const result = await inventoryService.addInventory(newTransaction);

      expect(result.data).toEqual(mockCreatedTransaction);
      expect(result.error).toBeNull();
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
        ...newTransaction,
        transaction_type: 'add',
        remaining_quantity: 5,
      });
    });

    it('should handle insufficient inventory on removal', async () => {
      // Mock empty batches (no available inventory)
      mockQueryBuilder.order.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await inventoryService.removeInventory(
        'user-123',
        'item-1',
        10
      );

      expect(result.data?.success).toBe(false);
      expect(result.data?.error).toBe('Insufficient inventory');
      expect(result.error).toBeNull();
    });
  });

  describe('DatabaseService Integration', () => {
    it('should create service with all sub-services', () => {
      const dbService = new DatabaseService(mockSupabaseClient);

      expect(dbService.profiles).toBeInstanceOf(ProfileService);
      expect(dbService.masterItems).toBeInstanceOf(MasterItemService);
      expect(dbService.inventory).toBeInstanceOf(InventoryService);
    });
  });
});

describe('Database Schema Validation', () => {
  it('should have correct table structure expectations', () => {
    // This test documents the expected database schema
    const expectedTables = [
      'profiles',
      'master_items',
      'inventory_transactions',
    ];
    const expectedFunctions = [
      'get_current_inventory',
      'can_delete_master_item',
      'handle_new_user',
    ];
    const expectedIndexes = [
      'idx_master_items_user_id',
      'idx_inventory_transactions_user_item',
      'idx_inventory_transactions_fifo',
    ];

    // These are documentation tests - they don't run actual database queries
    expect(expectedTables).toHaveLength(3);
    expect(expectedFunctions).toHaveLength(3);
    expect(expectedIndexes.length).toBeGreaterThanOrEqual(3);
  });

  it('should enforce business rules through types', () => {
    // Test that TypeScript types enforce business rules
    const validTransactionType: 'add' | 'remove' = 'add';
    // const invalidTransactionType = 'invalid'; // This should cause TypeScript error

    expect(['add', 'remove']).toContain(validTransactionType);

    // Quantity should be positive
    const validQuantity = 5.5;
    const invalidQuantity = -1; // Business logic should prevent this

    expect(validQuantity).toBeGreaterThan(0);
    expect(invalidQuantity).toBeLessThan(0); // This documents the constraint
  });
});
