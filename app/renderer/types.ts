export interface PerformanceMetrics {
  fps: number;
  longTasks: number;
  memoryUsage: number | null;
  memoryAllocations: number;
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

export interface InboxItem {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  timestamp: number;
}
