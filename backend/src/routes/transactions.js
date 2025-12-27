const router = require("express").Router();
const db = require("../db/connection");

// Get all transactions
router.get("/", async (req, res) => {
  const result = await db.query(`
    SELECT t.*, s.name as sku_name, s.category as sku_category
    FROM transactions t JOIN skus s ON t.sku_id = s.id
    ORDER BY t.created_at DESC LIMIT 100
  `);
  res.json({ data: result.rows });
});

// Create transaction (and update stock)
router.post("/", async (req, res) => {
  const { sku_id, transaction_type, quantity, reason, notes } = req.body;

  // Get current stock
  const sku = (await db.query("SELECT * FROM skus WHERE id = $1", [sku_id]))
    .rows[0];

  // Calculate new quantity (PURCHASE/RETURN add, SALE/DAMAGE subtract)
  const isStockIn = ["PURCHASE", "RETURN"].includes(transaction_type);
  const newQty = isStockIn
    ? sku.current_quantity + quantity
    : sku.current_quantity - quantity;

  // Insert transaction
  const tx = await db.query(
    "INSERT INTO transactions (sku_id, transaction_type, quantity, reason, notes) VALUES ($1,$2,$3,$4,$5) RETURNING *",
    [sku_id, transaction_type, quantity, reason, notes]
  );

  // Update stock
  await db.query("UPDATE skus SET current_quantity = $1 WHERE id = $2", [
    newQty,
    sku_id,
  ]);

  res.json({ data: tx.rows[0], new_quantity: newQty });
});

module.exports = router;
