import { EventEmitter } from 'node:events';

export interface RunEvent {
  type: 'step' | 'log' | 'progress' | 'result' | 'complete' | 'error';
  runId: string;
  timestamp: number;
  data: {
    step?: string;
    message?: string;
    level?: 'info' | 'success' | 'warn' | 'error';
    progress?: { current: number; total: number };
    result?: Record<string, unknown>;
    summary?: Record<string, unknown>;
    error?: string;
    report?: string;
  };
}

class RunEventBus extends EventEmitter {
  emit(runId: string, event: RunEvent): boolean {
    return super.emit(runId, event);
  }

  on(runId: string, listener: (event: RunEvent) => void): this {
    return super.on(runId, listener);
  }

  off(runId: string, listener: (event: RunEvent) => void): this {
    return super.off(runId, listener);
  }

  emitLog(runId: string, level: RunEvent['data']['level'], message: string) {
    this.emit(runId, {
      type: 'log',
      runId,
      timestamp: Date.now(),
      data: { level, message },
    });
  }

  emitStep(runId: string, step: string) {
    this.emit(runId, {
      type: 'step',
      runId,
      timestamp: Date.now(),
      data: { step, message: step },
    });
  }

  emitProgress(runId: string, current: number, total: number) {
    this.emit(runId, {
      type: 'progress',
      runId,
      timestamp: Date.now(),
      data: { progress: { current, total } },
    });
  }

  emitResult(runId: string, result: Record<string, unknown>) {
    this.emit(runId, {
      type: 'result',
      runId,
      timestamp: Date.now(),
      data: { result },
    });
  }

  emitComplete(runId: string, summary: Record<string, unknown>) {
    this.emit(runId, {
      type: 'complete',
      runId,
      timestamp: Date.now(),
      data: { summary },
    });
  }

  emitError(runId: string, error: string) {
    this.emit(runId, {
      type: 'error',
      runId,
      timestamp: Date.now(),
      data: { error },
    });
  }
}

export const eventBus = new RunEventBus();
eventBus.setMaxListeners(100);
