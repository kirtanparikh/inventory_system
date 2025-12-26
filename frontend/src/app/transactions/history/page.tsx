"use client";

import { getSkus, getTransactions } from "@/lib/api";
import type { SKU, Transaction } from "@/lib/types";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  Filter,
  Plus,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Transaction type colors and icons
 */
const TYPE_CONFIG = {
  PURCHASE: { icon: ArrowDownToLine, color: "text-green-600 bg-green-100" },
  SALE: { icon: ArrowUpFromLine, color: "text-blue-600 bg-blue-100" },
  DAMAGE: { icon: AlertTriangle, color: "text-red-600 bg-red-100" },
  RETURN: { icon: RotateCcw, color: "text-yellow-600 bg-yellow-100" },
};

/**
 * Transaction History Page
 * View all past transactions with filtering
 */
export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [skus, setSkus] = useState<SKU[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState("");
  const [skuFilter, setSkuFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, [typeFilter, skuFilter]);

  useEffect(() => {
    loadSkus();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const res = await getTransactions({
        type: typeFilter || undefined,
        sku_id: skuFilter ? Number(skuFilter) : undefined,
        limit: 100,
      });
      setTransactions(res.data);
      setError(null);
    } catch (err) {
      setError("Failed to load transactions");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadSkus() {
    try {
      const res = await getSkus();
      setSkus(res.data);
    } catch (err) {
      console.error("Failed to load SKUs:", err);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/transactions"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Transaction History
            </h1>
            <p className="text-gray-600">View all stock movements</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${
              showFilters ? "bg-gray-200" : ""
            }`}
          >
            <Filter className="h-5 w-5" />
            Filters
          </button>
          <Link
            href="/transactions"
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            New Transaction
          </Link>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="card">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Transaction Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="input"
              >
                <option value="">All Types</option>
                <option value="PURCHASE">Purchase</option>
                <option value="SALE">Sale</option>
                <option value="DAMAGE">Damage</option>
                <option value="RETURN">Return</option>
              </select>
            </div>
            <div>
              <label className="label">Product</label>
              <select
                value={skuFilter}
                onChange={(e) => setSkuFilter(e.target.value)}
                className="input"
              >
                <option value="">All Products</option>
                {skus.map((sku) => (
                  <option key={sku.id} value={sku.id}>
                    {sku.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setTypeFilter("");
                  setSkuFilter("");
                }}
                className="btn-secondary w-full"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

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
      ) : transactions.length === 0 ? (
        /* Empty State */
        <div className="card text-center py-12">
          <ArrowDownToLine className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Transactions Found
          </h3>
          <p className="text-gray-500 mb-4">
            {typeFilter || skuFilter
              ? "Try adjusting your filters"
              : "Start recording transactions to see them here"}
          </p>
          <Link
            href="/transactions"
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Record Transaction
          </Link>
        </div>
      ) : (
        /* Transactions Table */
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Type</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th className="text-right">Quantity</th>
                  <th>Reason</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const config = TYPE_CONFIG[tx.transaction_type];
                  const Icon = config.icon;
                  const isIncoming =
                    tx.transaction_type === "PURCHASE" ||
                    tx.transaction_type === "RETURN";

                  return (
                    <tr key={tx.id}>
                      <td className="whitespace-nowrap">
                        <div className="text-sm">
                          {formatDate(tx.created_at)}
                        </div>
                      </td>
                      <td>
                        <div
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.color}`}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="font-medium text-sm">
                            {tx.transaction_type}
                          </span>
                        </div>
                      </td>
                      <td className="font-medium">{tx.sku_name}</td>
                      <td>
                        <span className="badge badge-info">
                          {tx.sku_category}
                        </span>
                      </td>
                      <td className="text-right">
                        <span
                          className={`font-mono font-medium ${
                            isIncoming ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {isIncoming ? "+" : "-"}
                          {tx.quantity}
                        </span>
                      </td>
                      <td className="text-gray-600">{tx.reason || "-"}</td>
                      <td className="text-gray-500 text-sm max-w-xs truncate">
                        {tx.notes || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
            Showing {transactions.length} transaction
            {transactions.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
}
