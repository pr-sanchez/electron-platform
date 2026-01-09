import React, { useContext, useState } from 'react';
import { useLogger } from './hooks/useLogger';
import { ThemeContext } from './contexts/ThemeContext';
import type { PerformanceMetrics, ProcessMetrics } from './types';

interface TopBarProps {
  perfMetrics: PerformanceMetrics;
  processMetrics: ProcessMetrics | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

// Component that throws an error during render when shouldThrow is true
const ErrorThrower: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Simulated error triggered from UI');
  }
  return null;
};

const TopBar: React.FC<TopBarProps> = ({ searchQuery, onSearchChange }) => {
  const logger = useLogger();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [memoryLeakActive, setMemoryLeakActive] = useState(false);
  const [shouldThrowError, setShouldThrowError] = useState(false);

  document.documentElement.setAttribute('data-theme', theme);

  const handleSimulateMemoryLeak = (): void => {
    const start = !memoryLeakActive;
    setMemoryLeakActive(start);

    // Dispatch custom event for memory leak hook
    window.dispatchEvent(
      new CustomEvent('memory-leak-toggle', { detail: { start } })
    );

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
    // Trigger an error during render by setting state
    setShouldThrowError(true);
  };

  return (
    <div className="top-bar">
      <ErrorThrower shouldThrow={shouldThrowError} />
      <input
        type="text"
        className="search-input"
        placeholder="Search inbox items..."
        value={searchQuery}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onSearchChange(e.target.value)
        }
      />

      <button
        className={`btn ${memoryLeakActive ? 'btn-danger' : 'btn-secondary'}`}
        onClick={handleSimulateMemoryLeak}
      >
        {memoryLeakActive ? 'Stop Memory Leak' : 'Simulate Memory Leak'}
      </button>

      <button className="btn btn-danger" onClick={handleTriggerError}>
        Trigger Error
      </button>

      <button
        className="btn btn-secondary theme-toggle"
        onClick={toggleTheme}
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    </div>
  );
};

export default TopBar;
