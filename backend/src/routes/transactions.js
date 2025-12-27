// Transaction Routes - Stock movements

const express = require("express");
const router = express.Router();
const pool = require("../db/connection");

const VALID_TYPES = ["PURCHASE", "SALE", "DAMAGE", "RETURN"];
const STOCK_IN = ["PURCHASE", "RETURN"]; // Types that add stock

// GET /api/transactions - List transactions
router.get("/", async (req, res) => {
  try {
    const { sku_id, type, limit = 100 } = req.query;
    let query = `
      SELECT t.*, s.name as sku_name, s.category as sku_category
      FROM transactions t
      JOIN skus s ON t.sku_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (sku_id) {
      params.push(sku_id);
      query += ` AND t.sku_id = $${params.length}`;
    }
    if (type) {
      params.push(type);
      query += ` AND t.transaction_type = $${params.length}`;
    }

    params.push(parseInt(limit));
    query += ` ORDER BY t.created_at DESC LIMIT $${params.length}`;

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch transactions" });
  }
});

// POST /api/transactions - Create transaction & update stock
router.post("/", async (req, res) => {
  try {
    const { sku_id, transaction_type, quantity, reason, notes } = req.body;

    // Validation
    if (!sku_id || !transaction_type || !quantity) {
      return res
        .status(400)
        .json({
          success: false,
          error: "sku_id, transaction_type, quantity required",
        });
    }
    if (!VALID_TYPES.includes(transaction_type)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid transaction type" });
    }
    if (quantity <= 0) {
      return res
        .status(400)
        .json({ success: false, error: "Quantity must be > 0" });
    }

    // Get current SKU
    const skuResult = await pool.query("SELECT * FROM skus WHERE id = $1", [
      sku_id,
    ]);
    if (skuResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: "SKU not found" });
    }
    const sku = skuResult.rows[0];

    // Calculate new quantity
    const newQty = STOCK_IN.includes(transaction_type)
      ? sku.current_quantity + quantity
      : sku.current_quantity - quantity;

    // Insert transaction
    const txResult = await pool.query(
      `INSERT INTO transactions (sku_id, transaction_type, quantity, reason, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [sku_id, transaction_type, quantity, reason || null, notes || null]
    );

    // Update SKU quantity
    await pool.query("UPDATE skus SET current_quantity = $1 WHERE id = $2", [
      newQty,
      sku_id,
    ]);

    res.status(201).json({
      success: true,
      data: { ...txResult.rows[0], new_quantity: newQty },
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, error: "Failed to create transaction" });
  }
});

module.exports = router;
