// Database connection using PostgreSQL (NeonDB)
// Set DATABASE_URL in .env file

require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Simple query helpers
const db = {
  // Get single row
  get: async (sql, params = []) => {
    const result = await pool.query(sql, params);
    return result.rows[0];
  },

  // Get all rows
  all: async (sql, params = []) => {
    const result = await pool.query(sql, params);
    return result.rows;
  },

  // Run insert/update/delete and return lastID for inserts
  run: async (sql, params = []) => {
    const result = await pool.query(sql, params);
    return {
      rowCount: result.rowCount,
      lastID: result.rows[0]?.id,
    };
  },
};

module.exports = db;
