/**
 * Shared logger interface and utilities
 */

import type { LogLevel, LogEntry } from './ipc-types';

export interface Logger {
  debug(event: string, payload?: unknown): void;
  info(event: string, payload?: unknown): void;
  warn(event: string, payload?: unknown): void;
  error(event: string, payload?: unknown): void;
}

export function createLogEntry(
  level: LogLevel,
  scope: 'main' | 'renderer',
  event: string,
  payload?: unknown
): LogEntry {
  return {
    timestamp: Date.now(),
    level,
    scope,
    event,
    payload,
  };
}
