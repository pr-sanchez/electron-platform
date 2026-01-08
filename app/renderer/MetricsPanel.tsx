import React from 'react';
import type { PerformanceMetrics, ProcessMetrics } from './types';

interface MetricsPanelProps {
  perfMetrics: PerformanceMetrics;
  processMetrics: ProcessMetrics | null;
}

const MetricsPanel: React.FC<MetricsPanelProps> = ({
  perfMetrics,
  processMetrics,
}) => {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <div className="metrics-panel">
      <div className="metric-item">
        <div className="metric-label">Renderer FPS</div>
        <div className="metric-value">{perfMetrics.fps} fps</div>
      </div>

      <div className="metric-item">
        <div className="metric-label">Long Tasks</div>
        <div className="metric-value">{perfMetrics.longTasks}</div>
      </div>

      {perfMetrics.memoryUsage !== null && (
        <div className="metric-item">
          <div className="metric-label">Renderer Memory</div>
          <div className="metric-value">
            {formatBytes(perfMetrics.memoryUsage)}
          </div>
        </div>
      )}

      {perfMetrics.memoryAllocations > 0 && (
        <div className="metric-item">
          <div className="metric-label">Memory Allocations</div>
          <div className="metric-value">{perfMetrics.memoryAllocations}</div>
        </div>
      )}

      {processMetrics && (
        <>
          <div className="metric-item">
            <div className="metric-label">CPU Usage</div>
            <div className="metric-value">
              {processMetrics.cpuUsage.percentCPUUsage.toFixed(1)}%
            </div>
          </div>

          <div className="metric-item">
            <div className="metric-label">Process Memory</div>
            <div className="metric-value">
              {formatBytes(processMetrics.memory.workingSetSize)}
            </div>
          </div>

          <div className="metric-item">
            <div className="metric-label">Private Bytes</div>
            <div className="metric-value">
              {formatBytes(processMetrics.memory.privateBytes)}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MetricsPanel;
