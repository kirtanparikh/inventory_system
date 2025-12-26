"use client";

import { getSku, updateSku } from "@/lib/api";
import type { SKU } from "@/lib/types";
import { ArrowLeft, Package, Save } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

/**
 * Edit SKU Page
 * Form to update an existing SKU's details
 * Note: Quantity can only be changed through transactions
 */
export default function EditSkuPage() {
  const router = useRouter();
  const params = useParams();
  const skuId = Number(params.id);

  const [sku, setSku] = useState<SKU | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    reorder_level: 10,
    unit_price: 0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Predefined categories
  const suggestedCategories = [
    "Tiles",
    "Laminates",
    "Hardware",
    "Plywood",
    "Cement",
    "Paint",
    "Other",
  ];

  // Load SKU data
  useEffect(() => {
    async function loadSku() {
      try {
        const res = await getSku(skuId);
        setSku(res.data);
        setFormData({
          name: res.data.name,
          category: res.data.category,
          reorder_level: res.data.reorder_level,
          unit_price: res.data.unit_price,
        });
      } catch (err: any) {
        setError("SKU not found");
      } finally {
        setLoading(false);
      }
    }

    loadSku();
  }, [skuId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name.trim() || !formData.category.trim()) {
      setError("Name and Category are required");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await updateSku(skuId, {
        name: formData.name.trim(),
        category: formData.category.trim(),
        reorder_level: Number(formData.reorder_level) || 10,
        unit_price: Number(formData.unit_price) || 0,
      });

      setSuccess(true);

      setTimeout(() => {
        router.push("/stock");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to update SKU");
    } finally {
      setSaving(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!sku && !loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card bg-red-50 border-red-200 text-red-700">
          <h3 className="font-semibold">SKU Not Found</h3>
          <p className="mt-1">The requested SKU does not exist.</p>
          <Link href="/stock" className="btn-primary mt-4 inline-block">
            Back to Stock List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/stock"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit SKU</h1>
          <p className="text-gray-600">Update product details</p>
        </div>
      </div>

      {/* Current Stock Info */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-center gap-3 text-blue-700">
          <Package className="h-6 w-6" />
          <div>
            <p className="font-medium">
              Current Stock: {sku?.current_quantity} units
            </p>
            <p className="text-sm">
              To change quantity, use the{" "}
              <Link href="/transactions" className="underline">
                Transactions
              </Link>{" "}
              page to record purchases or sales.
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="card bg-green-50 border-green-200 text-green-700 flex items-center gap-3">
          <Package className="h-6 w-6" />
          <div>
            <p className="font-medium">SKU Updated Successfully!</p>
            <p className="text-sm">Redirecting to stock list...</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="card bg-red-50 border-red-200 text-red-700">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Name */}
        <div>
          <label htmlFor="name" className="label">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="input"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="label">
            Category <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="input"
            list="category-suggestions"
            required
          />
          <datalist id="category-suggestions">
            {suggestedCategories.map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
          <div className="flex flex-wrap gap-2 mt-2">
            {suggestedCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, category: cat }))
                }
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  formData.category === cat
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Number Fields Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Reorder Level */}
          <div>
            <label htmlFor="reorder_level" className="label">
              Reorder Level
            </label>
            <input
              type="number"
              id="reorder_level"
              name="reorder_level"
              value={formData.reorder_level}
              onChange={handleChange}
              min="0"
              className="input"
            />
            <p className="text-xs text-gray-500 mt-1">
              Alert when stock falls below
            </p>
          </div>

          {/* Unit Price */}
          <div>
            <label htmlFor="unit_price" className="label">
              Unit Price (₹)
            </label>
            <input
              type="number"
              id="unit_price"
              name="unit_price"
              value={formData.unit_price}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="input"
            />
            <p className="text-xs text-gray-500 mt-1">Price per unit</p>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={saving || success}
            className="btn-primary flex items-center gap-2 flex-1 justify-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Update SKU
              </>
            )}
          </button>
          <Link href="/stock" className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
