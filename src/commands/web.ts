import * as path from 'node:path';
import { createWebServer } from '../web/server.js';
import { logger } from '../ui/logger.js';

interface WebOptions {
  port?: string;
  path?: string;
}

export async function handleWeb(options: WebOptions) {
  const port = parseInt(options.port ?? '3456', 10);
  const projectPath = path.resolve(options.path ?? '.');

  const app = createWebServer({ port, projectPath });

  app.listen(port, () => {
    logger.success(`Web UI running at http://localhost:${port}`);
    logger.info(`Project path: ${projectPath}`);
    logger.dim('Press Ctrl+C to stop');
  });
}
