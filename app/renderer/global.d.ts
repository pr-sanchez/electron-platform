/**
 * Global type declarations for renderer process
 */

import type { AppInfo, ProcessMetrics, LogLevel } from '@shared/ipc-types';

declare global {
  interface Window {
    electronAPI: {
      getAppInfo(): Promise<AppInfo>;
      onMetrics(callback: (metrics: ProcessMetrics) => void): () => void;
      log(level: LogLevel, event: string, payload?: unknown): void;
      commands: {
        simulateCpuWork(): void;
        simulateMemoryLeak(start: boolean): void;
        triggerError(): void;
        openLogsFolder(): void;
      };
    };
  }
}

export {};
