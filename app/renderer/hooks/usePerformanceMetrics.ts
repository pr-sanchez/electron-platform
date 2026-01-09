import { useState, useEffect, useRef } from 'react';
import type { PerformanceMetrics } from '../types';

/**
 * Hook to measure renderer performance metrics:
 * - FPS estimation
 * - Long task detection (via PerformanceObserver)
 * - Memory usage (if available in Chromium)
 */
export function usePerformanceMetrics(): PerformanceMetrics {
  const [fps, setFps] = useState(60);
  const [longTasks, setLongTasks] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState<number | null>(null);
  const [memoryAllocations, setMemoryAllocations] = useState(0);

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const longTaskCountRef = useRef(0);
  const memoryLeakDataRef = useRef<unknown[]>([]);

  // FPS estimation
  useEffect(() => {
    let animationFrameId: number;

    const measureFPS = () => {
      frameCountRef.current++;
      const now = performance.now();
      const elapsed = now - lastTimeRef.current;

      if (elapsed >= 1000) {
        const currentFPS = Math.round((frameCountRef.current * 1000) / elapsed);
        setFps(currentFPS);
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      animationFrameId = requestAnimationFrame(measureFPS);
    };

    animationFrameId = requestAnimationFrame(measureFPS);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  // Long task detection via PerformanceObserver
  useEffect(() => {
    let observer: PerformanceObserver | null = null;

    try {
      // Check if PerformanceObserver supports 'longtask' entry type
      if ('PerformanceObserver' in window) {
        observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(() => {
            longTaskCountRef.current++;
            setLongTasks(longTaskCountRef.current);
          });
        });

        observer.observe({ entryTypes: ['longtask'] });
      } else {
        // Fallback: detect long tasks manually using timing
        const checkLongTasks = () => {
          const start = performance.now();
          setTimeout(() => {
            const duration = performance.now() - start;
            if (duration > 50) {
              // Task longer than 50ms is considered "long"
              longTaskCountRef.current++;
              setLongTasks(longTaskCountRef.current);
            }
            checkLongTasks();
          }, 100);
        };
        checkLongTasks();
      }
    } catch (error) {
      // PerformanceObserver not supported or failed
      console.warn('Long task detection not available:', error);
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, []);

  // Memory usage (Chromium only)
  useEffect(() => {
    const checkMemory = () => {
      // @ts-expect-error - performance.memory is Chromium-specific
      if (performance.memory) {
        // @ts-expect-error
        const used = performance.memory.usedJSHeapSize;
        setMemoryUsage(used);
      }
    };

    const interval = setInterval(checkMemory, 2000);
    checkMemory();

    return () => clearInterval(interval);
  }, []);

  // Memory leak simulation listener
  useEffect(() => {
    const handleMemoryLeak = (event: Event) => {
      const customEvent = event as CustomEvent<{ start: boolean }>;
      if (customEvent.detail?.start) {
        // Start allocating memory
        const interval = setInterval(() => {
          const data = new Array(100000).fill(Math.random());
          memoryLeakDataRef.current.push(data);
          setMemoryAllocations(memoryLeakDataRef.current.length);
        }, 100);

        // Store interval ID to clear later
        (
          window as unknown as { memoryLeakInterval?: NodeJS.Timeout }
        ).memoryLeakInterval = interval;
      } else {
        // Stop and clear
        const interval = (
          window as unknown as { memoryLeakInterval?: NodeJS.Timeout }
        ).memoryLeakInterval;
        if (interval) {
          clearInterval(interval);
          memoryLeakDataRef.current = [];
          setMemoryAllocations(0);
        }
      }
    };

    window.addEventListener('memory-leak-toggle', handleMemoryLeak);

    return () => {
      window.removeEventListener('memory-leak-toggle', handleMemoryLeak);
      // Cleanup on unmount
      const interval = (
        window as unknown as { memoryLeakInterval?: NodeJS.Timeout }
      ).memoryLeakInterval;
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  return {
    fps,
    longTasks,
    memoryUsage,
    memoryAllocations,
  };
}
