// Load environment variables FIRST
import './config.js';

import express from 'express';
import cors from 'cors';
import { networkInterfaces } from 'os';
import { uploadImage } from './routes/upload.js';
import { analyzeFood } from './routes/analyze.js';
import { handleRevenueCatWebhook } from './routes/revenuecatWebhook.js';
import { getCreditsBalance } from './routes/credits.js';
import { requireAuth } from './middleware/requireAuth.js';
import { verifyEnv } from './config.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Verify environment variables are loaded
const envValid = verifyEnv();
if (!envValid) {
  console.warn('⚠️  Some environment variables are missing. Server may not work correctly.');
}

// CORS configuration - allow all origins for development
app.use(cors({
  origin: '*', // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
}));

// Handle OPTIONS preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.sendStatus(200);
});

// Middleware - IMPORTANT: Only parse JSON for non-multipart routes
// Multer handles multipart/form-data, so we skip JSON parsing for upload endpoint
app.use((req, res, next) => {
  // Skip body parsing for multipart/form-data (handled by multer)
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    return next();
  }
  // Parse JSON and URL-encoded for other routes
  express.json()(req, res, (err) => {
    if (err) return next(err);
    express.urlencoded({ extended: true })(req, res, next);
  });
});

// Enhanced logging middleware for debugging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${timestamp} - ${req.method} ${req.path}`);
  console.log('Request IP:', req.ip || req.connection?.remoteAddress);
  console.log('User-Agent:', req.headers['user-agent']);
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Content-Length:', req.headers['content-length']);
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request body (first 500 chars):', JSON.stringify(req.body).substring(0, 500));
  }
  
  if (req.query && Object.keys(req.query).length > 0) {
    console.log('Query params:', req.query);
  }
  
  // Log response when it finishes
  const originalSend = res.send;
  res.send = function(data) {
    console.log(`Response status: ${res.statusCode}`);
    if (res.statusCode >= 400) {
      console.error('Error response:', data?.toString()?.substring(0, 500));
    }
    return originalSend.call(this, data);
  };
  
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({ 
    status: 'ok', 
    message: 'Calorie Watcher API is running',
    timestamp: new Date().toISOString(),
    env: {
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasAWS: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
      hasBucket: !!process.env.AWS_S3_BUCKET_NAME,
      region: process.env.AWS_REGION,
    }
  });
});

// Routes
app.post('/api/upload', uploadImage);
app.post('/api/analyze', analyzeFood);
app.post('/api/revenuecat/webhook', handleRevenueCatWebhook);
app.get('/api/credits/balance', requireAuth, getCreditsBalance);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('\n=== EXPRESS ERROR HANDLER ===');
  console.error('Error type:', err?.constructor?.name);
  console.error('Error message:', err?.message);
  console.error('Error stack:', err?.stack);
  console.error('Request path:', req.path);
  console.error('Request method:', req.method);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    path: req.path,
    method: req.method,
  });
});

// Get all network interfaces to display available IPs
function getNetworkIPs() {
  const interfaces = networkInterfaces();
  const ips = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push({
          name: name,
          address: iface.address,
        });
      }
    }
  }
  
  return ips;
}

app.listen(PORT, '0.0.0.0', () => {
  const networkIPs = getNetworkIPs();
  
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Calorie Watcher Backend Server');
  console.log('='.repeat(60));
  console.log(`Server running on port ${PORT}`);
  console.log(`Listening on all network interfaces (0.0.0.0)`);
  console.log(`\n📍 Accessible at:`);
  console.log(`   • http://localhost:${PORT} (local only)`);
  
  if (networkIPs.length > 0) {
    console.log(`\n🌐 Network IP addresses (use these for mobile device):`);
    networkIPs.forEach(({ name, address }) => {
      console.log(`   • http://${address}:${PORT} (${name})`);
      console.log(`     Health check: http://${address}:${PORT}/health`);
    });
  } else {
    console.log(`\n⚠️  No network interfaces found. Check your network connection.`);
  }
  
  console.log('\n💡 TIP: If using mobile hotspot, use the IP from your hotspot adapter');
  console.log('='.repeat(60) + '\n');
});
