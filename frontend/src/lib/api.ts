/**
 * API utility functions
 * Centralized API calls to the Express backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "API request failed");
  }

  return data;
}

// ============ SKU APIs ============

export async function getSkus(params?: {
  category?: string;
  search?: string;
  low_stock?: boolean;
}) {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.set("category", params.category);
  if (params?.search) searchParams.set("search", params.search);
  if (params?.low_stock) searchParams.set("low_stock", "true");

  const query = searchParams.toString();
  return fetchAPI(`/skus${query ? `?${query}` : ""}`);
}

export async function getSku(id: number) {
  return fetchAPI(`/skus/${id}`);
}

export async function createSku(data: {
  name: string;
  category: string;
  reorder_level?: number;
  current_quantity?: number;
  unit_price?: number;
}) {
  return fetchAPI("/skus", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateSku(
  id: number,
  data: Partial<{
    name: string;
    category: string;
    reorder_level: number;
    unit_price: number;
  }>
) {
  return fetchAPI(`/skus/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteSku(id: number) {
  return fetchAPI(`/skus/${id}`, {
    method: "DELETE",
  });
}

export async function getCategories() {
  return fetchAPI("/skus/categories");
}

// ============ Transaction APIs ============

export async function getTransactions(params?: {
  sku_id?: number;
  type?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.sku_id) searchParams.set("sku_id", params.sku_id.toString());
  if (params?.type) searchParams.set("type", params.type);
  if (params?.start_date) searchParams.set("start_date", params.start_date);
  if (params?.end_date) searchParams.set("end_date", params.end_date);
  if (params?.limit) searchParams.set("limit", params.limit.toString());

  const query = searchParams.toString();
  return fetchAPI(`/transactions${query ? `?${query}` : ""}`);
}

export async function createTransaction(data: {
  sku_id: number;
  transaction_type: "PURCHASE" | "SALE" | "DAMAGE" | "RETURN";
  quantity: number;
  reason?: string;
  notes?: string;
}) {
  return fetchAPI("/transactions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ============ Dashboard APIs ============

export async function getDashboardStats() {
  return fetchAPI("/dashboard/stats");
}

// ============ Report APIs ============

export async function getDeadStockReport() {
  return fetchAPI("/reports/dead-stock");
}

export async function getReorderReport() {
  return fetchAPI("/reports/reorder");
}

export async function getTopSellingReport(days: number = 30) {
  return fetchAPI(`/reports/top-selling?days=${days}`);
}

export async function getSlowMovingReport(days: number = 30) {
  return fetchAPI(`/reports/slow-moving?days=${days}`);
}
