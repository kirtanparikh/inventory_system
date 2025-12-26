/**
 * TypeScript type definitions for the application
 */

export interface SKU {
  id: number;
  name: string;
  category: string;
  reorder_level: number;
  current_quantity: number;
  unit_price: number;
  created_at: string;
}

export interface Transaction {
  id: number;
  sku_id: number;
  transaction_type: "PURCHASE" | "SALE" | "DAMAGE" | "RETURN";
  quantity: number;
  reason: string | null;
  notes: string | null;
  created_at: string;
  sku_name?: string;
  sku_category?: string;
}

export interface DashboardStats {
  overview: {
    totalSkus: number;
    stockValue: number;
    reorderCount: number;
    outOfStock: number;
    deadStockCount: number;
    deadStockValue: number;
  };
  recentTransactions: Transaction[];
  todayStats: {
    transaction_type: string;
    count: number;
    total_quantity: number;
  }[];
  categoryStats: {
    category: string;
    sku_count: number;
    total_quantity: number;
    total_value: number;
  }[];
}

export interface DeadStockItem extends SKU {
  stock_value: number;
  last_sale_date: string | null;
  days_since_last_sale: number | null;
}

export interface ReorderItem extends SKU {
  shortage: number;
  suggested_order_qty: number;
}

export interface TopSellingItem {
  id: number;
  name: string;
  category: string;
  current_quantity: number;
  unit_price: number;
  sale_count: number;
  total_sold: number;
  revenue: number;
}

export interface SlowMovingItem {
  id: number;
  name: string;
  category: string;
  current_quantity: number;
  unit_price: number;
  stock_value: number;
  total_movement: number;
}
