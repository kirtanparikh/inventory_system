// Reports Routes - Inventory analysis

const express = require("express");
const router = express.Router();
const pool = require("../db/connection");

// GET /api/reports/dead-stock - Items with no sales in 90 days
router.get("/dead-stock", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, (s.current_quantity * s.unit_price) as stock_value,
        (SELECT MAX(created_at) FROM transactions WHERE sku_id = s.id AND transaction_type = 'SALE') as last_sale
      FROM skus s
      WHERE s.current_quantity > 0
      AND s.id NOT IN (
        SELECT DISTINCT sku_id FROM transactions
        WHERE transaction_type = 'SALE' AND created_at >= NOW() - INTERVAL '90 days'
      )
      ORDER BY stock_value DESC
    `);

    const totalValue = result.rows.reduce(
      (sum, r) => sum + parseFloat(r.stock_value || 0),
      0
    );
    res.json({
      success: true,
      data: result.rows,
      summary: {
        count: result.rows.length,
        totalValue: Math.round(totalValue),
      },
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch dead stock" });
  }
});

// GET /api/reports/reorder - Items below reorder level
router.get("/reorder", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *, (reorder_level - current_quantity) as shortage
      FROM skus WHERE current_quantity <= reorder_level
      ORDER BY current_quantity ASC, shortage DESC
    `);

    res.json({
      success: true,
      data: result.rows,
      summary: {
        count: result.rows.length,
        outOfStock: result.rows.filter((r) => r.current_quantity === 0).length,
      },
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch reorder list" });
  }
});

// GET /api/reports/top-selling
router.get("/top-selling", async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const result = await pool.query(`
      SELECT s.id, s.name, s.category, SUM(t.quantity) as total_sold
      FROM skus s JOIN transactions t ON s.id = t.sku_id
      WHERE t.transaction_type = 'SALE' AND t.created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY s.id ORDER BY total_sold DESC LIMIT 10
    `);

    res.json({ success: true, data: result.rows, period: `Last ${days} days` });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch top selling" });
  }
});

// GET /api/reports/slow-moving
router.get("/slow-moving", async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const result = await pool.query(`
      SELECT s.*, (s.current_quantity * s.unit_price) as stock_value,
        COALESCE((SELECT SUM(quantity) FROM transactions WHERE sku_id = s.id AND created_at >= NOW() - INTERVAL '${days} days'), 0) as movement
      FROM skus s WHERE s.current_quantity > 0
      ORDER BY movement ASC, stock_value DESC LIMIT 10
    `);

    res.json({ success: true, data: result.rows, period: `Last ${days} days` });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch slow moving" });
  }
});

module.exports = router;
