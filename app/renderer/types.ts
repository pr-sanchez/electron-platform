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
    privateKB: number;
    residentSetKB: number;
    sharedKB: number;
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
