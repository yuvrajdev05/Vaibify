/**
 * VAIBIFY - Backend Server
 * Production-ready Express server configured for Render deployment.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { musicRouter } from './routes/music.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Production-safe CORS allowing Android apps and web clients
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (such as mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);

app.use(express.json());

// Mandatory Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'vaibify-backend',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// Mount Music API routes
app.use('/api/music', musicRouter);

// Global fallback 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found on VAIBIFY backend.' });
});

// Render requires listening on 0.0.0.0
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[VAIBIFY] Backend listening on port ${PORT} (0.0.0.0)`);
});
