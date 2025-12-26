"use client";

import { createTransaction, getSkus } from "@/lib/api";
import type { SKU } from "@/lib/types";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  Package,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

/**
 * Transaction Types with their properties
 */
const TRANSACTION_TYPES = {
  PURCHASE: {
    label: "Purchase",
    description: "Stock received from supplier",
    icon: ArrowDownToLine,
    color: "green",
    reasons: ["Supplier Delivery", "Bulk Order", "Restock", "Other"],
  },
  SALE: {
    label: "Sale",
    description: "Stock sold to customer",
    icon: ArrowUpFromLine,
    color: "blue",
    reasons: ["Customer Order", "Retail Sale", "Wholesale", "Other"],
  },
  DAMAGE: {
    label: "Damage",
    description: "Stock damaged/lost",
    icon: AlertTriangle,
    color: "red",
    reasons: [
      "Broken in Transit",
      "Storage Damage",
      "Defective",
      "Theft",
      "Other",
    ],
  },
  RETURN: {
    label: "Return",
    description: "Customer return to stock",
    icon: RotateCcw,
    color: "yellow",
    reasons: ["Customer Return", "Wrong Item", "Quality Issue", "Other"],
  },
};

type TransactionType = keyof typeof TRANSACTION_TYPES;

function TransactionsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedType = searchParams.get("type") as TransactionType | null;

  const [skus, setSkus] = useState<SKU[]>([]);
  const [selectedType, setSelectedType] = useState<TransactionType | null>(
    preselectedType && TRANSACTION_TYPES[preselectedType]
      ? preselectedType
      : null
  );

  const [formData, setFormData] = useState({
    sku_id: "",
    quantity: 1,
    reason: "",
    notes: "",
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    type: string;
    sku: string;
    quantity: number;
  } | null>(null);

  // Load SKUs for dropdown
  useEffect(() => {
    async function loadSkus() {
      try {
        const res = await getSkus();
        setSkus(res.data);
      } catch (err) {
        console.error("Failed to load SKUs:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSkus();
  }, []);

  // Get selected SKU details
  const selectedSku = skus.find((s) => s.id === Number(formData.sku_id));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedType) {
      setError("Please select a transaction type");
      return;
    }

    if (!formData.sku_id) {
      setError("Please select a product");
      return;
    }

    if (formData.quantity < 1) {
      setError("Quantity must be at least 1");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await createTransaction({
        sku_id: Number(formData.sku_id),
        transaction_type: selectedType,
        quantity: Number(formData.quantity),
        reason: formData.reason || undefined,
        notes: formData.notes || undefined,
      });

      setSuccess({
        type: selectedType,
        sku: selectedSku?.name || "",
        quantity: formData.quantity,
      });

      // Reset form
      setFormData({
        sku_id: "",
        quantity: 1,
        reason: "",
        notes: "",
      });
      setSelectedType(null);

      // Clear success after delay
      setTimeout(() => {
        setSuccess(null);
      }, 4000);
    } catch (err: any) {
      setError(err.message || "Failed to record transaction");
    } finally {
      setSubmitting(false);
    }
  }

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Record Transaction
          </h1>
          <p className="text-gray-600">
            Log stock movements (purchase, sale, damage, return)
          </p>
        </div>
        <Link href="/transactions/history" className="btn-secondary">
          View History
        </Link>
      </div>

      {/* Success Message */}
      {success && (
        <div className="card bg-green-50 border-green-200 text-green-700 flex items-center gap-3">
          <div className="bg-green-100 p-2 rounded-full">
            <Check className="h-6 w-6" />
          </div>
          <div>
            <p className="font-medium">Transaction Recorded!</p>
            <p className="text-sm">
              {success.type}: {success.quantity} units of {success.sku}
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="card bg-red-50 border-red-200 text-red-700">
          {error}
        </div>
      )}

      {/* Step 1: Select Transaction Type */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">
          Step 1: Select Transaction Type
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(TRANSACTION_TYPES).map(([type, config]) => {
            const Icon = config.icon;
            const isSelected = selectedType === type;

            const colorClasses = {
              green: isSelected
                ? "bg-green-100 border-green-500 text-green-700"
                : "hover:bg-green-50 hover:border-green-300",
              blue: isSelected
                ? "bg-blue-100 border-blue-500 text-blue-700"
                : "hover:bg-blue-50 hover:border-blue-300",
              red: isSelected
                ? "bg-red-100 border-red-500 text-red-700"
                : "hover:bg-red-50 hover:border-red-300",
              yellow: isSelected
                ? "bg-yellow-100 border-yellow-500 text-yellow-700"
                : "hover:bg-yellow-50 hover:border-yellow-300",
            };

            return (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setSelectedType(type as TransactionType);
                  setFormData((prev) => ({ ...prev, reason: "" }));
                }}
                className={`p-4 rounded-xl border-2 transition-all text-center ${
                  colorClasses[config.color as keyof typeof colorClasses]
                } ${isSelected ? "" : "border-gray-200"}`}
              >
                <Icon
                  className={`h-8 w-8 mx-auto mb-2 ${
                    isSelected ? "" : "text-gray-400"
                  }`}
                />
                <p className="font-medium">{config.label}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {config.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Fill Details (only show if type selected) */}
      {selectedType && (
        <form onSubmit={handleSubmit} className="card space-y-6">
          <h2 className="text-lg font-semibold">Step 2: Enter Details</h2>

          {/* Product Selection */}
          <div>
            <label htmlFor="sku_id" className="label">
              Select Product <span className="text-red-500">*</span>
            </label>
            <select
              id="sku_id"
              name="sku_id"
              value={formData.sku_id}
              onChange={handleChange}
              className="input"
              required
            >
              <option value="">-- Select Product --</option>
              {skus.map((sku) => (
                <option key={sku.id} value={sku.id}>
                  {sku.name} ({sku.category}) - Stock: {sku.current_quantity}
                </option>
              ))}
            </select>

            {/* Show current stock for selected SKU */}
            {selectedSku && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg flex items-center gap-3">
                <Package className="h-5 w-5 text-gray-400" />
                <div className="text-sm">
                  <span className="font-medium">Current Stock:</span>{" "}
                  <span
                    className={
                      selectedSku.current_quantity <= selectedSku.reorder_level
                        ? "text-yellow-600"
                        : "text-green-600"
                    }
                  >
                    {selectedSku.current_quantity} units
                  </span>
                  {selectedType === "SALE" || selectedType === "DAMAGE" ? (
                    <span className="text-gray-500 ml-2">
                      → After:{" "}
                      {selectedSku.current_quantity - Number(formData.quantity)}{" "}
                      units
                    </span>
                  ) : (
                    <span className="text-gray-500 ml-2">
                      → After:{" "}
                      {selectedSku.current_quantity + Number(formData.quantity)}{" "}
                      units
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label htmlFor="quantity" className="label">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              className="input"
              required
            />
          </div>

          {/* Reason */}
          <div>
            <label htmlFor="reason" className="label">
              Reason
            </label>
            <select
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              className="input"
            >
              <option value="">-- Select Reason --</option>
              {TRANSACTION_TYPES[selectedType].reasons.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="label">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              placeholder="Invoice number, customer name, etc."
              className="input resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex items-center gap-2 flex-1 justify-center"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Recording...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  Record {TRANSACTION_TYPES[selectedType].label}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setSelectedType(null)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* No Type Selected */}
      {!selectedType && (
        <div className="card text-center py-8 text-gray-500">
          <p>Select a transaction type above to continue</p>
        </div>
      )}
    </div>
  );
}

/**
 * New Transactions Page
 * Log stock movements (purchases, sales, damages, returns)
 */
export default function TransactionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <TransactionsPageContent />
    </Suspense>
  );
}
