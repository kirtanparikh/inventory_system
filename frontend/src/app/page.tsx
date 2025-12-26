"use client";

import {
  getDashboardStats,
  getDeadStockReport,
  getReorderReport,
} from "@/lib/api";
import type { DashboardStats, DeadStockItem, ReorderItem } from "@/lib/types";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRightLeft,
  Clock,
  DollarSign,
  Package,
  PackageX,
  TrendingDown,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Dashboard Page
 * Main landing page showing inventory overview, alerts, and recent activity
 */
export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reorderItems, setReorderItems] = useState<ReorderItem[]>([]);
  const [deadStock, setDeadStock] = useState<DeadStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [statsRes, reorderRes, deadStockRes] = await Promise.all([
          getDashboardStats(),
          getReorderReport(),
          getDeadStockReport(),
        ]);

        setStats(statsRes.data);
        setReorderItems(reorderRes.data.slice(0, 5)); // Top 5 reorder items
        setDeadStock(deadStockRes.data.slice(0, 5)); // Top 5 dead stock
      } catch (err) {
        setError("Failed to load dashboard. Make sure the backend is running.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-red-50 border-red-200">
        <div className="flex items-center space-x-3 text-red-700">
          <AlertCircle className="h-6 w-6" />
          <div>
            <h3 className="font-semibold">Connection Error</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const { overview, recentTransactions, categoryStats } = stats!;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Inventory overview and alerts</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total SKUs"
          value={overview.totalSkus}
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Stock Value"
          value={`₹${overview.stockValue.toLocaleString()}`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Reorder Needed"
          value={overview.reorderCount}
          icon={AlertTriangle}
          color="yellow"
          highlight={overview.reorderCount > 0}
        />
        <StatCard
          title="Dead Stock"
          value={overview.deadStockCount}
          icon={TrendingDown}
          color="red"
          highlight={overview.deadStockCount > 0}
        />
      </div>

      {/* Alerts Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Reorder Alerts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Reorder Alerts
            </h2>
            <Link
              href="/stock?filter=low_stock"
              className="text-blue-600 text-sm hover:underline"
            >
              View All
            </Link>
          </div>

          {reorderItems.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No items need reordering 👍
            </p>
          ) : (
            <div className="space-y-3">
              {reorderItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      Stock: {item.current_quantity} / Min: {item.reorder_level}
                    </p>
                  </div>
                  <span
                    className={`badge ${
                      item.current_quantity === 0
                        ? "badge-danger"
                        : "badge-warning"
                    }`}
                  >
                    {item.current_quantity === 0 ? "Out of Stock" : "Low Stock"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dead Stock Warning */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <PackageX className="h-5 w-5 text-red-500" />
              Dead Stock (90+ days)
            </h2>
            <span className="text-sm text-gray-500">
              Value: ₹{overview.deadStockValue.toLocaleString()}
            </span>
          </div>

          {deadStock.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No dead stock detected 🎉
            </p>
          ) : (
            <div className="space-y-3">
              {deadStock.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      Qty: {item.current_quantity} • Value: ₹
                      {Math.round(item.stock_value).toLocaleString()}
                    </p>
                  </div>
                  <span className="badge badge-danger">
                    {item.days_since_last_sale
                      ? `${item.days_since_last_sale} days`
                      : "Never sold"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Overview & Recent Transactions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Category Stats */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Stock by Category</h2>
          <div className="space-y-3">
            {categoryStats.map((cat) => (
              <div
                key={cat.category}
                className="flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">{cat.category}</p>
                  <p className="text-sm text-gray-500">{cat.sku_count} items</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    ₹{Math.round(cat.total_value).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {cat.total_quantity} units
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-400" />
              Recent Transactions
            </h2>
            <Link
              href="/transactions/history"
              className="text-blue-600 text-sm hover:underline"
            >
              View All
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No transactions yet
            </p>
          ) : (
            <div className="space-y-3">
              {recentTransactions.slice(0, 5).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <TransactionIcon type={tx.transaction_type} />
                    <div>
                      <p className="font-medium text-sm">{tx.sku_name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-medium ${
                        tx.transaction_type === "PURCHASE" ||
                        tx.transaction_type === "RETURN"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {tx.transaction_type === "PURCHASE" ||
                      tx.transaction_type === "RETURN"
                        ? "+"
                        : "-"}
                      {tx.quantity}
                    </span>
                    <p className="text-xs text-gray-500">
                      {tx.transaction_type}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/stock/add"
            className="bg-white/20 hover:bg-white/30 rounded-lg p-4 text-center transition-colors"
          >
            <Package className="h-8 w-8 mx-auto mb-2" />
            <span className="font-medium">Add SKU</span>
          </Link>
          <Link
            href="/transactions?type=PURCHASE"
            className="bg-white/20 hover:bg-white/30 rounded-lg p-4 text-center transition-colors"
          >
            <ArrowRightLeft className="h-8 w-8 mx-auto mb-2" />
            <span className="font-medium">Record Purchase</span>
          </Link>
          <Link
            href="/transactions?type=SALE"
            className="bg-white/20 hover:bg-white/30 rounded-lg p-4 text-center transition-colors"
          >
            <TrendingDown className="h-8 w-8 mx-auto mb-2" />
            <span className="font-medium">Record Sale</span>
          </Link>
          <Link
            href="/transactions/history"
            className="bg-white/20 hover:bg-white/30 rounded-lg p-4 text-center transition-colors"
          >
            <Clock className="h-8 w-8 mx-auto mb-2" />
            <span className="font-medium">View History</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Helper Components

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  highlight = false,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: "blue" | "green" | "yellow" | "red";
  highlight?: boolean;
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    yellow: "bg-yellow-100 text-yellow-600",
    red: "bg-red-100 text-red-600",
  };

  return (
    <div className={`card ${highlight ? "ring-2 ring-yellow-400" : ""}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function TransactionIcon({ type }: { type: string }) {
  const classes = {
    PURCHASE: "bg-green-100 text-green-600",
    SALE: "bg-blue-100 text-blue-600",
    DAMAGE: "bg-red-100 text-red-600",
    RETURN: "bg-yellow-100 text-yellow-600",
  };

  return (
    <div className={`p-2 rounded-lg ${classes[type as keyof typeof classes]}`}>
      <ArrowRightLeft className="h-4 w-4" />
    </div>
  );
}
