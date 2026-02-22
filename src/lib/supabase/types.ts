export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          business_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          business_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          business_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      master_items: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          unit: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          unit: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          unit?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'master_items_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      inventory_transactions: {
        Row: {
          id: string;
          user_id: string;
          master_item_id: string;
          transaction_type: 'add' | 'remove';
          quantity: number;
          unit_price: number;
          total_price: number;
          remaining_quantity: number;
          transaction_date: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          master_item_id: string;
          transaction_type: 'add' | 'remove';
          quantity: number;
          unit_price: number;
          total_price?: number;
          remaining_quantity?: number;
          transaction_date?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          master_item_id?: string;
          transaction_type?: 'add' | 'remove';
          quantity?: number;
          unit_price?: number;
          total_price?: number;
          remaining_quantity?: number;
          transaction_date?: string;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inventory_transactions_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inventory_transactions_master_item_id_fkey';
            columns: ['master_item_id'];
            referencedRelation: 'master_items';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_delete_master_item: {
        Args: {
          p_item_id: string;
          p_user_id: string;
        };
        Returns: boolean;
      };
      get_current_inventory: {
        Args: {
          p_user_id: string;
        };
        Returns: {
          master_item_id: string;
          name: string;
          unit: string;
          current_quantity: number;
          total_value: number;
          last_transaction_date: string | null;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
