"use client";

import { createSku } from "@/lib/api";
import { ArrowLeft, Package, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Add New SKU Page
 * Form to create a new SKU/product
 */
export default function AddSkuPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    reorder_level: 10,
    current_quantity: 0,
    unit_price: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Predefined categories for quick selection
  const suggestedCategories = [
    "Tiles",
    "Laminates",
    "Hardware",
    "Plywood",
    "Cement",
    "Paint",
    "Other",
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Basic validation
    if (!formData.name.trim() || !formData.category.trim()) {
      setError("Name and Category are required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await createSku({
        name: formData.name.trim(),
        category: formData.category.trim(),
        reorder_level: Number(formData.reorder_level) || 10,
        current_quantity: Number(formData.current_quantity) || 0,
        unit_price: Number(formData.unit_price) || 0,
      });

      setSuccess(true);

      // Redirect after brief success message
      setTimeout(() => {
        router.push("/stock");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to create SKU");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
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
          <h1 className="text-2xl font-bold text-gray-900">Add New SKU</h1>
          <p className="text-gray-600">
            Create a new product in your inventory
          </p>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="card bg-green-50 border-green-200 text-green-700 flex items-center gap-3">
          <Package className="h-6 w-6" />
          <div>
            <p className="font-medium">SKU Created Successfully!</p>
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
            placeholder="e.g., Ceramic Floor Tile 2x2 White"
            className="input"
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            Use descriptive names including size, color, and finish
          </p>
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
            placeholder="e.g., Tiles"
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Initial Quantity */}
          <div>
            <label htmlFor="current_quantity" className="label">
              Initial Quantity
            </label>
            <input
              type="number"
              id="current_quantity"
              name="current_quantity"
              value={formData.current_quantity}
              onChange={handleChange}
              min="0"
              className="input"
            />
            <p className="text-xs text-gray-500 mt-1">Current stock count</p>
          </div>

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
            disabled={loading || success}
            className="btn-primary flex items-center gap-2 flex-1 justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Create SKU
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
