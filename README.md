# LegionX - White Label E-Commerce Platform

> A lightweight, scalable, white-label e-commerce platform for small and medium businesses

## 📋 Project Overview

**LegionX** is a full-stack e-commerce solution designed to support multiple business types (sports, electronics, clothing, grocery, etc.) without requiring code changes. The platform provides a complete storefront experience with admin management capabilities, inventory tracking, order processing, and payment integration.

**Current Implementation**: Cricket Bat Store (Prototype)  
**Architecture**: Fully white-label and extensible for any product category

---

## ✨ Key Features

### 👥 Customer Features
- Browse and search products with advanced filtering
- View detailed product information with images & specifications
- Shopping cart management
- Checkout with customer information
- Order placement and tracking
- View order history

### 🛠️ Admin Features
- Product management (CRUD operations)
- Category management
- Inventory tracking and stock management
- Order management & fulfillment
- Shipping charge configuration
- Banner/carousel management
- Admin dashboard with analytics

### 🔐 Technical Features
- JWT-based authentication
- Role-based access control (Customer, Admin)
- Secure password hashing (bcrypt)
- Input validation (Zod)
- RESTful API architecture
- Responsive design (Tailwind CSS)
- TypeScript for type safety

---

## 🏗️ Project Structure

```
legionx/
├── frontend/                 # React + Vite web application
│   ├── src/
│   │   ├── modules/
│   │   │   ├── admin/       # Admin dashboard & management
│   │   │   ├── storefront/  # Customer-facing pages
│   │   │   └── shared/      # Reusable components & utilities
│   │   ├── services/        # API communication
│   │   ├── router/          # React Router configuration
│   │   └── main.tsx         # Entry point
│   └── package.json
│
├── backend/                  # Fastify + Prisma API server
│   ├── src/
│   │   ├── modules/         # Feature modules
│   │   │   ├── auth/        # Authentication & JWT
│   │   │   ├── products/    # Product management
│   │   │   ├── orders/      # Order processing
│   │   │   ├── payments/    # Payment integration
│   │   │   ├── inventory/   # Stock management
│   │   │   ├── shipping/    # Shipping logistics
│   │   │   ├── dashboard/   # Analytics & reports
│   │   │   └── settings/    # Platform configuration
│   │   ├── providers/       # External service integrations
│   │   │   ├── payment/     # Payment gateway providers
│   │   │   ├── notification/# Email/SMS notifications
│   │   │   ├── storage/     # File storage (S3, etc.)
│   │   │   └── sms/         # SMS service providers
│   │   ├── middleware/      # Express-like middlewares
│   │   ├── config/          # Configuration files
│   │   ├── utils/           # Utility functions
│   │   ├── app.ts           # Fastify app setup
│   │   └── server.ts        # Server bootstrap
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── package.json
│
├── docs/                     # Documentation
│   ├── CONTEXT.md           # Project context & requirements
│   ├── REQUIREMENTS.md      # Detailed requirements
│   ├── ARCHITECTURE.md      # Technical architecture
│   ├── DATABASE.md          # Database design
│   └── API.md               # API documentation
│
├── prototype/               # Prototype files
└── package.json            # Root package.json (monorepo)
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+ and npm v9+
- **PostgreSQL** v12+ (or configured database)
- **.env files** for environment variables

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd legionx
   ```

2. **Install root dependencies**
   ```bash
   npm install
   ```

3. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Create .env file
   cp .env.example .env
   
   # Update .env with your database and API settings
   # DATABASE_URL="postgresql://user:password@localhost:5432/legionx"
   # JWT_SECRET="your-secret-key"
   
   # Run Prisma migrations
   npx prisma migrate dev --name init
   
   # Generate Prisma Client
   npx prisma generate
   ```

4. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   
   # Create .env file
   cp .env.example .env
   
   # Update .env with your API endpoint
   # VITE_API_BASE_URL="http://localhost:3000/api"
   ```

### Running the Application

**Development Mode (Both Frontend & Backend)**
```bash
npm run dev
```

**Frontend Only**
```bash
npm run frontend
```

**Backend Only**
```bash
npm run backend
```

**Backend Development** (with auto-reload)
```bash
cd backend
npm run dev
```

**Frontend Development**
```bash
cd frontend
npm run dev
```

### Build for Production

**Frontend**
```bash
cd frontend
npm run build
npm run preview
```

**Backend** is always run from source with `tsx`

---

## 📁 Module Breakdown

### Frontend Modules

| Module | Purpose |
|--------|---------|
| **admin** | Admin dashboard, product/order/category management |
| **storefront** | Customer-facing pages (home, products, cart, checkout) |
| **shared** | Reusable components, hooks, layouts, utilities |

### Backend Modules

| Module | Purpose |
|--------|---------|
| **auth** | User registration, login, JWT token generation |
| **products** | Product CRUD, filtering, search |
| **categories** | Category management |
| **inventory** | Stock tracking and updates |
| **orders** | Order creation, status updates, retrieval |
| **payments** | Payment processing integration |
| **shipping** | Shipping charges, delivery logistics |
| **dashboard** | Analytics and reporting |
| **settings** | Platform configuration |

### Backend Providers

| Provider | Purpose |
|----------|---------|
| **payment** | Stripe, PayPal, Razorpay integration |
| **notification** | Email/SMS alerts for orders & notifications |
| **storage** | AWS S3 or similar for product images |
| **sms** | Twilio, AWS SNS for SMS delivery |

---

## 🔧 Tech Stack

### Frontend
- **React** 19.2.7 - UI library
- **Vite** 8.1.1 - Build tool (fast, modern)
- **TypeScript** 6.0.2 - Type safety
- **React Router** 7.18.1 - Routing
- **Tailwind CSS** 4.3.2 - Styling
- **Axios** 1.18.1 - HTTP client
- **ESLint** - Code quality

### Backend
- **Fastify** 5.10.0 - Web framework
- **Prisma** 7.8.0 - ORM
- **PostgreSQL** - Database
- **TypeScript** 7.0.2 - Type safety
- **JWT (jsonwebtoken)** - Authentication
- **bcrypt** - Password hashing
- **Zod** - Schema validation
- **dotenv** - Environment config

### Development Tools
- **tsx** - TypeScript execution
- **nodemon** - Auto-restart on changes
- **concurrently** - Run multiple scripts

---

## 📖 API Endpoints

See [API.md](docs/API.md) for complete API documentation.

**Base URL**: `http://localhost:3000/api`

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh JWT token

### Products
- `GET /products` - List products (with filtering & search)
- `GET /products/:id` - Get product details
- `POST /products` - Create product (Admin only)
- `PUT /products/:id` - Update product (Admin only)
- `DELETE /products/:id` - Delete product (Admin only)

### Orders
- `POST /orders` - Create order
- `GET /orders` - List orders
- `GET /orders/:id` - Get order details
- `PUT /orders/:id/status` - Update order status (Admin only)

*[See API.md for complete endpoint list]*

---

## 🗄️ Database Schema

Key tables:
- **users** - Customer and admin accounts
- **products** - Product catalog
- **categories** - Product categories
- **inventory** - Stock tracking
- **orders** - Customer orders
- **order_items** - Items in orders
- **payments** - Payment records
- **shipping_charges** - Shipping configuration
- **banners** - Homepage carousel

See [DATABASE.md](docs/DATABASE.md) for complete schema details.

---

## 🔐 Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/legionx
JWT_SECRET=your-secret-key-here
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:3000/api
```

---

## 🧪 Testing

```bash
cd frontend
npm run lint

cd backend
npm test
```

---

## 📝 Coding Standards

- **TypeScript**: All code must be typed (no `any` types)
- **Validation**: Use Zod for API request validation
- **Authentication**: JWT stored in HTTP-only cookies
- **Naming**: camelCase for variables/functions, PascalCase for components
- **File Structure**: Modular organization by feature

---

## 🚢 Deployment

### Frontend
- Deploy to: Vercel, Netlify, or static hosting (S3 + CloudFront)
- Build: `npm run build`
- Output: `dist/` directory

### Backend
- Deploy to: AWS EC2, Heroku, Railway, or any Node.js hosting
- Database: Managed PostgreSQL (AWS RDS, Supabase, etc.)
- Environment: Set all `.env` variables in production

---

## 📚 Documentation

- [CONTEXT.md](docs/CONTEXT.md) - Project vision and requirements
- [REQUIREMENTS.md](docs/REQUIREMENTS.md) - Detailed feature requirements
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Technical architecture decisions
- [DATABASE.md](docs/DATABASE.md) - Database design and schema
- [API.md](docs/API.md) - Complete API reference

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/new-feature`
2. Make your changes
3. Commit: `git commit -m "Add new feature"`
4. Push: `git push origin feature/new-feature`
5. Create a Pull Request

---

## 📄 License

ISC

---

## 👨‍💻 Development Tips

- **Database Migrations**: Use `npx prisma migrate dev` for new migrations
- **Database Studio**: View data with `npx prisma studio`
- **API Testing**: Use Postman or REST Client for testing endpoints
- **Hot Reload**: Both frontend (Vite) and backend (tsx watch) support hot reload
- **Type Generation**: Run `npx prisma generate` after schema changes

---

## 🐛 Troubleshooting

### Backend won't start
- Check DATABASE_URL is correct
- Run migrations: `npx prisma migrate deploy`
- Check PORT 3000 is not in use

### Frontend build errors
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf .vite`
- Check Node version: `node --version` (should be 18+)

### CORS errors
- Verify CORS_ORIGIN in backend .env matches frontend URL
- Frontend default: `http://localhost:5173`
- Backend default: `http://localhost:3000`

---

## 📞 Support

For issues and questions, please check the documentation first or create an issue in the repository.

---

**Built with ❤️ for seamless e-commerce**
