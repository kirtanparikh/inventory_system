// Inventory Management System - Express Backend

require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Import routes
const skuRoutes = require("./routes/skus");
const transactionRoutes = require("./routes/transactions");
const dashboardRoutes = require("./routes/dashboard");
const reportRoutes = require("./routes/reports");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use("/api/skus", skuRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Inventory API is running",
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    name: "Inventory Management API",
    version: "1.0.0",
    endpoints: {
      health: "GET /api/health",
      skus: "GET/POST /api/skus",
      transactions: "GET/POST /api/transactions",
      dashboard: "GET /api/dashboard/stats",
      reports: {
        deadStock: "GET /api/reports/dead-stock",
        reorder: "GET /api/reports/reorder",
        topSelling: "GET /api/reports/top-selling",
        slowMoving: "GET /api/reports/slow-moving",
      },
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    path: req.path,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

// Start server
app.listen(PORT, () => {
  console.log("");
  console.log("=".repeat(44));
  console.log("  Inventory Management System API");
  console.log("=".repeat(44));
  console.log(`  Server running on port ${PORT}`);
  console.log(`  http://localhost:${PORT}`);
  console.log("=".repeat(44));
  console.log("");
});

module.exports = app;
