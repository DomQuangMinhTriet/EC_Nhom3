# Online Voucher Discount E-Commerce Platform

A comprehensive full-stack e-commerce platform for buying and redeeming discount vouchers online. Built with Next.js, Express.js, TypeScript, and Supabase, and designed for academic coursework in E-Commerce.

## 🎯 Project Overview

This platform enables:

- **Partners** (merchants) to create and manage discount vouchers
- **Customers** to discover, purchase, and redeem vouchers
- **Administrators** to approve partners/vouchers and monitor transactions

> **Stack pivot — 28/07/2026.** Per the Implementation Plan, the backend moved
> from Express + Sequelize (JS) to **Express + TypeScript + Drizzle ORM**, and
> the frontend from Vite + React (JS) to **Next.js 14 (App Router) +
> TypeScript**, with **Supabase Auth** for authentication and **Cloudinary**
> for file storage. The previous scaffolds are kept as
> `backend/_legacy-sequelize/` and `frontend/_legacy-vite/` for reference only
> — see each package's README for details.

## 📂 Project Structure

```
EC_Nhom3/
├── README.md                    # This file - Project overview
├── backend/                     # Express.js + TypeScript API server
│   ├── README.md               # Backend setup & architecture
│   ├── src/
│   │   ├── index.ts             # Server entry point
│   │   ├── db/                   # Drizzle client + schema (17 tables)
│   │   └── lib/                   # Cloudinary, Supabase admin client
│   ├── drizzle/                 # Generated SQL migrations
│   ├── package.json
│   └── _legacy-sequelize/       # Previous Sequelize/JS implementation (reference only)
│
├── frontend/                    # Next.js 14 (App Router) + TypeScript UI
│   ├── README.md               # Frontend setup & architecture
│   ├── prototype/               # EC-Voucher-UI.html — visual reference for all screens
│   ├── src/
│   │   ├── app/                  # Pages, layouts, route handlers
│   │   ├── providers/             # TanStack Query provider
│   │   └── lib/supabase/           # Browser + server Supabase clients
│   ├── package.json
│   └── _legacy-vite/            # Previous Vite+React/JS implementation (reference only)
│
└── docs/                        # Project documentation
    ├── README.md               # Documentation guide
    ├── 01_tom-tat-do-an.md     # Project summary
    ├── 02_ke-hoach-tong-quat.md # Overall plan
    ├── 03_ke-hoach-chi-tiet-giai-doan.md # Detailed phases
    ├── 04_tai-lieu-hop-dau-tien.md # Specifications
    └── 05_huong-dan-initialize.md # Setup guide
```

## 🚀 Quick Start

### Prerequisites

- Node.js v20+ ([download](https://nodejs.org/))
- npm v10+ (comes with Node.js)
- A Supabase project (Postgres + Auth) and a Cloudinary account
- Git

### Setup Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in Supabase + Cloudinary credentials
npm run dev
```

Backend will run at: `http://localhost:8080`

### Setup Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # fill in Supabase URL/anon key, API URL
npm run dev
```

Frontend will run at: `http://localhost:3000`

## 🏗️ Architecture

### Three-Tier Architecture

```
┌─────────────────────────────────────────────────┐
│      Frontend (Next.js 14 + TypeScript)          │
│    Customer │ Partner │ Branch │ Admin UI        │
└──────────────────┬──────────────────────────────┘
                  │ HTTP/REST · Supabase Auth
┌──────────────────▼──────────────────────────────┐
│    Backend (Express.js + TypeScript + Drizzle)   │
│    API Routes → Controllers → Services           │
└──────────────────┬──────────────────────────────┘
                  │ Drizzle ORM
┌──────────────────▼──────────────────────────────┐
│         Database (Supabase PostgreSQL)           │
│ Users │ Partners │ Vouchers │ Orders │ Reports  │
└─────────────────────────────────────────────────┘
```

### Data Flow

```
User Action (Frontend)
    ↓
API Request (HTTP)
    ↓
Route Handler (Express)
    ↓
Controller (Request parsing)
    ↓
Service (Business logic)
    ↓
Repository (Database query)
    ↓
Database (Data storage)
    ↓
Response (DTO formatted JSON)
    ↓
Frontend (UI update)
```

## 📋 Key Features

### Customer Features

- ✅ Browse and search vouchers
- ✅ View voucher details and terms
- ✅ Purchase vouchers
- ✅ View purchase history
- ✅ Redeem voucher codes
- ✅ Track voucher usage

### Partner Features

- ✅ Register as merchant
- ✅ Create discount vouchers
- ✅ Manage voucher inventory
- ✅ View sales reports
- ✅ Verify customer redemptions
- ✅ Track revenue

### Admin Features

- ✅ Approve/reject partner applications
- ✅ Review and approve vouchers
- ✅ Monitor platform activity
- ✅ View comprehensive reports
- ✅ Manage user accounts
- ✅ Configure business rules

## 🔄 Business Workflow

```
Partner Registration
    ↓ (Admin Review)
Partner Approved → Partner Creates Voucher
    ↓ (Admin Review)
Voucher Approved → Published on Platform
    ↓
Customer Searches & Purchases
    ↓
Payment Processing
    ↓
Unique Codes Generated & Sent
    ↓
Customer Redeems at Partner
    ↓
Partner Verifies & Completes
    ↓
Transaction Logged & Reports Updated
```

## 📚 Documentation

Comprehensive documentation is available in the `docs/` folder:

1. **[docs/01_tom-tat-do-an.md](docs/01_tom-tat-do-an.md)** - Project summary and business context
2. **[docs/02_ke-hoach-tong-quat.md](docs/02_ke-hoach-tong-quat.md)** - Project plan, timeline, and team roles
3. **[docs/03_ke-hoach-chi-tiet-giai-doan.md](docs/03_ke-hoach-chi-tiet-giai-doan.md)** - Detailed phase breakdown
4. **[docs/04_tai-lieu-hop-dau-tien.md](docs/04_tai-lieu-hop-dau-tien.md)** - System requirements and specifications
5. **[docs/05_huong-dan-initialize.md](docs/05_huong-dan-initialize.md)** - Initialization and setup instructions
6. **[docs/README.md](docs/README.md)** - Documentation index and guide

## 🛠️ Technology Stack

### Frontend

- **Next.js 14** (App Router) - UI framework, routing, TypeScript, Server Components
- **Tailwind CSS + shadcn/ui** - Styling and UI components
- **TanStack Query** - Data fetching and caching from the backend API
- **Zustand** - Global client state (cart, UI)
- **React Hook Form + Zod** - Form handling and type-safe validation
- **supabase-js (client)** - Auth session, token refresh

### Backend

- **Node.js + Express + TypeScript** - REST API server
- **Drizzle ORM** - Query builder and migrations, connected to Supabase PostgreSQL
- **supabase-js (server)** - Verify auth tokens, admin operations
- **Cloudinary** - Voucher image and avatar storage

### Database & Auth

- **Supabase (PostgreSQL 16 + Auth)** - Hosted database and authentication

### Deployment

- **Vercel** - Next.js frontend hosting
- **Railway** (or Render) - Express backend hosting

### Development Tools

- **Git** - Version control
- **Postman** - API testing
- **VS Code** - Code editor

## 📖 Development Guide

### Backend Development

See [backend/README.md](backend/README.md) for:

- Setup instructions
- API architecture
- Project structure
- How to add new endpoints
- Database integration

### Frontend Development

See [frontend/README.md](frontend/README.md) for:

- Setup instructions
- Component architecture
- Page structure
- Routing configuration
- API integration

### Project Documentation

See [docs/README.md](docs/README.md) for:

- Documentation overview
- Using each documentation file
- Project timeline
- Team roles
- Key concepts

## 🔧 Common Commands

### Backend

```bash
cd backend
npm install          # Install dependencies
npm run dev          # Start dev server with auto-reload
npm start            # Start production server (after npm run build)
npm run typecheck    # Type-check
npm run lint         # Run ESLint
npm run db:generate  # Generate a migration from the Drizzle schema
npm run db:push      # Push the schema to the configured database
```

### Frontend

```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Start dev server
npm run build        # Build for production
npm start            # Serve the production build
npm run lint         # Run ESLint (next lint)
npm run typecheck    # Type-check
```

## 🔐 Environment Variables

See [backend/.env.example](backend/.env.example) and
[frontend/.env.local.example](frontend/.env.local.example) for the full,
up-to-date list. Summary:

### Backend `.env` file

```env
PORT=8080
NODE_ENV=development
DB_HOST=db.your-project-ref.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASS=yourpassword
DB_SSL=true

SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Frontend `.env.local` file

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
```

## 📈 Project Timeline

| Phase                           | Duration | Focus                             |
| ------------------------------- | -------- | --------------------------------- |
| **1. Analysis & Specification** | Week 1-2 | Requirements gathering, use cases |
| **2. Design**                   | Week 3-4 | Database design, UI wireframes    |
| **3. Implementation**           | Week 5-8 | Development and integration       |
| **4. Testing**                  | Week 9   | Quality assurance and bug fixes   |
| **5. Delivery**                 | Week 10  | Documentation and presentation    |

## 🤝 Team Roles

- **Project Manager** - Overall coordination
- **Business Analyst** - Requirements analysis
- **Backend Developer** - API and business logic
- **Frontend Developer** - User interface
- **Database Designer** - Schema design
- **QA Engineer** - Testing and quality
- **UI/UX Designer** - Wireframes and design

## 📊 API Endpoints (Examples)

```
GET    /api/vouchers              # List all vouchers
POST   /api/vouchers              # Create new voucher
GET    /api/vouchers/:id          # Get voucher details
PUT    /api/vouchers/:id          # Update voucher

POST   /api/orders                # Create purchase order
GET    /api/orders/:id            # Get order details
PUT    /api/orders/:id/redeem     # Redeem voucher code

POST   /api/partners              # Register as partner
POST   /api/partners/:id/approve  # Admin approve partner

POST   /api/auth/login            # User login
POST   /api/auth/register         # User registration
```

## 🐛 Troubleshooting

### Backend won't start

- Check if port 5000 is already in use: `netstat -ano | findstr :5000`
- Verify Node.js is installed: `node --version`
- Check .env file exists with PORT set

### Frontend not connecting to backend

- Verify backend is running on the correct port
- Check VITE_API_URL environment variable
- Review browser console for network errors

### Database connection failed

- Ensure database server is running
- Verify DATABASE_URL in .env is correct
- Check database credentials

## 📝 Notes

- This is an academic project for E-Commerce coursework
- Database needs to be initialized before running
- Payment processing is mocked (not production-ready)
- Full authentication system needs implementation
- All documentation in docs/ folder is in Vietnamese (original) with English descriptions

## 🔗 Resources

- [React Documentation](https://react.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [Vite Documentation](https://vitejs.dev/)
- [E-Commerce Concepts](https://en.wikipedia.org/wiki/E-commerce)

## 📄 License

This is an academic project for HCMUS E-Commerce Course (Semester 3, 2025-2026).

## 👥 Contributors

- **Project Team** - EC_Nhom3
- **Course:** Thương mại Điện tử (E-Commerce)
- **Institution:** HCMUS
- **Year:** 2025-2026

---

**Last Updated:** 2026-06-07

For questions or documentation updates, contact the project manager or team lead.
