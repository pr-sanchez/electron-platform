import { useCallback } from 'react';
import type { LogLevel } from '@shared/ipc-types';

export function useLogger() {
  const log = useCallback(
    (level: LogLevel, event: string, payload?: unknown) => {
      if (window.electronAPI) {
        window.electronAPI.log(level, event, payload);
      }
    },
    []
  );

  return {
    debug: (event: string, payload?: unknown) => log('debug', event, payload),
    info: (event: string, payload?: unknown) => log('info', event, payload),
    warn: (event: string, payload?: unknown) => log('warn', event, payload),
    error: (event: string, payload?: unknown) => log('error', event, payload),
  };
}
