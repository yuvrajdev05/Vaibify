import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import musicRoutes from './server/routes/music.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // CORS middleware for mobile apps and cross-origin requests
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // API health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'vaibify-backend',
      tagline: 'Find Your Vibe.',
      timestamp: Date.now(),
    });
  });

  // Mount music routes
  app.use('/api/music', musicRoutes);

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VAIBIFY] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
