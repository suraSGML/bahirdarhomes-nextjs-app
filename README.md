# 🏠 BahirDar Homes

A full-stack property rental and listing platform for Bahir Dar, Ethiopia.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL + Prisma ORM |
| Auth | Phone OTP + JWT |
| Image Upload | Cloudinary |
| Icons | Lucide React |

## Features

- 🔍 Browse & search properties with advanced filters
- 🏠 List properties (apartments, houses, villas, studios, land)
- 📱 Phone OTP authentication (no email needed)
- ✅ Admin verification system for listings
- 💬 Tenant-to-landlord inquiry system
- ❤️ Save/bookmark properties
- ⭐ Property reviews and ratings
- 📍 Sub-city based search (Fasilo, Tana, Belay Zeleke, etc.)
- 📸 Multi-image upload via Cloudinary
- 📱 Fully responsive mobile-first design

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
```
Fill in your values in `.env.local`:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Random secret (run: `openssl rand -base64 32`)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### 3. Setup database
```bash
npm run db:push       # Push schema to database
npm run db:generate   # Generate Prisma client
npm run db:seed       # Seed with demo data (optional)
```

### 4. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Test Accounts (after seeding)

| Role | Phone |
|---|---|
| Admin | +251911000001 |
| Landlord | +251911000002 |
| Tenant | +251911000003 |

> In development mode, OTP codes are printed to the console instead of being sent via SMS.

## Pages

| Route | Description |
|---|---|
| `/` | Homepage with hero, featured listings, sub-city browse |
| `/properties` | Browse all properties with filters & pagination |
| `/properties/[id]` | Property detail with gallery, amenities, inquiry form |
| `/auth` | Phone OTP sign in / register |
| `/dashboard/tenant` | Saved properties & sent inquiries |
| `/dashboard/landlord` | Manage listings & respond to inquiries |
| `/dashboard/landlord/new` | Create new property listing |
| `/dashboard/admin` | Verify/reject property listings |

## API Routes

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/request-otp` | Send OTP to phone |
| POST | `/api/auth/verify-otp` | Verify OTP, get JWT |
| GET | `/api/properties` | List properties with filters |
| POST | `/api/properties` | Create property (landlord) |
| GET | `/api/properties/[id]` | Get single property |
| PATCH | `/api/properties/[id]` | Update property |
| DELETE | `/api/properties/[id]` | Delete property |
| GET | `/api/inquiries` | Get inquiries |
| POST | `/api/inquiries` | Send inquiry or reply |
| GET | `/api/saved` | Get saved properties |
| POST | `/api/saved` | Save a property |
| DELETE | `/api/saved` | Unsave a property |
| POST | `/api/upload` | Upload image to Cloudinary |
| PATCH | `/api/admin/properties/[id]` | Verify/reject property (admin) |
