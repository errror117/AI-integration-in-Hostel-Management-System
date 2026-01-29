const express = require('express')
const connectDB = require('./utils/conn')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoose = require('mongoose')
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express()
const server = http.createServer(app);
// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for dev
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Make io accessible to our routers
app.set('io', io);

const port = 3000

connectDB();

// CORS Configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Security middleware
const { sanitizeBody, sanitizeQuery } = require('./utils/sanitize');
const mongoSanitize = require('express-mongo-sanitize');

app.use(helmet());
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(sanitizeBody);    // Sanitize request body
app.use(sanitizeQuery);   // Sanitize query parameters

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later'
});
app.use(limiter);

// Stricter rate limiting for chatbot
const chatbotLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 messages per minute
  message: 'Please slow down! Too many chatbot messages.'
});

app.use(express.json({ extended: false }));

// Root route - API welcome message
app.get('/', (req, res) => {
  res.json({
    message: 'Hostel Ease API Server',
    version: '1.0.0',
    status: 'running',
    documentation: '/api/health for health check',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      chatbot: '/api/chatbot'
    }
  });
});

// Health check endpoint for Render
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/complaint', require('./routes/complaintRoutes'));
app.use('/api/invoice', require('./routes/invoiceRoutes'));
app.use('/api/messoff', require('./routes/messoffRoutes'));
app.use('/api/request', require('./routes/requestRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/suggestion', require('./routes/suggestionRoutes'));

// AI-Enhanced Chatbot Routes (with rate limiting)
app.use('/api/chatbot', chatbotLimiter, require('./routes/chatbotRoutes'));

// New AI Feature Routes
app.use('/api/faq', require('./routes/faqRoutes'));
app.use('/api/notice', require('./routes/noticeRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// Admin Dashboard - Unified submissions view
app.use('/api/admin/dashboard', require('./routes/adminDashboardRoutes'));

// Export Routes - CSV/Excel downloads
app.use('/api/export', require('./routes/exportRoutes'));

// Super Admin Routes - Organization Management
app.use('/api/superadmin', require('./routes/superAdminRoutes'));

// Setup Routes - Initial Setup (TEMPORARY - Remove in production)
app.use('/api/setup', require('./routes/setupRoutes'));

// Subscription Routes - Billing & Plan Management
app.use('/api/subscription', require('./routes/subscriptionRoutes'));

// Branding Routes - Organization Customization
app.use('/api/branding', require('./routes/brandingRoutes'));

// Upload Routes - File Uploads
app.use('/api/upload', require('./routes/uploadRoutes'));

// Serve static files (uploaded files)  
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    await mongoose.connection.db.admin().ping();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      version: '1.0.0',
      features: {
        chatbot: 'active',
        aiFeatures: process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY ? 'enabled' : 'rule-based'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

server.listen(port, () => {
  console.log(`✅ Hostel Management System running on port ${port}`)
  console.log(`🤖 AI Features: ${process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY ? 'LLM Enabled ✓' : 'Rule-based only'}`)
  console.log(`⚡ Socket.io: Enabled for real-time updates`)
})
