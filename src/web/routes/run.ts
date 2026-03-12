import { Router } from 'express';
import { startRun, getRunState } from '../services/run-manager.js';
import { eventBus, type RunEvent } from '../services/event-bus.js';

export function runRoutes(_options: { projectPath: string }) {
  const router = Router();

  // Start a new run
  router.post('/run', (req, res) => {
    try {
      const config = req.body;
      if (!config.path) {
        res.status(400).json({ error: 'Project path is required' });
        return;
      }
      const runId = startRun(config);
      res.json({ runId });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // SSE event stream
  router.get('/run/:id/events', (req, res) => {
    const runId = req.params.id;
    const state = getRunState(runId);

    if (!state) {
      res.status(404).json({ error: 'Run not found' });
      return;
    }

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    // Send existing results for reconnection
    if (state.results.length > 0) {
      for (const result of state.results) {
        const event: RunEvent = {
          type: 'result',
          runId,
          timestamp: Date.now(),
          data: { result: result as any },
        };
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    }

    // If already completed, send complete event and close
    if (state.status === 'completed') {
      const event: RunEvent = {
        type: 'complete',
        runId,
        timestamp: Date.now(),
        data: { summary: state.summary },
      };
      res.write(`data: ${JSON.stringify(event)}\n\n`);
      res.end();
      return;
    }

    if (state.status === 'failed') {
      const event: RunEvent = {
        type: 'error',
        runId,
        timestamp: Date.now(),
        data: { error: state.error || 'Unknown error' },
      };
      res.write(`data: ${JSON.stringify(event)}\n\n`);
      res.end();
      return;
    }

    // Subscribe to future events
    const listener = (event: RunEvent) => {
      try {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      } catch {
        // Client disconnected
        eventBus.off(runId, listener);
      }

      if (event.type === 'complete' || event.type === 'error') {
        res.end();
      }
    };

    eventBus.on(runId, listener);

    // Cleanup on client disconnect
    req.on('close', () => {
      eventBus.off(runId, listener);
    });
  });

  // Get run results
  router.get('/run/:id/results', (req, res) => {
    const state = getRunState(req.params.id);
    if (!state) {
      res.status(404).json({ error: 'Run not found' });
      return;
    }
    res.json({
      status: state.status,
      results: state.results,
      summary: state.summary,
    });
  });

  return router;
}
