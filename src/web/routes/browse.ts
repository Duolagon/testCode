import { Router } from 'express';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export function browseRoutes(_options: { projectPath: string }) {
  const router = Router();

  router.post('/browse', async (req, res) => {
    try {
      const requestedPath = req.body.path || '/';
      const resolvedPath = path.resolve(requestedPath);

      const stat = await fs.stat(resolvedPath);
      if (!stat.isDirectory()) {
        res.status(400).json({ error: 'Not a directory' });
        return;
      }

      const entries = await fs.readdir(resolvedPath, { withFileTypes: true });
      const items = entries
        .filter(e => !e.name.startsWith('.'))
        .sort((a, b) => {
          // Directories first, then files
          if (a.isDirectory() && !b.isDirectory()) return -1;
          if (!a.isDirectory() && b.isDirectory()) return 1;
          return a.name.localeCompare(b.name);
        })
        .map(e => ({
          name: e.name,
          type: e.isDirectory() ? 'dir' : 'file',
          path: path.join(resolvedPath, e.name),
        }));

      const parentPath = path.dirname(resolvedPath);
      res.json({
        currentPath: resolvedPath,
        parentPath: parentPath !== resolvedPath ? parentPath : null,
        entries: items,
      });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  return router;
}
