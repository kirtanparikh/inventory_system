# Inventory Management System

A minimal inventory tracking system built for small Indian material businesses (tiles, laminates, hardware). Built as part of an SDE Intern Assignment for Insyd.

## Problem Statement

Small material businesses face significant challenges with inventory management:

- **40% dead stock** due to lack of visibility on what's selling
- **Frequent stockouts** of popular items
- **Inaccurate stock records** (sales in diary, warehouse separate)
- **Low margins** due to poor inventory decisions

This application provides a simple, mobile-friendly solution to track stock levels, record transactions, and identify dead stock and reorder needs.

## Features Implemented

### Core Features

- **Stock Ledger** - Add, view, edit, and delete SKUs
- **Transaction Logging** - Record purchases, sales, damages, and returns
- **Real-time Stock Updates** - Automatic quantity adjustment on transactions
- **Category Management** - Organize products by category

### Alerts & Reports

- **Reorder Alerts** - Flag items below reorder level
- **Dead Stock Detection** - Identify items with no sales in 90+ days
- **Dashboard Overview** - Quick stats on stock value, alerts, and recent activity
- **Category-wise Analysis** - Stock value breakdown by category

### User Experience

- **Mobile Responsive** - Works on phones and tablets
- **Large Touch Targets** - Easy to use in warehouse
- **Success Notifications** - Clear feedback on actions
- **Simple Forms** - Minimal fields, quick entry

## Tech Stack

| Component | Technology                                        |
| --------- | ------------------------------------------------- |
| Frontend  | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend   | Express.js, Node.js                               |
| Database  | PostgreSQL (NeonDB - serverless)                  |
| Icons     | Lucide React                                      |

## Project Structure

```
inventory_system/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── connection.js     # Database connection
│   │   │   └── init.js           # Schema & sample data
│   │   ├── routes/
│   │   │   ├── skus.js           # SKU CRUD endpoints
│   │   │   ├── transactions.js   # Transaction endpoints
│   │   │   ├── dashboard.js      # Dashboard stats
│   │   │   └── reports.js        # Reports endpoints
│   │   └── index.js              # Express server
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx              # Dashboard
    │   │   ├── stock/
    │   │   │   ├── page.tsx          # Stock list
    │   │   │   ├── add/page.tsx      # Add SKU
    │   │   │   └── [id]/edit/page.tsx # Edit SKU
    │   │   └── transactions/
    │   │       ├── page.tsx          # New transaction
    │   │       └── history/page.tsx  # Transaction history
    │   ├── components/
    │   │   └── Navigation.tsx
    │   └── lib/
    │       ├── api.ts               # API client functions
    │       └── types.ts             # TypeScript types
    └── package.json
```

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- npm or yarn
- NeonDB account (free at https://neon.tech)

### 1. Setup NeonDB

1. Go to https://neon.tech and create a free account
2. Create a new project
3. Copy your connection string from the dashboard (looks like: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`)

### 2. Setup Backend

```bash
cd backend
npm install

# Create .env file with your NeonDB connection
cp .env.example .env
# Edit .env and paste your DATABASE_URL

# Initialize database with tables and sample data
npm run init-db

# Start server
npm run dev        # Starts server on http://localhost:3001
```

### 3. Setup Frontend (in new terminal)

```bash
cd frontend
npm install
npm run dev        # Starts app on http://localhost:3000
```

### 4. Open Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Environment Variables

**Backend (.env)**

```
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
PORT=3001
FRONTEND_URL=http://localhost:3000
```

**Frontend (.env.local)**

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## API Documentation

### SKU Endpoints

| Method | Endpoint               | Description                                        |
| ------ | ---------------------- | -------------------------------------------------- |
| GET    | `/api/skus`            | List all SKUs (query: category, search, low_stock) |
| GET    | `/api/skus/:id`        | Get single SKU                                     |
| POST   | `/api/skus`            | Create SKU                                         |
| PUT    | `/api/skus/:id`        | Update SKU                                         |
| DELETE | `/api/skus/:id`        | Delete SKU (if no transactions)                    |
| GET    | `/api/skus/categories` | List unique categories                             |

### Transaction Endpoints

| Method | Endpoint            | Description                                    |
| ------ | ------------------- | ---------------------------------------------- |
| GET    | `/api/transactions` | List transactions (query: sku_id, type, limit) |
| POST   | `/api/transactions` | Create transaction (auto-updates stock)        |

**Transaction Types:** `PURCHASE`, `SALE`, `DAMAGE`, `RETURN`

### Dashboard & Reports

| Method | Endpoint                   | Description                    |
| ------ | -------------------------- | ------------------------------ |
| GET    | `/api/dashboard/stats`     | Dashboard overview data        |
| GET    | `/api/reports/dead-stock`  | Items with no sales in 90 days |
| GET    | `/api/reports/reorder`     | Items below reorder level      |
| GET    | `/api/reports/top-selling` | Top 10 selling SKUs            |
| GET    | `/api/reports/slow-moving` | Bottom 10 by movement          |

### Example API Calls

**Create SKU:**

```bash
curl -X POST http://localhost:3001/api/skus \
  -H "Content-Type: application/json" \
  -d '{"name": "Ceramic Tile 2x2", "category": "Tiles", "reorder_level": 50, "current_quantity": 100, "unit_price": 45}'
```

**Record Sale:**

```bash
curl -X POST http://localhost:3001/api/transactions \
  -H "Content-Type: application/json" \
  -d '{"sku_id": 1, "transaction_type": "SALE", "quantity": 10, "reason": "Customer Order"}'
```

## Screenshots

### Dashboard

The main dashboard shows:

- Total SKUs, stock value, reorder alerts, dead stock count
- Reorder alerts with low stock items
- Dead stock warnings (90+ days without sale)
- Category-wise breakdown
- Recent transactions

### Stock Management

- Table view of all SKUs with stock levels
- Color-coded status badges (In Stock, Low Stock, Out of Stock)
- Search and filter by category
- Quick edit and delete actions

### Transaction Recording

- Step-by-step transaction entry
- Four transaction types with visual icons
- Real-time stock preview (before/after)
- Transaction history with filtering

## Assumptions Made

1. **No Authentication** - Single user system for now. Add authentication in production.
2. **PostgreSQL via NeonDB** - Serverless PostgreSQL for easy deployment.
3. **No Multi-tenancy** - Single business use case.
4. **Currency** - All prices in INR.
5. **90-Day Rule** - Dead stock defined as items with no sales in 90 days.
6. **Negative Stock Allowed** - System warns but allows negative stock for data corrections.
7. **No Barcode/QR** - Manual entry only, barcode scanning can be added later.

## Future Improvements

### High Priority

- [ ] User authentication & authorization
- [ ] Multi-location/warehouse support
- [ ] Excel import/export for bulk operations
- [ ] Barcode scanning for faster entry
- [ ] SMS/Email alerts for low stock

### Medium Priority

- [ ] Purchase order management
- [ ] Supplier database
- [ ] Price history tracking
- [ ] Profit margin reports
- [ ] Print-friendly purchase lists

### Nice to Have

- [ ] Mobile app (React Native)
- [ ] Offline mode with sync
- [ ] Multi-language support (Hindi/English)
- [ ] AI-powered demand forecasting
- [ ] Integration with Tally/accounting software

## Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Connect repo to Vercel
3. Set environment variable: `NEXT_PUBLIC_API_URL=<your-backend-url>/api`
4. Deploy

### Backend (Render/Railway)

1. Push code to GitHub
2. Create new Web Service on Render
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variable: `DATABASE_URL=<your-neondb-connection-string>`
6. Add environment variable: `FRONTEND_URL=<your-vercel-url>`
7. Deploy

## License

MIT License - feel free to use for learning or commercial purposes.

## Author

Kirtan - SDE Intern Assignment for Insyd

Built by **Kirtan** for Insyd SDE Intern Assignment

---

_This project demonstrates a minimal viable product approach - focusing on working features over perfect code. Built in ~16 hours._
