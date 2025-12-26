"use client";

import { deleteSku, getCategories, getSkus } from "@/lib/api";
import type { SKU } from "@/lib/types";
import {
  AlertTriangle,
  Edit,
  Package,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Stock List Page
 * Displays all SKUs with search, filter, and CRUD operations
 */
export default function StockPage() {
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter");

  const [skus, setSkus] = useState<SKU[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showLowStock, setShowLowStock] = useState(filterParam === "low_stock");

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, [search, categoryFilter, showLowStock]);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const res = await getSkus({
        search: search || undefined,
        category: categoryFilter || undefined,
        low_stock: showLowStock || undefined,
      });
      setSkus(res.data);
      setError(null);
    } catch (err) {
      setError("Failed to load stock data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const res = await getCategories();
      setCategories(res.data);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  }

  async function handleDelete(id: number) {
    try {
      setDeleting(true);
      await deleteSku(id);
      setDeleteId(null);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete SKU");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Inventory</h1>
          <p className="text-gray-600">Manage your SKUs and stock levels</p>
        </div>
        <Link
          href="/stock/add"
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add New SKU
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search SKUs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Category Filter */}
          <div className="w-full md:w-48">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Low Stock Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showLowStock}
              onChange={(e) => setShowLowStock(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Low Stock Only
            </span>
          </label>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="card bg-red-50 border-red-200 text-red-700">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : skus.length === 0 ? (
        /* Empty State */
        <div className="card text-center py-12">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No SKUs Found
          </h3>
          <p className="text-gray-500 mb-4">
            {search || categoryFilter || showLowStock
              ? "Try adjusting your filters"
              : "Get started by adding your first SKU"}
          </p>
          {!search && !categoryFilter && !showLowStock && (
            <Link
              href="/stock/add"
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add First SKU
            </Link>
          )}
        </div>
      ) : (
        /* Stock Table */
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th className="text-right">Quantity</th>
                  <th className="text-right">Reorder Level</th>
                  <th className="text-right">Unit Price</th>
                  <th className="text-right">Stock Value</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {skus.map((sku) => {
                  const isLowStock = sku.current_quantity <= sku.reorder_level;
                  const isOutOfStock = sku.current_quantity === 0;

                  return (
                    <tr key={sku.id}>
                      <td className="font-medium">{sku.name}</td>
                      <td>
                        <span className="badge badge-info">{sku.category}</span>
                      </td>
                      <td className="text-right font-mono">
                        {sku.current_quantity}
                      </td>
                      <td className="text-right font-mono text-gray-500">
                        {sku.reorder_level}
                      </td>
                      <td className="text-right font-mono">
                        ₹{sku.unit_price}
                      </td>
                      <td className="text-right font-mono">
                        ₹
                        {(
                          sku.current_quantity * sku.unit_price
                        ).toLocaleString()}
                      </td>
                      <td>
                        {isOutOfStock ? (
                          <span className="badge badge-danger">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="badge badge-warning">Low Stock</span>
                        ) : (
                          <span className="badge badge-success">In Stock</span>
                        )}
                      </td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/stock/${sku.id}/edit`}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => setDeleteId(sku.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
            Showing {skus.length} SKU{skus.length !== 1 ? "s" : ""} • Total
            Value: ₹
            {skus
              .reduce((sum, s) => sum + s.current_quantity * s.unit_price, 0)
              .toLocaleString()}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this SKU? This action cannot be
              undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="btn-secondary"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="btn-danger"
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
