// SKU Routes - CRUD operations

const express = require("express");
const router = express.Router();
const pool = require("../db/connection");

// GET /api/skus - List all SKUs
router.get("/", async (req, res) => {
  try {
    const { category, search, low_stock } = req.query;
    let query = "SELECT * FROM skus WHERE 1=1";
    const params = [];

    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND name ILIKE $${params.length}`;
    }
    if (low_stock === "true") {
      query += " AND current_quantity <= reorder_level";
    }
    query += " ORDER BY name";

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to fetch SKUs" });
  }
});

// GET /api/skus/categories
router.get("/categories", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT DISTINCT category FROM skus ORDER BY category"
    );
    res.json({ success: true, data: result.rows.map((r) => r.category) });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch categories" });
  }
});

// GET /api/skus/:id
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM skus WHERE id = $1", [
      req.params.id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "SKU not found" });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
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
      return res
        .status(400)
        .json({ success: false, error: "Name and category required" });
    }

    const result = await pool.query(
      `INSERT INTO skus (name, category, reorder_level, current_quantity, unit_price)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, category, reorder_level, current_quantity, unit_price]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to create SKU" });
  }
});

// PUT /api/skus/:id - Update SKU
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, reorder_level, unit_price } = req.body;

    // Build dynamic update query
    const fields = [];
    const values = [];
    if (name) {
      values.push(name);
      fields.push(`name = $${values.length}`);
    }
    if (category) {
      values.push(category);
      fields.push(`category = $${values.length}`);
    }
    if (reorder_level !== undefined) {
      values.push(reorder_level);
      fields.push(`reorder_level = $${values.length}`);
    }
    if (unit_price !== undefined) {
      values.push(unit_price);
      fields.push(`unit_price = $${values.length}`);
    }

    if (fields.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "No fields to update" });
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE skus SET ${fields.join(", ")} WHERE id = $${
        values.length
      } RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "SKU not found" });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to update SKU" });
  }
});

// DELETE /api/skus/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if SKU has transactions
    const txCheck = await pool.query(
      "SELECT COUNT(*) FROM transactions WHERE sku_id = $1",
      [id]
    );
    if (parseInt(txCheck.rows[0].count) > 0) {
      return res
        .status(400)
        .json({ success: false, error: "Cannot delete SKU with transactions" });
    }

    const result = await pool.query(
      "DELETE FROM skus WHERE id = $1 RETURNING id",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "SKU not found" });
    }
    res.json({ success: true, message: "SKU deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to delete SKU" });
  }
});

module.exports = router;
