import { useState, useEffect } from 'react';
import ErrorBoundary from './ErrorBoundary';
import InboxView from './InboxView';
import TopBar from './TopBar';
import MetricsPanel from './MetricsPanel';
import { usePerformanceMetrics } from './hooks/usePerformanceMetrics';
import { useProcessMetrics } from './hooks/useProcessMetrics';
import { useLogger } from './hooks/useLogger';

function App() {
  const logger = useLogger();
  const perfMetrics = usePerformanceMetrics();
  const processMetrics = useProcessMetrics();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    logger.info('app-mounted', {});
  }, [logger]);

  return (
    <ErrorBoundary>
      <div className="app">
        <TopBar
          perfMetrics={perfMetrics}
          processMetrics={processMetrics}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <InboxView searchQuery={searchQuery} />
        <MetricsPanel
          perfMetrics={perfMetrics}
          processMetrics={processMetrics}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;
