# CosmeGlow 🌿 — Premium E-Commerce & Skincare Management System

CosmeGlow is a high-performance, premium E-Commerce platform tailored for botanical and restorative skincare. The system features a responsive storefront client, a comprehensive admin dashboard, a secure backend REST API, and native integrations with logistics, marketing, and media services.

---

## 📖 Table of Contents
1. [Tech Stack](#-tech-stack)
2. [Third-Party Integrations](#-third-party-integrations)
3. [Key Modules & Features](#-key-modules--features)
4. [Database Architecture & Collections](#-database-architecture--collections)
5. [API Endpoint Directory](#-api-endpoint-directory)
6. [Installation & Setup](#-installation--setup)

---

## 🛠 Tech Stack

### Storefront & Admin Dashboard (Frontend)
- **Framework:** React.js (v18.x) powered by **Vite** for fast HMR and compilation.
- **Language:** TypeScript (TS) enforcing strong typed contracts.
- **Styling:** Vanilla CSS, custom Tailwind CSS rules.
- **Icons & Visuals:** Lucide React for modern, consistent UI layout iconography.
- **State Management:** React Context API (StoreContext, AuthContext) handling user authentication and persistent settings.

### Server API Framework (Backend)
- **Runtime:** Node.js (v20.x+)
- **Server Framework:** Express.js (v4.x)
- **Authentication:** JWT (JSON Web Tokens) with secure cookie state management.
- **CORS Policies:** Configured securely to restrict access to trusted client hosts.

### Database
- **Engine:** MongoDB Atlas Cloud Database.
- **ODM Driver:** Mongoose (v8.x) ODM with transaction safeguards.

---

## 🔌 Third-Party Integrations

The platform links directly with premium SaaS APIs to handle emails, graphics, logistics, and database management. Real-time metrics for these integrations are available inside the admin panel dashboard:

| Service | Category | Description |
| :--- | :--- | :--- |
| **MongoDB Atlas** | Database | Cloud database storing configuration parameters, user profiles, orders, and product catalogs. |
| **Brevo (Sendinblue)** | Communication | Handles SMTP mail queues, transactional verification, register triggers, and invoice receipts. |
| **Cloudinary** | CDN & Media | Hosts high-resolution catalog images, promotional banners, and provides dynamic resizing/cropping. |
| **Shiprocket** | Logistics | Fetches wallets credit balances, updates live shipping rates, schedules order pickups, and prints tracking tags. |

---

## 🌟 Key Modules & Features

### 1. Storefront Experience
- **Fluid Checkout Funnel:** Multi-item slide-out cart drawer with live standard delivery margins, tax multipliers, and checkout summaries.
- **Premium Payment Selection:** A modern checkout payment picker styling COD (Cash on Delivery), credit cards, and online payments using standard Stripe/Shopify-style radio cards.
- **WhatsApp Integration:** Floating official green WhatsApp button (`#25D366`) linking users to live catalog assistance.
- **Flash-Free Theme Loading:** Head loader script reads dynamic themes from `localStorage` on boot, applying root CSS variables immediately to eliminate flashes of default colors.

### 2. Administrator Dashboard
- **Responsive Management Grid:** Left-side dark SaaS navigation bar with clean white active-state items, allowing quick navigation to orders, users, catalog details, settings, and stats.
- **Live System API Metrics:** Tabbed dashboard monitoring transactional SMTP counts, Cloudinary CDN bytes, Shiprocket wallet funds, and MongoDB Atlas database usage.
- **Dynamic Content & Banner Editor:** Split-column preview cards allowing drag-and-drop uploads directly contextually over preview windows with overlay loaders.

---

## 🗄 Database Architecture & Collections

The MongoDB database contains 6 collections managed via Mongoose schemas:

### `users`
Tracks user credentials, validation keys, and linked social profiles.
- **Fields:** `name`, `email`, `password` (bcrypt hash), `role` (`user`/`admin`), `isVerified`, `facebookId`, `createdAt`.

### `products`
Stores product catalog entries, pricing indices, and CDN assets.
- **Fields:** `name`, `description`, `price` (number), `compareAtPrice` (number), `images` (array of URLs), `category` (ObjectId reference), `stock`, `createdAt`.

### `orders`
Manages purchases, payment methodologies, and logistics shipping numbers.
- **Fields:** `user` (ObjectId reference), `items` (array of items), `shippingAddress`, `paymentMethod` (`COD`/`Online`), `paymentStatus` (`pending`/`paid`/`failed`), `totalAmount`, `status` (`pending`/`processing`/`shipped`/`delivered`), `shiprocketResponse` (logistics metadata), `createdAt`.

### `categories`
Organizes catalog filters.
- **Fields:** `name`, `slug`, `icon` (string identifier), `createdAt`.

### `settings`
Global configurations, dynamic storefront variables, and features toggles.
- **Fields:** `themeColor` (hex code), `taxRate` (percentage), `shippingFee` (number), `freeShippingThreshold` (number), `enableTax` (boolean), `enableShipping` (boolean), `logoUrl` (string).

### `notifications`
System logs shown in the admin header.
- **Fields:** `title`, `message`, `type` (`info`/`success`/`warning`), `read` (boolean), `createdAt`.

---

## 📁 API Endpoint Directory

All routes are prefixed by `/api` and require appropriate authorization headers for restricted endpoints:

### Authentication (`/api/auth`)
- `POST /register` - Register a new email account (triggers verification mail).
- `POST /login` - Sign in using password credentials.
- `POST /facebook-login` - Redirect/oauth registration handling.
- `GET /verify-email/:token` - Verify client account.

### Product Catalog (`/api/products`)
- `GET /` - List all catalog products.
- `GET /:id` - Get detail attributes for a specific product.
- `POST /` - Add a new product (Admin Only).
- `PUT /:id` - Edit product features (Admin Only).
- `DELETE /:id` - Delete item (Admin Only).

### Order Pipeline (`/api/orders`)
- `POST /create` - Create a checkout order.
- `GET /my-orders` - Retrieve authenticated purchase logs.
- `PUT /:id/status` - Modify dispatch state (Admin Only).

### Admin Settings (`/api/admin`)
- `GET /dashboard` - Get revenue totals, users metrics, and sales breakdowns.
- `GET /settings` - Fetch active tax rates, shipping policies, and colors.
- `PUT /settings` - Update storefront tax rates and dynamic sliders.
- `GET /api-metrics` - Read live MongoDB bytes, Brevo daily limits, and Cloudinary spaces.

---

## 🚀 Installation & Setup

### Requirements
- Node.js (v18+)
- MongoDB connection string (Atlas recommended)

### 1. Clone & Configure Server
Navigate into the backend server directory:
```bash
cd server
npm install
```

Create a `.env` file in the `server` root directory:
```env
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
BREVO_API_KEY=your_brevo_key
SHIPROCKET_EMAIL=your_shiprocket_email
SHIPROCKET_PASSWORD=your_shiprocket_password
```

Start the backend API server:
```bash
npm run dev
```

### 2. Configure Client Storefront
Navigate to the frontend React workspace:
```bash
cd ../client
npm install
```

Start the Vite development web server:
```bash
npm run dev
```

To create an optimized production bundle:
```bash
npm run build
```
This builds and outputs the static code into the `dist/` directory, ready to be hosted on Netlify, Vercel, or custom CDN edge servers.
