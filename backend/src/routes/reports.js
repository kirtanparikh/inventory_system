const router = require("express").Router();
const db = require("../db/connection");

// Dead stock - items with no sales in 90 days
router.get("/dead-stock", async (req, res) => {
  const result = await db.query(`
    SELECT *, (current_quantity * unit_price) as stock_value
    FROM skus WHERE current_quantity > 0 AND id NOT IN (
      SELECT DISTINCT sku_id FROM transactions
      WHERE transaction_type = 'SALE' AND created_at >= NOW() - INTERVAL '90 days'
    ) ORDER BY stock_value DESC
  `);
  res.json({ data: result.rows });
});

// Reorder list - items below reorder level
router.get("/reorder", async (req, res) => {
  const result = await db.query(`
    SELECT *, (reorder_level - current_quantity) as shortage
    FROM skus WHERE current_quantity <= reorder_level
    ORDER BY current_quantity ASC
  `);
  res.json({ data: result.rows });
});

// Top selling items (last 30 days)
router.get("/top-selling", async (req, res) => {
  const result = await db.query(`
    SELECT s.id, s.name, s.category, SUM(t.quantity) as total_sold
    FROM skus s JOIN transactions t ON s.id = t.sku_id
    WHERE t.transaction_type = 'SALE' AND t.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY s.id ORDER BY total_sold DESC LIMIT 10
  `);
  res.json({ data: result.rows });
});

// Slow moving items
router.get("/slow-moving", async (req, res) => {
  const result = await db.query(`
    SELECT *, (current_quantity * unit_price) as stock_value
    FROM skus WHERE current_quantity > 0
    ORDER BY current_quantity DESC LIMIT 10
  `);
  res.json({ data: result.rows });
});

module.exports = router;
