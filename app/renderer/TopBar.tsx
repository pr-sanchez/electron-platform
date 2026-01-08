import React, { useState } from 'react';
import { useLogger } from './hooks/useLogger';
import type { PerformanceMetrics, ProcessMetrics } from './types';

interface TopBarProps {
  perfMetrics: PerformanceMetrics;
  processMetrics: ProcessMetrics | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const TopBar: React.FC<TopBarProps> = ({ perfMetrics, searchQuery, onSearchChange }) => {
  const logger = useLogger();
  const [memoryLeakActive, setMemoryLeakActive] = useState(false);

  const handleSimulateCpuWork = (): void => {
    logger.info('simulate-cpu-work-clicked', {});
    
    // Heavy computation to block main thread
    const start = performance.now();
    let result = 0;
    while (performance.now() - start < 1000) {
      // Simulate CPU-intensive work
      result += Math.sqrt(Math.random() * 1000000);
    }
    logger.info('simulate-cpu-work-completed', { duration: performance.now() - start });
  };

  const handleSimulateMemoryLeak = (): void => {
    const start = !memoryLeakActive;
    setMemoryLeakActive(start);
    
    // Dispatch custom event for memory leak hook
    window.dispatchEvent(new CustomEvent('memory-leak-toggle', { detail: { start } }));
    
    if (window.electronAPI) {
      window.electronAPI.commands.simulateMemoryLeak(start);
    }
    logger.info('simulate-memory-leak-toggled', { start });
  };

  const handleTriggerError = (): void => {
    logger.info('trigger-error-clicked', {});
    if (window.electronAPI) {
      window.electronAPI.commands.triggerError();
    }
    // Throw an error to test error boundary (use setTimeout to avoid breaking React render)
    setTimeout(() => {
      throw new Error('Simulated error triggered from UI');
    }, 0);
  };

  const handleOpenLogsFolder = (): void => {
    if (window.electronAPI) {
      window.electronAPI.commands.openLogsFolder();
    }
    logger.info('open-logs-folder-clicked', {});
  };

  // Calculate health status
  const getHealthStatus = (): 'ok' | 'warn' | 'error' => {
    if (perfMetrics.longTasks > 5 || perfMetrics.fps < 30) {
      return 'error';
    }
    if (perfMetrics.longTasks > 2 || perfMetrics.fps < 50) {
      return 'warn';
    }
    return 'ok';
  };

  const healthStatus = getHealthStatus();

  return (
    <div className="top-bar">
      <input
        type="text"
        className="search-input"
        placeholder="Search..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      
      <div className="health-widget">
        <div className={`health-indicator health-${healthStatus}`} />
        <span>Health: {healthStatus.toUpperCase()}</span>
      </div>

      <button className="btn btn-warning" onClick={handleSimulateCpuWork}>
        Simulate CPU Work
      </button>
      
      <button
        className={`btn ${memoryLeakActive ? 'btn-danger' : 'btn-secondary'}`}
        onClick={handleSimulateMemoryLeak}
      >
        {memoryLeakActive ? 'Stop Memory Leak' : 'Simulate Memory Leak'}
      </button>
      
      <button className="btn btn-danger" onClick={handleTriggerError}>
        Trigger Error
      </button>
      
      <button className="btn btn-secondary" onClick={handleOpenLogsFolder}>
        Open Logs Folder
      </button>
    </div>
  );
};

export default TopBar;
