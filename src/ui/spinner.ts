import * as p from '@clack/prompts';

export function createSpinner(text: string) {
  const s = p.spinner();
  return {
    start: (msg?: string) => s.start(msg || text),
    stop: (msg?: string) => s.stop(msg),
    succeed: (msg?: string) => { s.stop(); if (msg) p.log.success(msg); },
    fail: (msg?: string) => { s.stop(); if (msg) p.log.error(msg); },
    warn: (msg?: string) => { s.stop(); if (msg) p.log.warn(msg); },
    info: (msg?: string) => { s.stop(); if (msg) p.log.info(msg); },
  };
}
