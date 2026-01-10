import { useState, useEffect } from 'react';
import ErrorBoundary from './ErrorBoundary';
import InboxView from './InboxView';
import VoiceRecordingView from './VoiceRecordingView';
import TopBar from './TopBar';
import MetricsPanel from './MetricsPanel';
import Loader from './Loader';
import { ThemeContext } from './contexts/ThemeContext';
import { usePerformanceMetrics } from './hooks/usePerformanceMetrics';
import { useProcessMetrics } from './hooks/useProcessMetrics';
import { useLogger } from './hooks/useLogger';

type TabType = 'inbox' | 'voice';

function App() {
  const logger = useLogger();
  const perfMetrics = usePerformanceMetrics();
  const processMetrics = useProcessMetrics();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('inbox');

  useEffect(() => {
    logger.info('app-mounted', {});

    // Simulate app initialization
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); // Show loader for 1.5 seconds

    return () => clearTimeout(timer);
  }, [logger]);

  const [theme, setTheme] = useState('light');

  const toggleTheme = (): void => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {isLoading ? (
        <Loader />
      ) : (
        <ErrorBoundary>
          <div className="app">
            <TopBar
              perfMetrics={perfMetrics}
              processMetrics={processMetrics}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
            {activeTab === 'inbox' ? (
              <InboxView searchQuery={searchQuery} />
            ) : (
              <VoiceRecordingView />
            )}
            <MetricsPanel
              perfMetrics={perfMetrics}
              processMetrics={processMetrics}
            />
          </div>
        </ErrorBoundary>
      )}
    </ThemeContext.Provider>
  );
}

export default App;
