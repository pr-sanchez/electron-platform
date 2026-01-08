import { useState, useEffect } from 'react';
import type { ProcessMetrics } from '@shared/ipc-types';

/**
 * Hook to receive and track process metrics from main process
 */
export function useProcessMetrics(): ProcessMetrics | null {
  const [metrics, setMetrics] = useState<ProcessMetrics | null>(null);

  useEffect(() => {
    if (!window.electronAPI) return;

    const unsubscribe = window.electronAPI.onMetrics((newMetrics) => {
      setMetrics(newMetrics);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return metrics;
}
