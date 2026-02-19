# htBe — Backend API + Admin Panel

Express.js backend for the HackTickets platform. Talks to the Solidity contract via `ethers.js` and serves the admin web panel via EJS views.

## Stack

- **Express.js** — REST API
- **ethers.js v5** — blockchain interaction
- **JWT** — auth for users and admins
- **EJS** — admin panel server-side views
- **express-rate-limit** — OTP brute-force protection

## Setup

```bash
npm install
cp .env.example .env   # fill in your values
npm run dev            # nodemon — auto-restarts on changes
# or
npm start              # plain node
```

> ⚠️ The contract must be deployed first (`cd htContract && npm run node && npm run deploy`) so that `deployment.json` exists before the backend starts.

## Environment Variables

```env
PORT=3000

# Hardhat local node (or Base Sepolia RPC URL for production)
RPC_URL=http://127.0.0.1:8545

# Wallet that owns the contract (Hardhat test account #0 by default)
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Salt for phone number hashing — CHANGE THIS IN PRODUCTION
SALT=your_secret_salt_here_change_this_in_production
```

## Project Structure

```
server.js               # Entry point — Express app + route mounting
config/
  blockchain.js         # ethers provider + signer + contract instance
controllers/
  authController.js     # OTP generation, JWT issuance
  eventController.js    # Create event, list, activate/deactivate
  ticketController.js   # Book ticket, my bookings, ticket by ID
  entryController.js    # Verify QR URL, confirm entry on-chain
  adminController.js    # Admin stats
middleware/
  auth.js               # JWT verification, requireAdmin guard
  rateLimiter.js        # OTP rate limiting
models/
  store.js              # In-memory store (OTPs, sessions)
routes/                 # Express routers (one per resource)
utils/
  crypto.js             # Phone hash, OTP generation
views/                  # EJS admin panel pages
  admin-login.ejs
  admin-dashboard.ejs
  admin-events.ejs
  admin-scanner.ejs
```

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/send-otp` | Send OTP to a phone number |
| POST | `/api/auth/verify-otp` | Verify OTP → returns JWT |

### Events
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/events` | — | List all events |
| GET | `/api/events/:id` | — | Get event by ID |
| POST | `/api/events` | Admin | Create event on-chain |
| PATCH | `/api/events/:id/status` | Admin | Activate / deactivate |

### Tickets
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/tickets/book` | User | Book ticket (mints on-chain) |
| GET | `/api/tickets/my-bookings` | User | Caller's tickets |
| GET | `/api/tickets/:id` | User | Ticket by ID |

### Entry
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/verifyme/:ticketId/:userToken` | Admin | Look up ticket from QR URL |
| POST | `/api/entry/confirm` | Admin | Confirm entry + mark used on-chain |

### System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check + chain info |

## Admin Panel

Served at `http://localhost:3000/admin` — pure HTML/JS/CSS inside EJS templates. No framework.

| Path | Page |
|------|------|
| `/admin/login` | OTP-based admin login |
| `/admin` | Dashboard — stats, recent events |
| `/admin/events` | Event management — create, activate/deactivate |
| `/admin/scanner` | QR scanner + manual URL entry for ticket verification |

## Dev Notes

- OTPs are printed to the server console in development (no SMS required).
- `deployment.json` is **committed** — the backend reads the contract address from it at startup.
- In-memory store resets on restart. For production, swap `models/store.js` with Redis.
