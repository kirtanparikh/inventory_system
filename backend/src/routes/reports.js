// Reports Routes - Analytical reports for inventory

const express = require("express");
const router = express.Router();
const db = require("../db/connection");

// GET /api/reports/dead-stock - Items with no sales in 90 days
router.get("/dead-stock", async (req, res) => {
  try {
    const deadStock = await db.all(`
      SELECT s.*,
        (s.current_quantity * s.unit_price) as stock_value,
        (
          SELECT MAX(created_at) FROM transactions
          WHERE sku_id = s.id AND transaction_type = 'SALE'
        ) as last_sale_date,
        (
          SELECT EXTRACT(DAY FROM NOW() - MAX(created_at))::INTEGER
          FROM transactions
          WHERE sku_id = s.id AND transaction_type = 'SALE'
        ) as days_since_last_sale
      FROM skus s
      WHERE s.id NOT IN (
        SELECT DISTINCT sku_id FROM transactions
        WHERE transaction_type = 'SALE'
        AND created_at >= NOW() - INTERVAL '90 days'
      )
      AND s.current_quantity > 0
      ORDER BY days_since_last_sale DESC NULLS FIRST
    `);

    const totalValue = deadStock.reduce(
      (sum, item) => sum + (parseFloat(item.stock_value) || 0),
      0
    );

    res.json({
      success: true,
      data: deadStock,
      summary: {
        count: deadStock.length,
        totalValue: Math.round(totalValue),
      },
    });
  } catch (error) {
    console.error("Error fetching dead stock:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch dead stock report" });
  }
});

// GET /api/reports/reorder - Items below reorder level
router.get("/reorder", async (req, res) => {
  try {
    const reorderItems = await db.all(`
      SELECT s.*,
        (s.reorder_level - s.current_quantity) as shortage,
        (s.reorder_level * 2) as suggested_order_qty
      FROM skus s
      WHERE s.current_quantity <= s.reorder_level
      ORDER BY
        CASE WHEN s.current_quantity = 0 THEN 0 ELSE 1 END,
        shortage DESC
    `);

    res.json({
      success: true,
      data: reorderItems,
      summary: {
        count: reorderItems.length,
        outOfStock: reorderItems.filter((i) => i.current_quantity === 0).length,
      },
    });
  } catch (error) {
    console.error("Error fetching reorder report:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch reorder report" });
  }
});

// GET /api/reports/top-selling - Most sold items
router.get("/top-selling", async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const topSelling = await db.all(
      `SELECT s.id, s.name, s.category, s.current_quantity, s.unit_price,
        COUNT(t.id) as sale_count,
        SUM(t.quantity) as total_sold,
        SUM(t.quantity * s.unit_price) as revenue
      FROM skus s
      JOIN transactions t ON s.id = t.sku_id
      WHERE t.transaction_type = 'SALE'
        AND t.created_at >= NOW() - ($1 || ' days')::INTERVAL
      GROUP BY s.id, s.name, s.category, s.current_quantity, s.unit_price
      ORDER BY total_sold DESC
      LIMIT 10`,
      [days]
    );

    res.json({
      success: true,
      data: topSelling,
      period: `Last ${days} days`,
    });
  } catch (error) {
    console.error("Error fetching top selling:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch top selling report" });
  }
});

// GET /api/reports/slow-moving - Least sold items
router.get("/slow-moving", async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const slowMoving = await db.all(
      `SELECT s.id, s.name, s.category, s.current_quantity, s.unit_price,
        (s.current_quantity * s.unit_price) as stock_value,
        COALESCE((
          SELECT SUM(quantity) FROM transactions
          WHERE sku_id = s.id
            AND created_at >= NOW() - ($1 || ' days')::INTERVAL
        ), 0) as total_movement
      FROM skus s
      WHERE s.current_quantity > 0
      ORDER BY total_movement ASC, stock_value DESC
      LIMIT 10`,
      [days]
    );

    res.json({
      success: true,
      data: slowMoving,
      period: `Last ${days} days`,
    });
  } catch (error) {
    console.error("Error fetching slow moving:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch slow moving report" });
  }
});

module.exports = router;
