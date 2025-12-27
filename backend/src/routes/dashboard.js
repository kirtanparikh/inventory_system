const router = require("express").Router();
const db = require("../db/connection");

// Get dashboard stats
router.get("/stats", async (req, res) => {
  // Total SKUs and stock value
  const totals = (
    await db.query(`
    SELECT COUNT(*) as total_skus, COALESCE(SUM(current_quantity * unit_price), 0) as stock_value
    FROM skus
  `)
  ).rows[0];

  // Low stock count
  const lowStock = (
    await db.query(`
    SELECT COUNT(*) as count FROM skus WHERE current_quantity <= reorder_level
  `)
  ).rows[0].count;

  // Dead stock (no sales in 90 days)
  const deadStock = (
    await db.query(`
    SELECT COUNT(*) as count, COALESCE(SUM(current_quantity * unit_price), 0) as value
    FROM skus WHERE current_quantity > 0 AND id NOT IN (
      SELECT DISTINCT sku_id FROM transactions
      WHERE transaction_type = 'SALE' AND created_at >= NOW() - INTERVAL '90 days'
    )
  `)
  ).rows[0];

  // Recent transactions
  const recent = (
    await db.query(`
    SELECT t.*, s.name as sku_name FROM transactions t
    JOIN skus s ON t.sku_id = s.id ORDER BY t.created_at DESC LIMIT 5
  `)
  ).rows;

  // Category stats
  const categories = (
    await db.query(`
    SELECT category, COUNT(*) as sku_count, SUM(current_quantity) as total_quantity,
           SUM(current_quantity * unit_price) as total_value
    FROM skus GROUP BY category ORDER BY total_value DESC
  `)
  ).rows;

  res.json({
    data: {
      overview: {
        totalSkus: parseInt(totals.total_skus),
        stockValue: Math.round(parseFloat(totals.stock_value)),
        reorderCount: parseInt(lowStock),
        outOfStock: 0,
        deadStockCount: parseInt(deadStock.count),
        deadStockValue: Math.round(parseFloat(deadStock.value)),
      },
      recentTransactions: recent,
      todayStats: [],
      categoryStats: categories,
    },
  });
});

module.exports = router;
