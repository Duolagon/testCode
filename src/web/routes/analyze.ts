import { Router } from 'express';
import * as path from 'node:path';
import { loadConfig } from '../../config/index.js';
import { analyzeProject } from '../../core/analyzer/index.js';

export function analyzeRoutes(options: { projectPath: string }) {
  const router = Router();

  router.post('/analyze', async (req, res) => {
    try {
      const projectPath = path.resolve(req.body.path || options.projectPath);
      const config = await loadConfig(projectPath);
      const info = await analyzeProject(projectPath, config);
      res.json(info);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  return router;
}
