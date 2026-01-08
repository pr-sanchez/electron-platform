/**
 * Electron main process entry point
 * 
 * Security defaults:
 * - contextIsolation: true (isolates preload from renderer)
 * - sandbox: true (when possible, restricts renderer capabilities)
 * - nodeIntegration: false (renderer cannot access Node.js APIs directly)
 */

import { app, BrowserWindow, ipcMain, shell, crashReporter } from 'electron';
import * as path from 'path';
import type { AppInfo, ProcessMetrics, LogLevel } from '../shared/ipc-types';
import { createLogEntry } from '../shared/logger';
import { MainLogger } from './logger';

// Initialize crash reporter
crashReporter.start({
  submitURL: '', // Empty for POC - in production, configure a crash reporting service
  uploadToServer: false,
});

const logger = new MainLogger();

let mainWindow: BrowserWindow | null = null;
let metricsInterval: NodeJS.Timeout | null = null;

/**
 * Create the main application window with secure defaults
 */
function createWindow(): void {
  const isDev = process.env.NODE_ENV === 'development';
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      // Security: isolate context, disable node integration in renderer
      contextIsolation: true,
      sandbox: true, // Restricts renderer capabilities
      nodeIntegration: false, // Renderer cannot access Node.js APIs
      preload: isDev
        ? path.join(__dirname, '../preload/index.js')
        : path.join(__dirname, '../preload/index.js'),
      // Additional security headers
      webSecurity: true,
    },
    titleBarStyle: 'default',
  });

  // Load the renderer
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, renderer is at ../renderer/index.html relative to main
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
    stopMetricsSampling();
  });

  // Handle renderer process crashes
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    logger.error('renderer-crashed', {
      reason: details.reason,
      exitCode: details.exitCode,
    });
  });

  // Handle child process crashes
  app.on('child-process-gone', (_event, details) => {
    logger.error('child-process-gone', {
      type: details.type,
      reason: details.reason,
      exitCode: details.exitCode,
    });
  });

  logger.info('window-created', {});
}

/**
 * Start periodic metrics sampling
 * Samples CPU and memory usage every 2 seconds
 */
function startMetricsSampling(): void {
  if (metricsInterval) return;

  metricsInterval = setInterval(async () => {
    if (!mainWindow) return;

    try {
      const cpuUsage = process.getCPUUsage();
      const memoryInfo = await process.getProcessMemoryInfo();

      const metrics: ProcessMetrics = {
        cpuUsage: {
          percentCPUUsage: cpuUsage.percentCPUUsage,
          idleWakeupsPerSecond: cpuUsage.idleWakeupsPerSecond,
        },
        memory: {
          privateKB: memoryInfo.private,
          residentSetKB: memoryInfo.residentSet,
          sharedKB: memoryInfo.shared,
        },
        timestamp: Date.now(),
      };

      mainWindow.webContents.send('metrics:on', metrics);
    } catch (error) {
      logger.error('metrics-sampling-error', { error: String(error) });
    }
  }, 2000); // Sample every 2 seconds
}

function stopMetricsSampling(): void {
  if (metricsInterval) {
    clearInterval(metricsInterval);
    metricsInterval = null;
  }
}

// IPC Handlers

/**
 * Get app information
 */
ipcMain.handle('app:get-info', (): AppInfo => {
  return {
    version: app.getVersion(),
    platform: process.platform,
    arch: process.arch,
  };
});

/**
 * Start metrics streaming
 */
ipcMain.handle('metrics:on', () => {
  startMetricsSampling();
  return null;
});

/**
 * Stop metrics streaming
 */
ipcMain.handle('metrics:off', () => {
  stopMetricsSampling();
  return null;
});

/**
 * Log entry from renderer (validated and forwarded to main logger)
 */
ipcMain.handle('log:write', (_event, data: { level: LogLevel; event: string; payload?: unknown }) => {
  // Basic validation
  if (!data || typeof data.level !== 'string' || typeof data.event !== 'string') {
    logger.warn('invalid-log-entry', { data });
    return;
  }

  const entry = createLogEntry(data.level, 'renderer', data.event, data.payload);
  logger.writeEntry(entry);
});

/**
 * Simulate CPU work (no-op in main, handled in renderer)
 */
ipcMain.handle('command:simulate-cpu-work', () => {
  logger.info('command-simulate-cpu-work', {});
  // CPU work simulation happens in renderer
});

/**
 * Simulate memory leak (no-op in main, handled in renderer)
 */
ipcMain.handle('command:simulate-memory-leak', (_event, data: { start: boolean }) => {
  logger.info('command-simulate-memory-leak', { start: data?.start });
  // Memory leak simulation happens in renderer
});

/**
 * Trigger error (no-op in main, handled in renderer)
 */
ipcMain.handle('command:trigger-error', () => {
  logger.info('command-trigger-error', {});
  // Error simulation happens in renderer
});

/**
 * Open logs folder in system file manager
 */
ipcMain.handle('command:open-logs-folder', async () => {
  try {
    const logsPath = logger.getLogsDirectory();
    await shell.openPath(logsPath);
    logger.info('logs-folder-opened', { path: logsPath });
  } catch (error) {
    logger.error('open-logs-folder-error', { error: String(error) });
  }
});

// App lifecycle

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopMetricsSampling();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopMetricsSampling();
  logger.info('app-quitting', {});
});

// Global error handlers
process.on('uncaughtException', (error) => {
  logger.error('uncaught-exception', { error: error.message, stack: error.stack });
});

process.on('unhandledRejection', (reason) => {
  logger.error('unhandled-rejection', { reason: String(reason) });
});
