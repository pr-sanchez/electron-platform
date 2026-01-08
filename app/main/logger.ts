/**
 * Main process logger
 * Writes structured JSON logs to files in app.getPath('userData')/logs
 */

import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import type { LogEntry } from '../shared/ipc-types';

export class MainLogger {
  private logsDirectory: string;
  private logFile: string;
  private writeQueue: LogEntry[] = [];
  private writeTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.logsDirectory = path.join(app.getPath('userData'), 'logs');
    this.ensureLogsDirectory();
    
    // Create log file with date stamp
    const dateStr = new Date().toISOString().split('T')[0];
    this.logFile = path.join(this.logsDirectory, `app-${dateStr}.log`);
  }

  private ensureLogsDirectory(): void {
    if (!fs.existsSync(this.logsDirectory)) {
      fs.mkdirSync(this.logsDirectory, { recursive: true });
    }
  }

  /**
   * Write log entry to file (batched for performance)
   */
  writeEntry(entry: LogEntry): void {
    this.writeQueue.push(entry);
    
    // Batch writes every 100ms or when queue reaches 10 entries
    if (this.writeQueue.length >= 10) {
      this.flush();
    } else if (!this.writeTimer) {
      this.writeTimer = setTimeout(() => {
        this.flush();
        this.writeTimer = null;
      }, 100);
    }
  }

  private flush(): void {
    if (this.writeQueue.length === 0) return;

    const entries = this.writeQueue.splice(0);
    const lines = entries.map(entry => JSON.stringify(entry)).join('\n') + '\n';

    try {
      fs.appendFileSync(this.logFile, lines, 'utf8');
    } catch (error) {
      // Fallback to console if file write fails
      console.error('Failed to write log:', error);
      entries.forEach(entry => console.log(JSON.stringify(entry)));
    }
  }

  debug(event: string, payload?: unknown): void {
    this.writeEntry({
      timestamp: Date.now(),
      level: 'debug',
      scope: 'main',
      event,
      payload,
    });
  }

  info(event: string, payload?: unknown): void {
    this.writeEntry({
      timestamp: Date.now(),
      level: 'info',
      scope: 'main',
      event,
      payload,
    });
  }

  warn(event: string, payload?: unknown): void {
    this.writeEntry({
      timestamp: Date.now(),
      level: 'warn',
      scope: 'main',
      event,
      payload,
    });
  }

  error(event: string, payload?: unknown): void {
    this.writeEntry({
      timestamp: Date.now(),
      level: 'error',
      scope: 'main',
      event,
      payload,
    });
  }

  getLogsDirectory(): string {
    return this.logsDirectory;
  }

  /**
   * Flush any pending writes before shutdown
   */
  shutdown(): void {
    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
      this.writeTimer = null;
    }
    this.flush();
  }
}
