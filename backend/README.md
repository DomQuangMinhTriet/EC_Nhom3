# Backend - Express.js API Server

A RESTful API server built with Express.js for the online voucher discount e-commerce platform. Provides endpoints for managing partners, vouchers, customers, orders, and transactions with role-based access control.

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)
- Environment configuration (.env file)

### Installation

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install all dependencies:

```bash
npm install
```

This will install:

- **Express 5.2.1** - Web framework
- **Dotenv 17.4.2** - Environment variable management
- **Sequelize 6** - ORM for relational database models
- **mysql2** - MySQL driver used by Sequelize
- **Nodemon 3.1.14** - Development auto-reload tool

3. Create a `.env` file in the backend root directory:

```bash
PORT=5000
NODE_ENV=development
DATABASE_URL=your_database_connection_string
JWT_SECRET=your_secret_key
# Add other environment variables as needed
```

## How to Run

### Development Server

Start the development server with auto-reload on file changes:

```bash
npm run dev
```

The server will run at `http://localhost:5000` (or the PORT specified in .env)

### ORM / Database Setup

The backend is configured with Sequelize for PostgreSQL/Supabase. The connection is defined in `config/database.js` and reads either `DATABASE_URL` or the `DB_*` variables from `.env`.

When `DB_SYNC=true`, Sequelize automatically creates missing tables from the models during backend startup. Keep `DB_SYNC_ALTER=false` unless you intentionally want Sequelize to try updating existing tables to match model changes.

Run these commands yourself after pulling the changes:

```bash
cd backend
npm install
npm run db:check
```

If you want the current demo route (`GET /api/test/users`) to return data from MySQL, create the database and seed the demo table:

```sql
CREATE DATABASE IF NOT EXISTS voucher_db;
USE voucher_db;
SOURCE db/test_users.sql;
```

For Windows MySQL CLI, run it from the `backend` folder:

```bash
mysql -u root -p voucher_db < db/test_users.sql
```

### Production Server

Start the production server:

```bash
npm start
```

## Architecture

### Project Structure

```
backend/
├── index.js                 # Application entry point
├── package.json            # Project dependencies & scripts
├── .env                    # Environment variables (not committed)
├── .gitignore             # Git ignore rules
│
├── routes/                 # API route handlers
│   └── testRoute.js       # Test/example route
│
├── controllers/            # Request handlers & business logic routing
│   └── testController.js  # Test/example controller
│
├── services/              # Business logic layer
│   └── testService.js    # Service for data processing & business rules
│
├── repositories/          # Data access layer (Database)
│   └── testRepo.js       # Repository for database queries
│
├── models/                # Database models/schemas
│   └── testModel.js      # Data model definition
│
├── middlewares/           # Express middleware
│   └── testMiddleware.js # Custom middleware (auth, validation, etc.)
│
├── dto/                   # Data Transfer Objects
│   └── responses/         # Response format definitions
│       └── responseFormat.js # Standard API response format
│
└── constants/             # Application constants
    └── responseStatus.js  # HTTP status codes & messages
```

### Architecture Overview - Layered Architecture Pattern

The backend follows a **clean, layered architecture** to ensure maintainability, scalability, and separation of concerns:

#### 1. **Routes** (`routes/`)

- Define API endpoints and HTTP methods
- Map incoming requests to controllers
- Express route handlers and path specifications
- Example: `GET /api/test`, `POST /api/test`

#### 2. **Controllers** (`controllers/`)

- Handle HTTP requests and responses
- Parse request parameters and body data
- Call services to process business logic
- Return formatted responses
- Handle error responses and status codes
- Act as a bridge between routes and services

#### 3. **Services** (`services/`)

- Core business logic implementation
- Data validation and transformation
- Orchestrate repository calls
- Implement voucher workflow rules
- Handle cross-cutting business concerns
- Manage transaction processing logic

#### 4. **Repositories** (`repositories/`)

- Data access abstraction layer
- Database CRUD operations (Create, Read, Update, Delete)
- Abstract database implementation details
- Enable easy database switching (MySQL → PostgreSQL)
- Query optimization and database-specific operations

#### 5. **Models** (`models/`)

- Define data structures and schemas
- Database table definitions and relationships
- Data validation rules
- Field types, constraints, and indexes

#### 6. **Middlewares** (`middlewares/`)

- Authentication & Authorization validation
- Request validation and sanitization
- Error handling and exception catching
- Logging and request tracking
- CORS and security headers
- Request/Response transformation

#### 7. **DTOs** (`dto/`)

- Define standardized request/response formats
- Data validation schemas for API contracts
- Response envelope structure consistency
- Type definitions for client communication
- `responseFormat.js` - Wraps all API responses

#### 8. **Constants** (`constants/`)

- Application-wide constants and enums
- HTTP status codes and response messages
- Business domain constants (user roles, voucher statuses)
- Configuration constants

### Data Flow Diagram

```
HTTP Request
   ↓
Routes ──→ Controllers ──→ Services ──→ Repositories ──→ Database
   ↑                                                          ↓
   └──────────────────────── ←─ DTOs ← Response Formatting ←
   ↓
HTTP Response (JSON)
```

**Detailed Request Journey:**

1. **Route** receives the HTTP request on a specific endpoint
2. **Controller** parses request data, validates input
3. **Service** implements business logic and workflows
4. **Repository** queries/updates the database
5. **Database** returns raw data
6. **Service** processes and transforms data
7. **DTO** formats response according to standard envelope
8. **Controller** returns formatted response with proper HTTP status
9. **Client** receives consistent JSON response

### API Response Format

All API responses follow a standard format defined in `dto/responses/responseFormat.js`:

```json
{
  "status": {
    "code": 200,
    "message": "Success"
  },
  "data": {
    "total": 10,
    "data": [
      { "id": 1, "name": "Voucher A" },
      { "id": 2, "name": "Voucher B" }
    ]
  },
  "message": "Get vouchers successfully"
}
```

### Authentication & Authorization

- JWT (JSON Web Tokens) for stateless authentication
- Role-based access control (RBAC) with 3 user roles:
  - **Admin** - Full platform access, approves partners and vouchers
  - **Partner** - Manage own vouchers, view sales reports
  - **Customer** - Browse, purchase, redeem vouchers
- Middleware to verify tokens and enforce role permissions
- Secure password hashing and storage

### Key Business Workflows

#### Partner Approval Workflow

```
Partner Registration
  ↓
Validation & Verification
  ↓
Admin Review
  ↓
Approval/Rejection
  ↓
Partner Account Activation
```

#### Voucher Lifecycle

```
Create Voucher (Partner)
  ↓
Admin Review & Approval
  ↓
Publish on Platform
  ↓
Customer Browse & Search
  ↓
Customer Purchase Order
  ↓
Payment Processing
  ↓
Generate Unique Codes
  ↓
Customer Redemption at Partner
  ↓
Verification & Confirmation
  ↓
Usage Tracking & Report
```

#### Transaction Processing

```
Customer Initiates Order
  ↓
Check Voucher Availability
  ↓
Reserve Inventory
  ↓
Process Payment (Mock)
  ↓
Generate Voucher Codes
  ↓
Send Codes to Customer
  ↓
Log Transaction
  ↓
Update Reports & Analytics
```

### Database Schema (Conceptual Entities)

Key business entities:

- **Users** - System users (customer, partner, admin)
- **Partners** - Merchants/vendors selling vouchers
- **Vouchers** - Discount or promotional voucher templates
- **Voucher_Codes** - Individual redemption codes (unique per purchase)
- **Orders** - Customer purchase transactions
- **Order_Items** - Individual items within an order
- **Transactions** - Payment and redemption history
- **Approvals** - Admin review workflow records
- **Reports** - Aggregated sales and usage analytics

### Environment Variables Configuration

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DATABASE_URL=mysql://username:password@localhost:3306/voucher_db
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=yourpassword
DATABASE_NAME=voucher_db

# Authentication & Security
JWT_SECRET=your_super_secret_key_min_32_chars
JWT_EXPIRE=7d
BCRYPT_ROUNDS=10

# Business Rules
PARTNER_APPROVAL_REQUIRED=true
ADMIN_VERIFICATION_REQUIRED=true
MAX_VOUCHER_QUANTITY_PER_ORDER=10
VOUCHER_CODE_LENGTH=16

# Email Configuration (if needed)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_password

# API Configuration
CORS_ORIGIN=http://localhost:3000
API_VERSION=v1
```

### Error Handling Strategy

- Centralized error handling middleware
- Consistent error response format with HTTP status codes
- Request validation errors with field-level details
- Database error logging and monitoring
- Security exception handling (SQL injection, XSS prevention)
- Transaction rollback on critical errors

### Key Features & Endpoints

#### Partner Management

- `POST /api/partners` - Register new partner
- `POST /api/partners/:id/approve` - Admin approve partner
- `GET /api/partners` - List all partners
- `PUT /api/partners/:id` - Update partner profile

#### Voucher Management

- `POST /api/vouchers` - Create voucher
- `PUT /api/vouchers/:id/approve` - Admin approve voucher
- `GET /api/vouchers` - List vouchers with filtering
- `GET /api/vouchers/:id` - Get voucher details
- `PUT /api/vouchers/:id` - Update voucher
- `DELETE /api/vouchers/:id` - Deactivate voucher

#### Order Management

- `POST /api/orders` - Create purchase order
- `GET /api/orders/:customerId` - Get customer orders
- `PUT /api/orders/:id/confirm` - Confirm payment

#### Voucher Code Management

- `GET /api/vouchers/:id/codes` - List codes for voucher
- `POST /api/codes/redeem` - Redeem voucher code
- `GET /api/codes/:code/verify` - Verify code validity

#### Reporting

- `GET /api/reports/sales` - Sales report
- `GET /api/reports/usage` - Voucher usage report
- `GET /api/reports/revenue` - Revenue analytics

### Development Workflow

1. Create new route in `routes/` (define endpoint)
2. Implement controller in `controllers/` (handle request)
3. Implement service in `services/` (business logic)
4. Add repository methods in `repositories/` (data access)
5. Define or update model in `models/` (schema)
6. Create middleware if needed for cross-cutting concerns
7. Define DTOs in `dto/` for request/response validation
8. Test with Postman or API client

## Testing the API

Use Postman or VS Code REST Client extension:

```
### Get all users
GET http://localhost:5000/api/test

### Create a new user
POST http://localhost:5000/api/test
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}
```

## Production Deployment

1. Set environment variables in production environment
2. Build and optimize code
3. Use process manager (PM2):
   ```bash
   npm install -g pm2
   pm2 start index.js --name "voucher-api"
   pm2 save
   pm2 startup
   ```
4. Configure reverse proxy (Nginx)
5. Enable HTTPS/SSL
6. Set up monitoring and logging

## Technologies Used

- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **Dotenv** - Environment variable management
- **Nodemon** - Development auto-reload
- **Database** - MySQL/PostgreSQL (configurable)
- **Authentication** - JWT (to be implemented)
- **Password Hashing** - bcrypt (to be integrated)

## Performance & Security Best Practices

### Performance

- Connection pooling for database
- Query optimization with proper indexing
- Pagination for large datasets
- Caching layer for frequently accessed data
- Rate limiting to prevent abuse
- Request timeout configuration

### Security

- Environment variables for sensitive data (.env)
- Input validation and sanitization
- SQL injection prevention (parameterized queries)
- CORS configuration
- Rate limiting and DDoS protection
- JWT token expiration
- Password hashing with bcrypt
- HTTPS in production
- Security headers (helmet.js)

## Contributing Guidelines

1. Create feature branch: `git checkout -b feature/feature-name`
2. Write code following existing patterns
3. Test with Postman before commit
4. Commit with clear messages: `git commit -am 'Add feature description'`
5. Push to branch: `git push origin feature/feature-name`
6. Create Pull Request with description

## Notes

- This is an academic project for an e-commerce course
- Database initialization scripts needed
- Payment processing is currently mocked (not production-ready)
- Full authentication system needs implementation
- Role-based access control needs middleware setup
