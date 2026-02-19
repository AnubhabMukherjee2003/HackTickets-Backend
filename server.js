const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const { initializeBlockchain } = require('./config/blockchain');
const { getProvider, getSigner } = require('./config/blockchain');
const { ethers } = require('ethers');

const authRoutes   = require('./routes/auth');
const eventRoutes  = require('./routes/events');
const ticketRoutes = require('./routes/tickets');
const adminRoutes  = require('./routes/admin');
const entryRoutes  = require('./routes/entry');
const { confirmEntry } = require('./controllers/entryController');
const { authenticateToken, requireAdmin } = require('./middleware/auth');

const app  = express();
const port = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',       // Ionic/Vite dev server
  'http://localhost:3000',
  'http://localhost:8100',       // Ionic native dev port
  'capacitor://localhost',       // Capacitor Android/iOS
  'ionic://localhost',           // Ionic native webview
  'http://localhost',            // Android WebView (some versions)
  'https://hack-tickets-backend.vercel.app',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow any vercel.app preview deploy
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());
app.set('view engine', 'ejs');

// ─── Routes ──────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.render('index', {
    title: 'Decentralized Ticketing System',
    message: 'Web2 + Web3 Ticketing Platform'
  });
});

// ─── Admin Web Panel ──────────────────────────────────────────────────────────
app.get('/admin/login',   (_req, res) => res.render('admin-login'));
app.get('/admin',         (_req, res) => res.render('admin-dashboard'));
app.get('/admin/events',  (_req, res) => res.render('admin-events'));
app.get('/admin/scanner', (_req, res) => res.render('admin-scanner'));

app.use('/api/auth',    authRoutes);
app.use('/api/events',  eventRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/admin',   adminRoutes);

// QR entry flow — two steps mounted at root and /api/entry
app.use('/verifyme',         entryRoutes);
app.post('/api/entry/confirm', authenticateToken, requireAdmin, confirmEntry);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const provider = getProvider();
    const signer   = getSigner();
    const network  = await provider.getNetwork();
    const balance  = await provider.getBalance(signer.address);

    res.json({
      status: 'healthy',
      network: network.name,
      chainId: network.chainId.toString(),
      signerAddress: signer.address,
      signerBalance: ethers.utils.formatEther(balance)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Boot ─────────────────────────────────────────────────────────────────────
async function startServer() {
  try {
    await initializeBlockchain();
  } catch (error) {
    console.error('Failed to initialize blockchain:', error.message);
    console.error('Make sure Hardhat network is running: npm run node');
  }

  app.listen(port, () => {
    console.log(`\nServer running at http://localhost:${port}`);
    console.log('\n=== AUTH ===');
    console.log('  POST /api/auth/send-otp');
    console.log('  POST /api/auth/verify-otp');
    console.log('  POST /api/auth/refresh');
    console.log('\n=== PUBLIC ===');
    console.log('  GET  /api/events');
    console.log('  GET  /api/events/:eventId');
    console.log('  GET  /api/health');
    console.log('\n=== USER (protected) ===');
    console.log('  POST /api/tickets/book');
    console.log('  GET  /api/tickets/my-bookings?eventId=X');
    console.log('  GET  /api/tickets/all-bookings');
    console.log('\n=== ENTRY / QR (admin) ===');
    console.log('  GET  /verifyme/:ticketId/:userToken');
    console.log('  POST /api/entry/confirm');
    console.log('\n=== ADMIN ===');
    console.log('  POST  /api/admin/events');
    console.log('  PATCH /api/admin/events/:eventId/status');
    console.log('  GET   /api/admin/tickets/:ticketId');
    console.log('  POST  /api/admin/tickets/:ticketId/use');
    console.log(`\nAdmin phone: ${process.env.ADMIN_PHONE}`);
  });
}

startServer().catch(console.error);
