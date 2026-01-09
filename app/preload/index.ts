/**
 * Preload script - bridges IPC communication between renderer and main
 *
 * Security: This script runs in an isolated context with access to Node.js APIs.
 * It exposes a minimal, typed API to the renderer via contextBridge.
 * The renderer cannot access Node.js APIs directly.
 */

import { contextBridge, ipcRenderer } from 'electron';
import type { AppInfo, ProcessMetrics, LogLevel } from '../shared/ipc-types';

/**
 * Typed IPC API exposed to renderer
 */
const electronAPI = {
  /**
   * Get app information
   */
  getAppInfo: async (): Promise<AppInfo> => {
    return ipcRenderer.invoke('app:get-info');
  },

  /**
   * Subscribe to metrics updates
   */
  onMetrics: (callback: (metrics: ProcessMetrics) => void): (() => void) => {
    // Start metrics streaming
    ipcRenderer.invoke('metrics:on');

    // Listen for metrics updates
    const handler = (_event: unknown, metrics: ProcessMetrics) => {
      callback(metrics);
    };
    ipcRenderer.on('metrics:on', handler);

    // Return unsubscribe function
    return () => {
      ipcRenderer.removeListener('metrics:on', handler);
      ipcRenderer.invoke('metrics:off');
    };
  },

  /**
   * Log entry (forwarded to main process)
   */
  log: (level: LogLevel, event: string, payload?: unknown): void => {
    ipcRenderer.invoke('log:write', { level, event, payload });
  },

  /**
   * Commands
   */
  commands: {
    simulateMemoryLeak: (start: boolean): void => {
      ipcRenderer.invoke('command:simulate-memory-leak', { start });
    },
    triggerError: (): void => {
      ipcRenderer.invoke('command:trigger-error');
    },
  },
};

// Expose API to renderer via contextBridge
// This is the only way renderer can communicate with main process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type declaration for window.electronAPI (used in renderer)
declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}
