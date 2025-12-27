// Database connection - PostgreSQL (NeonDB)

require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Simple query helper - just use pool.query directly
module.exports = pool;
