# Inventory Management System

Simple inventory tracker for small material businesses.

## Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Backend:** Express.js, Node.js
- **Database:** PostgreSQL (NeonDB)

## Quick Start

### 1. Database Setup

- Create free account at https://neon.tech
- Copy connection string

### 2. Backend

```bash
cd backend
npm install
# Create .env file with: DATABASE_URL=your_connection_string
npm run init-db   # Creates tables + sample data
npm run dev       # http://localhost:3001
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev       # http://localhost:3000
```

## API Endpoints

| Endpoint                    | Description               |
| --------------------------- | ------------------------- |
| GET /api/skus               | List all products         |
| POST /api/skus              | Add product               |
| PUT /api/skus/:id           | Update product            |
| DELETE /api/skus/:id        | Delete product            |
| GET /api/transactions       | List transactions         |
| POST /api/transactions      | Record stock in/out       |
| GET /api/dashboard/stats    | Dashboard data            |
| GET /api/reports/dead-stock | Items not sold in 90 days |
| GET /api/reports/reorder    | Low stock items           |

## Features

- Stock ledger (CRUD)
- Transaction logging (Purchase, Sale, Damage, Return)
- Auto stock updates
- Dead stock detection (90 days no sale)
- Reorder alerts
- Dashboard with stats

## Author

Kirtan 
