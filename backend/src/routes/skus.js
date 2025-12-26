// SKU Routes - CRUD operations for Stock Keeping Units

const express = require("express");
const router = express.Router();
const db = require("../db/connection");

// GET /api/skus - List all SKUs with optional filtering
router.get("/", async (req, res) => {
  try {
    const { category, search, low_stock } = req.query;

    let query = "SELECT * FROM skus WHERE 1=1";
    const params = [];
    let paramIndex = 1;

    if (category) {
      query += ` AND category = $${paramIndex++}`;
      params.push(category);
    }

    if (search) {
      query += ` AND name ILIKE $${paramIndex++}`;
      params.push(`%${search}%`);
    }

    if (low_stock === "true") {
      query += " AND current_quantity <= reorder_level";
    }

    query += " ORDER BY name ASC";

    const skus = await db.all(query, params);

    res.json({
      success: true,
      data: skus,
      count: skus.length,
    });
  } catch (error) {
    console.error("Error fetching SKUs:", error);
    res.status(500).json({ success: false, error: "Failed to fetch SKUs" });
  }
});

// GET /api/skus/categories - Get list of unique categories
router.get("/categories", async (req, res) => {
  try {
    const categories = await db.all(
      "SELECT DISTINCT category FROM skus ORDER BY category"
    );
    res.json({
      success: true,
      data: categories.map((c) => c.category),
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch categories" });
  }
});

// GET /api/skus/:id - Get single SKU by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const sku = await db.get("SELECT * FROM skus WHERE id = $1", [id]);

    if (!sku) {
      return res.status(404).json({ success: false, error: "SKU not found" });
    }

    res.json({ success: true, data: sku });
  } catch (error) {
    console.error("Error fetching SKU:", error);
    res.status(500).json({ success: false, error: "Failed to fetch SKU" });
  }
});

// POST /api/skus - Create new SKU
router.post("/", async (req, res) => {
  try {
    const {
      name,
      category,
      reorder_level = 10,
      current_quantity = 0,
      unit_price = 0,
    } = req.body;

    if (!name || !category) {
      return res.status(400).json({
        success: false,
        error: "Name and category are required",
      });
    }

    const result = await db.run(
      `INSERT INTO skus (name, category, reorder_level, current_quantity, unit_price)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [name, category, reorder_level, current_quantity, unit_price]
    );

    const newSku = await db.get("SELECT * FROM skus WHERE id = $1", [
      result.id,
    ]);

    res.status(201).json({
      success: true,
      message: "SKU created successfully",
      data: newSku,
    });
  } catch (error) {
    console.error("Error creating SKU:", error);
    res.status(500).json({ success: false, error: "Failed to create SKU" });
  }
});

// PUT /api/skus/:id - Update existing SKU
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, reorder_level, unit_price } = req.body;

    const existing = await db.get("SELECT * FROM skus WHERE id = $1", [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: "SKU not found" });
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(name);
    }
    if (category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      params.push(category);
    }
    if (reorder_level !== undefined) {
      updates.push(`reorder_level = $${paramIndex++}`);
      params.push(reorder_level);
    }
    if (unit_price !== undefined) {
      updates.push(`unit_price = $${paramIndex++}`);
      params.push(unit_price);
    }

    if (updates.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "No fields to update" });
    }

    params.push(id);
    await db.run(
      `UPDATE skus SET ${updates.join(", ")} WHERE id = $${paramIndex}`,
      params
    );

    const updatedSku = await db.get("SELECT * FROM skus WHERE id = $1", [id]);

    res.json({
      success: true,
      message: "SKU updated successfully",
      data: updatedSku,
    });
  } catch (error) {
    console.error("Error updating SKU:", error);
    res.status(500).json({ success: false, error: "Failed to update SKU" });
  }
});

// DELETE /api/skus/:id - Delete SKU (only if no transactions exist)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await db.get("SELECT * FROM skus WHERE id = $1", [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: "SKU not found" });
    }

    const txCount = await db.get(
      "SELECT COUNT(*) as count FROM transactions WHERE sku_id = $1",
      [id]
    );
    if (parseInt(txCount.count) > 0) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete SKU with existing transactions",
      });
    }

    await db.run("DELETE FROM skus WHERE id = $1", [id]);

    res.json({
      success: true,
      message: "SKU deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting SKU:", error);
    res.status(500).json({ success: false, error: "Failed to delete SKU" });
  }
});

module.exports = router;
