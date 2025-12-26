// Transaction Routes - Handles stock movements

const express = require("express");
const router = express.Router();
const db = require("../db/connection");

const VALID_TYPES = ["PURCHASE", "SALE", "DAMAGE", "RETURN"];
const IN_TYPES = ["PURCHASE", "RETURN"];

// GET /api/transactions - List transactions with optional filters
router.get("/", async (req, res) => {
  try {
    const { sku_id, type, start_date, end_date, limit = 100 } = req.query;

    let query = `
      SELECT t.*, s.name as sku_name, s.category as sku_category
      FROM transactions t
      JOIN skus s ON t.sku_id = s.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (sku_id) {
      query += ` AND t.sku_id = $${paramIndex++}`;
      params.push(sku_id);
    }

    if (type) {
      query += ` AND t.transaction_type = $${paramIndex++}`;
      params.push(type);
    }

    if (start_date) {
      query += ` AND t.created_at >= $${paramIndex++}`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND t.created_at <= $${paramIndex++}`;
      params.push(end_date + " 23:59:59");
    }

    query += ` ORDER BY t.created_at DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const transactions = await db.all(query, params);

    res.json({
      success: true,
      data: transactions,
      count: transactions.length,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch transactions" });
  }
});

// POST /api/transactions - Create new transaction and update SKU quantity
router.post("/", async (req, res) => {
  try {
    const { sku_id, transaction_type, quantity, reason, notes } = req.body;

    if (!sku_id || !transaction_type || !quantity) {
      return res.status(400).json({
        success: false,
        error: "sku_id, transaction_type, and quantity are required",
      });
    }

    if (!VALID_TYPES.includes(transaction_type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid transaction type. Must be one of: ${VALID_TYPES.join(
          ", "
        )}`,
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: "Quantity must be greater than 0",
      });
    }

    const sku = await db.get("SELECT * FROM skus WHERE id = $1", [sku_id]);
    if (!sku) {
      return res.status(404).json({ success: false, error: "SKU not found" });
    }

    let newQuantity;
    if (IN_TYPES.includes(transaction_type)) {
      newQuantity = sku.current_quantity + quantity;
    } else {
      newQuantity = sku.current_quantity - quantity;
      if (newQuantity < 0) {
        console.warn(
          `Warning: SKU ${sku_id} quantity going negative (${newQuantity})`
        );
      }
    }

    const result = await db.run(
      `INSERT INTO transactions (sku_id, transaction_type, quantity, reason, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [sku_id, transaction_type, quantity, reason || null, notes || null]
    );

    await db.run("UPDATE skus SET current_quantity = $1 WHERE id = $2", [
      newQuantity,
      sku_id,
    ]);

    const newTransaction = await db.get(
      `SELECT t.*, s.name as sku_name, s.category as sku_category, s.current_quantity as new_quantity
       FROM transactions t
       JOIN skus s ON t.sku_id = s.id
       WHERE t.id = $1`,
      [result.id]
    );

    res.status(201).json({
      success: true,
      message: `${transaction_type} recorded successfully`,
      data: newTransaction,
    });
  } catch (error) {
    console.error("Error creating transaction:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to create transaction" });
  }
});

module.exports = router;
