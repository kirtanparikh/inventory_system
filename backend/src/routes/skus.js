const router = require("express").Router();
const db = require("../db/connection");

// Get all SKUs (with optional filters)
router.get("/", async (req, res) => {
  const { category, search } = req.query;
  let sql = "SELECT * FROM skus WHERE 1=1";
  const params = [];

  if (category) {
    params.push(category);
    sql += ` AND category = $${params.length}`;
  }
  if (search) {
    params.push(`%${search}%`);
    sql += ` AND name ILIKE $${params.length}`;
  }

  const result = await db.query(sql + " ORDER BY name", params);
  res.json({ data: result.rows });
});

// Get categories list
router.get("/categories", async (req, res) => {
  const result = await db.query(
    "SELECT DISTINCT category FROM skus ORDER BY category"
  );
  res.json({ data: result.rows.map((r) => r.category) });
});

// Get single SKU
router.get("/:id", async (req, res) => {
  const result = await db.query("SELECT * FROM skus WHERE id = $1", [
    req.params.id,
  ]);
  res.json({ data: result.rows[0] });
});

// Create SKU
router.post("/", async (req, res) => {
  const {
    name,
    category,
    reorder_level = 10,
    current_quantity = 0,
    unit_price = 0,
  } = req.body;
  const result = await db.query(
    "INSERT INTO skus (name, category, reorder_level, current_quantity, unit_price) VALUES ($1,$2,$3,$4,$5) RETURNING *",
    [name, category, reorder_level, current_quantity, unit_price]
  );
  res.json({ data: result.rows[0] });
});

// Update SKU
router.put("/:id", async (req, res) => {
  const { name, category, reorder_level, unit_price } = req.body;
  const result = await db.query(
    "UPDATE skus SET name=$1, category=$2, reorder_level=$3, unit_price=$4 WHERE id=$5 RETURNING *",
    [name, category, reorder_level, unit_price, req.params.id]
  );
  res.json({ data: result.rows[0] });
});

// Delete SKU
router.delete("/:id", async (req, res) => {
  await db.query("DELETE FROM skus WHERE id = $1", [req.params.id]);
  res.json({ message: "Deleted" });
});

module.exports = router;
