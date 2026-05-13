# 🔨 AuctionPro — Real-Time Auction Platform

A **production-ready, full-stack real-time auction platform** built with React, Node.js, MongoDB, Socket.IO, and Stripe. Features live bidding, seller dashboards, admin panels, AI bid recommendations, and more.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, Framer Motion, Recharts |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Cache | Redis (ioredis) |
| Real-Time | Socket.IO |
| Auth | JWT, bcryptjs, Google OAuth |
| Payments | Stripe |
| Email | Nodemailer (SMTP) |
| Storage | Cloudinary / Local |
| DevOps | Docker + Docker Compose |

---

## 📁 Project Structure

```
auction-platform/
├── backend/
│   ├── config/
│   │   ├── db.js                  # MongoDB connection
│   │   ├── redis.js               # Redis connection + cache helpers
│   │   └── cloudinary.js          # Cloudinary + Multer config
│   ├── controllers/
│   │   ├── authController.js      # Register, login, OTP, OAuth, reset
│   │   ├── auctionController.js   # Auctions CRUD + live bidding + AI
│   │   └── userController.js      # Users, sellers, admin, payments, reviews
│   ├── middleware/
│   │   ├── auth.js                # JWT protect, authorize, isSeller, isAdmin
│   │   └── errorHandler.js        # Global error handler
│   ├── models/
│   │   ├── User.js                # User schema (buyer/seller/admin)
│   │   ├── Seller.js              # Seller profile schema
│   │   ├── Auction.js             # Auction schema with auto-extend
│   │   └── index.js               # Bid, Payment, Notification, Review,
│   │                              #   Watchlist, ChatMessage, Report models
│   ├── routes/
│   │   ├── auth.js                # /api/auth/*
│   │   ├── users.js               # /api/users/*
│   │   ├── sellers.js             # /api/sellers/*
│   │   ├── auctions.js            # /api/auctions/*
│   │   ├── bids.js                # /api/bids/*
│   │   ├── payments.js            # /api/payments/*
│   │   ├── admin.js               # /api/admin/*
│   │   ├── notifications.js       # /api/notifications/*
│   │   ├── reviews.js             # /api/reviews/*
│   │   ├── watchlist.js           # /api/watchlist/*
│   │   ├── chat.js                # /api/chat/*
│   │   └── analytics.js           # /api/analytics/*
│   ├── socket/
│   │   └── socketManager.js       # Socket.IO: bidding, chat, notifications
│   ├── utils/
│   │   ├── logger.js              # Winston logger
│   │   ├── tokenUtils.js          # JWT generation + cookie response
│   │   └── emailUtils.js          # Nodemailer OTP/welcome/outbid emails
│   ├── uploads/                   # Local image uploads (fallback)
│   ├── server.js                  # Express app entry point
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── assets/styles/
│   │   │   └── index.css          # Tailwind + custom glass/btn/timer styles
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── LoadingSpinner.js
│   │   │   │   ├── Navbar.js      # Top nav with notifications + user menu
│   │   │   │   └── Sidebar.js     # Collapsible dashboard sidebar
│   │   │   └── auction/
│   │   │       └── AuctionCard.js # AuctionCard + AuctionTimer + BidPanel
│   │   ├── context/
│   │   │   ├── AuthContext.js     # Global auth state + login/logout
│   │   │   └── NotificationContext.js  # Real-time notification state
│   │   ├── pages/
│   │   │   ├── HomePage.js        # Landing page with hero + live auctions
│   │   │   ├── AuctionsPage.js    # Browse + filter + paginate auctions
│   │   │   ├── AuctionDetailPage.js  # Live bidding + AI recommendation
│   │   │   ├── NotFoundPage.js
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.js
│   │   │   │   ├── RegisterPage.js
│   │   │   │   ├── VerifyOTPPage.js
│   │   │   │   ├── ForgotPasswordPage.js
│   │   │   │   ├── ResetPasswordPage.js
│   │   │   │   └── OAuthCallbackPage.js
│   │   │   ├── buyer/
│   │   │   │   ├── UserDashboard.js
│   │   │   │   ├── BidHistoryPage.js
│   │   │   │   ├── WatchlistPage.js
│   │   │   │   ├── WinsPage.js
│   │   │   │   ├── PaymentPage.js
│   │   │   │   └── ProfilePage.js
│   │   │   ├── seller/
│   │   │   │   ├── SellerDashboard.js
│   │   │   │   ├── CreateAuctionPage.js
│   │   │   │   ├── ManageAuctionsPage.js
│   │   │   │   ├── SellerAnalyticsPage.js
│   │   │   │   └── SellerProfilePage.js
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.js
│   │   │       ├── AdminUsersPage.js
│   │   │       ├── AdminAuctionsPage.js
│   │   │       └── AdminSellersPage.js
│   │   ├── services/
│   │   │   ├── api.js             # Axios instance + all API calls
│   │   │   └── socket.js          # Socket.IO client helpers
│   │   ├── App.js                 # Routes + providers
│   │   └── index.js
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── Dockerfile
│   └── .env.example
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Redis (local or Redis Cloud)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/auction-platform.git
cd auction-platform

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, SMTP, Stripe keys

# Frontend
cd ../frontend
cp .env.example .env
# Edit .env with API URL
```

### 3. Run Development Servers

```bash
# Terminal 1 - Backend (from /backend)
npm run dev

# Terminal 2 - Frontend (from /frontend)
npm start
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health: http://localhost:5000/health

---

## 🐳 Docker Setup (Recommended)

```bash
# Copy and configure env
cp .env.example .env
# Edit .env with your real values

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop
docker-compose down
```

Services started:
| Service | Port |
|---------|------|
| Frontend | 3000 |
| Backend API | 5000 |
| MongoDB | 27017 |
| Redis | 6379 |

---

## 🔑 Default Credentials (Development)

After first run, create admin via MongoDB:
```js
// In MongoDB shell or Compass
db.users.insertOne({
  name: "Admin User",
  email: "admin@auctionplatform.com",
  password: "$2a$12$...", // bcrypt hash of "Admin@123456"
  role: "admin",
  isVerified: true,
  isActive: true
})
```

Or set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env` and run:
```bash
node backend/utils/seedAdmin.js
```

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user/seller |
| POST | `/api/auth/verify-otp` | Verify email OTP |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/forgot-password` | Send reset email |
| POST | `/api/auth/reset-password` | Reset with token |
| GET | `/api/auth/google` | Google OAuth |

### Auctions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auctions` | List auctions (filter/search) |
| GET | `/api/auctions/featured` | Featured auctions |
| GET | `/api/auctions/:id` | Single auction |
| POST | `/api/auctions` | Create auction (seller) |
| PUT | `/api/auctions/:id` | Update auction |
| DELETE | `/api/auctions/:id` | Cancel auction |
| POST | `/api/auctions/:id/bid` | Place bid |
| GET | `/api/auctions/:id/bids` | Bid history |
| GET | `/api/auctions/:id/recommendation` | AI bid recommendation |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/create-intent` | Create Stripe intent |
| POST | `/api/payments/confirm` | Confirm payment |
| GET | `/api/payments/history` | Payment history |

---

## 🔌 Socket.IO Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join_auction` | `auctionId` | Join auction room |
| `leave_auction` | `auctionId` | Leave auction room |
| `join_notifications` | — | Subscribe to notifications |
| `join_chat` | `{auctionId, recipientId}` | Join chat room |
| `send_message` | `{auctionId, recipientId, message}` | Send chat message |
| `typing` | `{auctionId, recipientId, isTyping}` | Typing indicator |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `bid_update` | bid + auction data | New bid placed |
| `auction_update` | status/winner data | Auction status changed |
| `viewer_count` | `{auctionId, count}` | Live viewer count |
| `new_notification` | notification object | Real-time notification |
| `new_message` | message object | Chat message received |
| `user_typing` | `{userId, isTyping}` | Typing indicator |

---

## ✨ Features

- ✅ JWT + Google OAuth authentication with OTP email verification
- ✅ Real-time bidding via Socket.IO with auto-extend on last-minute bids
- ✅ AI-powered bid recommendation engine
- ✅ Seller dashboard with revenue analytics (Recharts)
- ✅ Admin panel: users, sellers, auctions management
- ✅ Stripe payment integration
- ✅ Watchlist with real-time price tracking
- ✅ Live viewer counter per auction
- ✅ Real-time chat between buyer and seller
- ✅ Cloudinary image uploads (with local fallback)
- ✅ Redis caching for performance
- ✅ Rate limiting, Helmet, CORS, Mongo sanitize security
- ✅ Toast notifications + animated UI (Framer Motion)
- ✅ Glassmorphism dark UI with Tailwind CSS
- ✅ Mobile responsive with collapsible sidebar
- ✅ Docker + Docker Compose ready

---

## 📄 License

MIT License — Free to use for personal and commercial projects.

---

## 👨‍💻 Built With ❤️ using AuctionPro Stack

> Perfect for final year college projects, portfolios, and production applications.
