import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';

// Route imports
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import waypointsRoutes from './routes/waypoints.js';
import catchEventsRoutes from './routes/catchEvents.js';
import fisherStatsRoutes from './routes/fisherStats.js';
import fisherPerformanceRoutes from './routes/fisherPerformance.js';
import fallbackRoutes from './routes/fallback.js';
import devRoutes from './routes/dev.js';

// Get current file directory for proper relative path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from parent directory FIRST
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PREFERRED_PORT = parseInt(process.env.SERVER_PORT, 10) || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'Server is running', time: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/waypoints', waypointsRoutes);
app.use('/api/catch-events', catchEventsRoutes);
app.use('/api/fisher-stats', fisherStatsRoutes);
app.use('/api/fisher-performance', fisherPerformanceRoutes);
app.use('/api/fallback', fallbackRoutes);

// Development-only routes
if (process.env.NODE_ENV !== 'production') {
  app.use('/api', devRoutes);
}

/**
 * Find an available port starting from the preferred port
 * @param {number} startPort - Port to start checking from
 * @param {number} maxAttempts - Maximum number of ports to try
 * @returns {Promise<number>} Available port
 */
async function findAvailablePort(startPort, maxAttempts = 10) {
  const checkPort = (port) => new Promise((resolve, reject) => {
    const tester = net.createServer()
      .once('error', reject)
      .once('listening', () => {
        tester.close(() => resolve(port));
      })
      .listen(port);
  });

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const portToTry = startPort + attempt;
    try {
      await checkPort(portToTry);
      if (attempt > 0) {
        console.warn(`Port ${startPort} in use. Falling back to ${portToTry}. Update SERVER_PORT if you need a specific port.`);
      }
      return portToTry;
    } catch (error) {
      if (error.code !== 'EADDRINUSE') {
        throw error;
      }
    }
  }

  throw new Error(`Unable to find an open port after checking ${maxAttempts} ports starting at ${startPort}`);
}

/**
 * Start the Express server
 */
async function startServer() {
  try {
    const port = await findAvailablePort(PREFERRED_PORT);
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Server available at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start the server:', error);
    process.exit(1);
  }
}

startServer();
