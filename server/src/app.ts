/**
 * app.ts
 * ------
 * Server entry point for the T-World AI Post Creation API.
 *
 * Responsibilities:
 *  - Load environment variables from .env before any other imports.
 *  - Override the system DNS resolver to use Google's public DNS (8.8.8.8).
 *    This fixes MongoDB SRV record resolution on restrictive networks (e.g.
 *    corporate firewalls or mobile hotspots that block SRV queries).
 *  - Register all Express middleware (CORS, JSON body parsing).
 *  - Mount all API route groups under the /api prefix.
 *  - Connect to MongoDB Atlas and start the HTTP server.
 *  - If the DB connection fails, start the server in "fallback mode" so the
 *    AI features remain testable even without a live database.
 *
 * Environment variables required (see .env.example):
 *  - MONGODB_URI   — Atlas connection string
 *  - GEMINI_API_KEY — Google AI Studio API key
 *  - GEMINI_MODEL  — Model name (e.g. gemini-3.5-flash-lite)
 *  - PORT          — HTTP port (default: 5000)
 */

import 'dotenv/config';       // Must be first — populates process.env before anything else
import dns from 'dns';
// Override the default DNS resolver with Google's public DNS servers.
// Many mobile hotspots and corporate networks block DNS SRV queries (used by
// MongoDB's mongodb+srv:// connection string). Switching to 8.8.8.8 bypasses
// the ISP/carrier DNS and allows SRV resolution to work correctly.
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dns.setDefaultResultOrder('ipv4first'); // Prefer IPv4 addresses to avoid IPv6 routing issues

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import aiRoutes from './routes/ai.routes';
import fileRoutes from './routes/files.routes';
import postsRoutes from './routes/posts.routes';
import { errorHandler } from './middleware/error-handler';

const app = express();

// ── Middleware ──────────────────────────────────────────────────────────────
// Allow all origins in development. In production, replace with a whitelist:
//   app.use(cors({ origin: 'https://app.t-world.com' }));
app.use(cors());

// Parse incoming JSON request bodies (required for all AI and post endpoints)
app.use(express.json());

// ── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/ai', aiRoutes);       // POST /api/ai/generate-post, /suggest-hashtags, etc.
app.use('/api/files', fileRoutes);  // GET /api/files, POST /api/files/upload
app.use('/api/posts', postsRoutes); // GET /api/posts, POST /api/posts

// ── Global Error Handler ────────────────────────────────────────────────────
// Catches any errors thrown in route handlers and returns a consistent JSON
// error shape. Must be registered AFTER all routes.
app.use(errorHandler);

export default app;

// ── Database Connection & Server Start ─────────────────────────────────────
// Only start the server when this file is run directly (not when imported
// in tests), following the standard Node.js `require.main === module` pattern.
if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  mongoose
    .connect(process.env.MONGODB_URI!, {
      family: 4,                       // Force IPv4 socket connections
      serverSelectionTimeoutMS: 10000, // Fail fast after 10 seconds
      connectTimeoutMS: 10000,
    })
    .then(() => {
      // Happy path: DB connected — start the HTTP server normally
      console.log('✅ Connected to MongoDB');
      app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    })
    .catch((err) => {
      // Fallback path: DB unavailable — start anyway so AI can still be tested.
      // All DB operations in services gracefully check mongoose.connection.readyState
      // before querying, so nothing crashes when running in this fallback mode.
      console.error('\n⚠️  WARNING: Failed to connect to MongoDB! (Network/DNS Blocked).');
      console.error('⚠️  Starting server in fallback mode so you can still test the AI.\n');
      app.listen(PORT, () => console.log(`Server running on port ${PORT} (Fallback Mode)`));
    });
}
