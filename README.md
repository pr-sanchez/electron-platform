# Electron Platform POC

A production-shaped Electron desktop application demonstrating clean architecture, performance awareness, observability, and robust error handling.

## Features

### Architecture

- **Clean separation**: Main process (Node.js/TypeScript) vs Renderer process (React/TypeScript)
- **Secure IPC**: Context isolation enabled, sandbox mode, no direct Node.js access in renderer
- **Typed IPC**: Type-safe communication via preload bridge

### Performance Instrumentation

- **Renderer metrics**: FPS estimation, long task detection, memory usage (Chromium)
- **Process metrics**: CPU and memory sampling from main process (every 2 seconds)
- **Health monitoring**: Visual health indicator based on performance thresholds

### Observability

- **Structured logging**: JSON logs written to `app.getPath('userData')/logs`
- **Log forwarding**: Renderer logs forwarded to main process via IPC
- **Log viewer**: Button to open logs folder in system file manager

### Error Handling

- **React Error Boundary**: Catches component errors with fallback UI
- **Global handlers**: Captures `window.onerror` and `unhandledrejection`
- **Crash reporting**: Monitors renderer process crashes
- **Safe reload**: Reload window command for recovery

### UI

- **Virtualized list**: 1000-item inbox list with react-window
- **Detail view**: Selected item content display
- **Search**: Real-time filtering of inbox items
- **Metrics panel**: Real-time performance metrics display

## Project Structure

```
electron-platform-poc/
├── app/
│   ├── main/           # Electron main process (Node.js/TypeScript)
│   │   ├── index.ts    # Main entry point
│   │   └── logger.ts   # Structured logging implementation
│   ├── preload/        # Preload script (IPC bridge)
│   │   └── index.ts    # Typed IPC API exposure
│   ├── renderer/       # React application (Vite)
│   │   ├── main.tsx    # React entry point
│   │   ├── App.tsx     # Root component
│   │   ├── components/ # UI components
│   │   └── hooks/      # Custom React hooks
│   └── shared/         # Shared types and utilities
│       ├── ipc-types.ts # IPC type definitions
│       └── logger.ts    # Logger interface
├── dist/               # Build output
└── package.json
```

## Setup

### Prerequisites

- Node.js 18+ (or pnpm)
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install
# or
pnpm install
```

### Development

```bash
# Start development server (hot reload for renderer + Electron)
npm run dev
```

This will:

1. Start Vite dev server for renderer (http://localhost:5173)
2. Compile main and preload processes
3. Launch Electron with DevTools open

### Build

```bash
# Build for production
npm run build
```

This compiles:

- Main process → `dist/main/`
- Preload script → `dist/preload/`
- Renderer → `dist/renderer/`

### Package

```bash
# Create distributable package
npm run package
```

Outputs to `release/` directory.

## Architecture Notes

### Main vs Renderer Separation

**Main Process** (`app/main/`):

- Creates and manages application windows
- Handles system-level operations (file system, logs)
- Samples process metrics (CPU, memory)
- Validates and processes IPC requests
- Security: Full Node.js API access

**Renderer Process** (`app/renderer/`):

- React UI application
- No direct Node.js access
- Communicates via typed IPC bridge (`window.electronAPI`)
- Security: Sandboxed, isolated context

**Preload Script** (`app/preload/`):

- Runs in isolated context with Node.js access
- Exposes minimal typed API via `contextBridge`
- Validates IPC communication
- Security: Bridge between main and renderer

### IPC Communication Pattern

1. **Renderer** calls `window.electronAPI.commandName()`
2. **Preload** forwards to main via `ipcRenderer.invoke()`
3. **Main** handles via `ipcMain.handle()` with validation
4. **Response** flows back through the same path

All IPC channels are typed via `app/shared/ipc-types.ts`.

### Security Defaults

- `contextIsolation: true` - Isolates preload from renderer
- `sandbox: true` - Restricts renderer capabilities
- `nodeIntegration: false` - Renderer cannot access Node.js
- `webSecurity: true` - Enforces web security standards

## Testing Simulations

### Simulate CPU Work

1. Click "Simulate CPU Work" button
2. Observe:
   - FPS drops significantly
   - Long tasks counter increases
   - Health indicator turns red
   - UI becomes unresponsive for ~1 second

### Simulate Memory Leak

1. Click "Simulate Memory Leak" button
2. Observe:
   - Memory allocations counter increases
   - Renderer memory usage grows (if available)
   - Process memory increases
3. Click "Stop Memory Leak" to halt allocation

### Trigger Error

1. Click "Trigger Error" button
2. Observe:
   - Error boundary UI appears
   - Error details displayed
   - "Reload App" button available
   - Error logged to main process logs

### View Logs

1. Click "Open Logs Folder" button
2. System file manager opens logs directory
3. Log files are JSON-formatted with timestamps

## Logs Location

Logs are stored in:

- **Windows**: `%APPDATA%/electron-platform-poc/logs/`
- **macOS**: `~/Library/Application Support/electron-platform-poc/logs/`
- **Linux**: `~/.config/electron-platform-poc/logs/`

Log files are named: `app-YYYY-MM-DD.log`

Log format (JSON):

```json
{
  "timestamp": 1234567890123,
  "level": "info",
  "scope": "main",
  "event": "window-created",
  "payload": {}
}
```

## Metrics Collection

### Renderer Metrics

- **FPS**: Estimated via `requestAnimationFrame` (updated every second)
- **Long Tasks**: Detected via `PerformanceObserver` (fallback: timing-based)
- **Memory**: `performance.memory` (Chromium only, sampled every 2 seconds)
- **Memory Allocations**: Counter for leak simulation

### Process Metrics (from Main)

- **CPU Usage**: `process.getCPUUsage()` (sampled every 2 seconds)
- **Memory**: `process.getProcessMemoryInfo()` (working set, private bytes)

Metrics are sent to renderer via IPC and displayed in the metrics panel.

## Performance Thresholds

Health status is calculated based on:

- **OK**: FPS ≥ 50, Long tasks ≤ 2
- **WARN**: FPS < 50 or Long tasks > 2
- **ERROR**: FPS < 30 or Long tasks > 5

## Development Notes

### TypeScript Configuration

- **Renderer**: `tsconfig.json` (ES modules, React JSX)
- **Main**: `tsconfig.main.json` (CommonJS, Node.js types)
- **Preload**: `tsconfig.preload.json` (CommonJS, Node.js types)

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npm run typecheck
```

## Limitations & Fallbacks

1. **Long Task Detection**: Falls back to timing-based detection if `PerformanceObserver` with `longtask` is not supported
2. **Memory Usage**: Only available in Chromium (`performance.memory`), gracefully handles absence
3. **Crash Reporting**: Configured but not submitting to external service (POC)

## License

MIT
