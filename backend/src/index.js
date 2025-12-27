// Inventory Management System - Express Backend

require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/skus", require("./routes/skus"));
app.use("/api/transactions", require("./routes/transactions"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/reports", require("./routes/reports"));

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Root - API info
app.get("/", (req, res) =>
  res.json({ name: "Inventory API", version: "1.0.0" })
);

// 404 handler
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Start server
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);

module.exports = app;
