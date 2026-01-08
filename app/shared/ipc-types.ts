/**
 * Shared IPC type definitions for type-safe communication
 * between main and renderer processes
 */

export interface AppInfo {
  version: string;
  platform: string;
  arch: string;
}

export interface ProcessMetrics {
  cpuUsage: {
    percentCPUUsage: number;
    idleWakeupsPerSecond: number;
  };
  memory: {
    workingSetSize: number;
    peakWorkingSetSize: number;
    privateBytes: number;
  };
  timestamp: number;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  scope: 'main' | 'renderer';
  event: string;
  payload?: unknown;
}

export interface IPCChannels {
  // App info
  'app:get-info': { request: void; response: AppInfo };
  
  // Metrics
  'metrics:on': { request: void; response: ProcessMetrics };
  'metrics:off': { request: void; response: void };
  
  // Logging
  'log:write': { request: { level: LogLevel; event: string; payload?: unknown }; response: void };
  
  // Commands
  'command:simulate-cpu-work': { request: void; response: void };
  'command:simulate-memory-leak': { request: { start: boolean }; response: void };
  'command:trigger-error': { request: void; response: void };
  'command:open-logs-folder': { request: void; response: void };
}

// Type helpers for IPC
export type IPCRequest<T extends keyof IPCChannels> = IPCChannels[T]['request'];
export type IPCResponse<T extends keyof IPCChannels> = IPCChannels[T]['response'];
