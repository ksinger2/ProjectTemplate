import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { securityHeaders } from './middleware/security';
import { generalLimiter } from './middleware/rate-limit';
import apiRoutes from './routes';
import { setupSocket } from './socket';

const PORT = parseInt(process.env.PORT || '4000', 10);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// --- Startup Security Validation ---
if (process.env.NODE_ENV === 'production') {
  const weakPattern = /change|dev|secret/i;
  const jwtSecret = process.env.JWT_SECRET || '';
  const signingSecret = process.env.SIGNING_SECRET || '';

  if (weakPattern.test(jwtSecret)) {
    console.error('[FATAL] JWT_SECRET contains a weak/default value. Refusing to start in production.');
    process.exit(1);
  }
  if (weakPattern.test(signingSecret)) {
    console.error('[FATAL] SIGNING_SECRET contains a weak/default value. Refusing to start in production.');
    process.exit(1);
  }
}

const app = express();
const server = http.createServer(app);

// --- Middleware ---
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(securityHeaders);
app.use(generalLimiter);

// --- API Routes ---
app.use('/api', apiRoutes);

// --- Socket.io ---
setupSocket(server, FRONTEND_URL);

// --- Start ---
server.listen(PORT, () => {
  console.log(`[server] Blockbuster backend running on http://localhost:${PORT}`);
  console.log(`[server] Environment: ${process.env.NODE_ENV || 'development'}`);
});
