import { Router } from 'express';
import { loadConfig } from '../../config/index.js';

export function configRoutes(options: { projectPath: string }) {
  const router = Router();
  let overrides: Record<string, unknown> = {};

  router.get('/config', async (_req, res) => {
    try {
      const config = await loadConfig(options.projectPath, overrides as any);
      // Sanitize: don't expose API key
      const sanitized = {
        ...config,
        ai: { ...config.ai, apiKey: config.ai.apiKey ? '***' : '' },
        projectPath: options.projectPath,
      };
      res.json(sanitized);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  router.post('/config', (req, res) => {
    overrides = { ...overrides, ...req.body };
    res.json({ ok: true });
  });

  return router;
}
