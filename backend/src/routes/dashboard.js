// Dashboard Routes - Aggregated stats

const express = require("express");
const router = express.Router();
const db = require("../db/connection");

// GET /api/dashboard/stats - Returns dashboard statistics
router.get("/stats", async (req, res) => {
  try {
    const totalSkus = (await db.get("SELECT COUNT(*) as count FROM skus"))
      .count;

    const stockValue = (
      await db.get(
        "SELECT COALESCE(SUM(current_quantity * unit_price), 0) as total FROM skus"
      )
    ).total;

    const reorderCount = (
      await db.get(
        "SELECT COUNT(*) as count FROM skus WHERE current_quantity <= reorder_level"
      )
    ).count;

    const outOfStock = (
      await db.get(
        "SELECT COUNT(*) as count FROM skus WHERE current_quantity = 0"
      )
    ).count;

    // Dead stock: SKUs with no SALE in last 90 days that still have stock
    const deadStockCount = (
      await db.get(`
        SELECT COUNT(*) as count FROM skus s
        WHERE s.id NOT IN (
          SELECT DISTINCT sku_id FROM transactions
          WHERE transaction_type = 'SALE'
          AND created_at >= NOW() - INTERVAL '90 days'
        )
        AND s.current_quantity > 0
      `)
    ).count;

    const deadStockValue = (
      await db.get(`
        SELECT COALESCE(SUM(current_quantity * unit_price), 0) as total FROM skus s
        WHERE s.id NOT IN (
          SELECT DISTINCT sku_id FROM transactions
          WHERE transaction_type = 'SALE'
          AND created_at >= NOW() - INTERVAL '90 days'
        )
        AND s.current_quantity > 0
      `)
    ).total;

    const recentTransactions = await db.all(`
      SELECT t.*, s.name as sku_name, s.category as sku_category
      FROM transactions t
      JOIN skus s ON t.sku_id = s.id
      ORDER BY t.created_at DESC
      LIMIT 10
    `);

    const todayStats = await db.all(`
      SELECT transaction_type, COUNT(*) as count, SUM(quantity) as total_quantity
      FROM transactions
      WHERE DATE(created_at) = CURRENT_DATE
      GROUP BY transaction_type
    `);

    const categoryStats = await db.all(`
      SELECT category, COUNT(*) as sku_count, SUM(current_quantity) as total_quantity,
             SUM(current_quantity * unit_price) as total_value
      FROM skus
      GROUP BY category
      ORDER BY total_value DESC
    `);

    res.json({
      success: true,
      data: {
        overview: {
          totalSkus: parseInt(totalSkus),
          stockValue: Math.round(parseFloat(stockValue) || 0),
          reorderCount: parseInt(reorderCount),
          outOfStock: parseInt(outOfStock),
          deadStockCount: parseInt(deadStockCount),
          deadStockValue: Math.round(parseFloat(deadStockValue) || 0),
        },
        recentTransactions,
        todayStats,
        categoryStats,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch dashboard stats" });
  }
});

module.exports = router;
