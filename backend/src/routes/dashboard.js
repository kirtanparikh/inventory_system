// Dashboard Routes - Stats overview

const express = require("express");
const router = express.Router();
const pool = require("../db/connection");

// GET /api/dashboard/stats
router.get("/stats", async (req, res) => {
  try {
    // Basic counts
    const totalSkus = (await pool.query("SELECT COUNT(*) FROM skus")).rows[0]
      .count;
    const stockValue = (
      await pool.query(
        "SELECT COALESCE(SUM(current_quantity * unit_price), 0) as total FROM skus"
      )
    ).rows[0].total;
    const reorderCount = (
      await pool.query(
        "SELECT COUNT(*) FROM skus WHERE current_quantity <= reorder_level"
      )
    ).rows[0].count;
    const outOfStock = (
      await pool.query("SELECT COUNT(*) FROM skus WHERE current_quantity = 0")
    ).rows[0].count;

    // Dead stock (no sales in 90 days)
    const deadStock = await pool.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(current_quantity * unit_price), 0) as value
      FROM skus WHERE current_quantity > 0
      AND id NOT IN (
        SELECT DISTINCT sku_id FROM transactions
        WHERE transaction_type = 'SALE' AND created_at >= NOW() - INTERVAL '90 days'
      )
    `);

    // Recent transactions
    const recent = await pool.query(`
      SELECT t.*, s.name as sku_name, s.category as sku_category
      FROM transactions t JOIN skus s ON t.sku_id = s.id
      ORDER BY t.created_at DESC LIMIT 10
    `);

    // Category breakdown
    const categories = await pool.query(`
      SELECT category, COUNT(*) as count, SUM(current_quantity * unit_price) as value
      FROM skus GROUP BY category ORDER BY value DESC
    `);

    res.json({
      success: true,
      data: {
        overview: {
          totalSkus: parseInt(totalSkus),
          stockValue: Math.round(parseFloat(stockValue)),
          reorderCount: parseInt(reorderCount),
          outOfStock: parseInt(outOfStock),
          deadStockCount: parseInt(deadStock.rows[0].count),
          deadStockValue: Math.round(parseFloat(deadStock.rows[0].value)),
        },
        recentTransactions: recent.rows,
        categoryStats: categories.rows,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to fetch stats" });
  }
});

module.exports = router;
