import express from 'express';
import { configRoutes } from './routes/config.js';
import { browseRoutes } from './routes/browse.js';
import { analyzeRoutes } from './routes/analyze.js';
import { runRoutes } from './routes/run.js';
import { reportRoutes } from './routes/report.js';
import { getIndexHtml } from './frontend/index.js';

export function createWebServer(options: { port: number; projectPath: string }) {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Serve the SPA
  app.get('/', (_req, res) => {
    res.type('html').send(getIndexHtml());
  });

  // API routes
  app.use('/api', configRoutes(options));
  app.use('/api', browseRoutes(options));
  app.use('/api', analyzeRoutes(options));
  app.use('/api', runRoutes(options));
  app.use('/api', reportRoutes(options));

  return app;
}
