// Database initialization script
// Run with: npm run init-db
// Creates tables and sample data in NeonDB

require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function initDatabase() {
  console.log("Initializing database...");

  try {
    // Create SKUs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS skus (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        reorder_level INTEGER DEFAULT 10,
        current_quantity INTEGER DEFAULT 0,
        unit_price DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Created skus table");

    // Create Transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        sku_id INTEGER NOT NULL REFERENCES skus(id),
        transaction_type TEXT NOT NULL CHECK(transaction_type IN ('PURCHASE', 'SALE', 'DAMAGE', 'RETURN')),
        quantity INTEGER NOT NULL,
        reason TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Created transactions table");

    // Check if data exists
    const countResult = await pool.query("SELECT COUNT(*) as count FROM skus");
    const count = parseInt(countResult.rows[0].count);

    if (count === 0) {
      // Insert sample SKUs
      const sampleSkus = [
        ["Ceramic Floor Tile 2x2 White", "Tiles", 50, 120, 45],
        ["Vitrified Tile 2x2 Marble Look", "Tiles", 30, 25, 85],
        ["Wall Tile 1x1 Blue Mosaic", "Tiles", 40, 8, 35],
        ["Outdoor Tile Anti-Skid Grey", "Tiles", 20, 45, 65],
        ["Sunmica Sheet White Glossy 8x4", "Laminates", 25, 60, 450],
        ["Laminate Sheet Wood Grain Oak", "Laminates", 20, 5, 520],
        ["HPL Sheet Solid Black Matte", "Laminates", 15, 30, 680],
        ["Door Handle SS Premium", "Hardware", 30, 85, 250],
        ["Cabinet Hinges Soft Close (Pair)", "Hardware", 50, 12, 120],
        ["Drawer Slide 18 inch", "Hardware", 40, 65, 180],
        ["Door Lock Mortise 3 Lever", "Hardware", 25, 3, 450],
        ["Plywood 8x4 Marine Grade", "Plywood", 10, 22, 2800],
        ["Plywood 8x4 Commercial", "Plywood", 15, 35, 1200],
        ["MDF Board 8x4 18mm", "Plywood", 20, 0, 950],
      ];

      for (const sku of sampleSkus) {
        await pool.query(
          "INSERT INTO skus (name, category, reorder_level, current_quantity, unit_price) VALUES ($1, $2, $3, $4, $5)",
          sku
        );
      }
      console.log("Inserted " + sampleSkus.length + " sample SKUs");

      // Insert sample transactions
      const sampleTransactions = [
        [
          1,
          "SALE",
          20,
          "Customer Order",
          "Sold to Sharma Contractors",
          "2024-12-25 10:30:00",
        ],
        [
          4,
          "SALE",
          10,
          "Customer Order",
          "Terrace flooring project",
          "2024-12-24 14:00:00",
        ],
        [
          8,
          "SALE",
          15,
          "Customer Order",
          "Bulk order for new building",
          "2024-12-23 11:00:00",
        ],
        [
          1,
          "PURCHASE",
          50,
          "Supplier Delivery",
          "From Kajaria - Invoice #4521",
          "2024-12-20 09:00:00",
        ],
        [
          5,
          "PURCHASE",
          30,
          "Supplier Delivery",
          "From Greenlam",
          "2024-12-18 10:00:00",
        ],
        [
          2,
          "DAMAGE",
          5,
          "Broken in Transit",
          "Cracked tiles - claim filed",
          "2024-12-22 16:00:00",
        ],
        [
          6,
          "SALE",
          2,
          "Customer Order",
          "Interior project",
          "2024-09-15 12:00:00",
        ],
        [
          7,
          "SALE",
          5,
          "Customer Order",
          "Kitchen cabinets",
          "2024-08-20 14:00:00",
        ],
      ];

      for (const tx of sampleTransactions) {
        await pool.query(
          "INSERT INTO transactions (sku_id, transaction_type, quantity, reason, notes, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
          tx
        );
      }
      console.log(
        "Inserted " + sampleTransactions.length + " sample transactions"
      );
    } else {
      console.log("Database already has data, skipping sample data");
    }

    console.log("Database initialized successfully!");
  } catch (error) {
    console.error("Error initializing database:", error.message);
  } finally {
    await pool.end();
  }
}

initDatabase();
