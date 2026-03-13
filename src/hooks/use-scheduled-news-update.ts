"use client";

import { useEffect, useCallback } from 'react';

interface ScheduledUpdateConfig {
  updateHour: number; // 0-23 format (12 = noon, 0 = midnight)
  onUpdateTime: () => Promise<void>;
}

const LAST_UPDATE_KEY = 'newswave_last_update';
const UPDATE_INTERVAL_CHECK = 60000; // Check every minute

/**
 * Hook to schedule news updates at a specific time daily (e.g., 12 PM)
 * @param config Configuration with update hour and callback
 */
export function useScheduledNewsUpdate({ updateHour, onUpdateTime }: ScheduledUpdateConfig) {
  const shouldUpdate = useCallback(() => {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Check if we're in the update hour (between update hour and update hour + 1 minute)
    if (currentHour !== updateHour) {
      return false;
    }

    // Check localStorage to see if we've already updated today
    try {
      const lastUpdate = localStorage.getItem(LAST_UPDATE_KEY);
      if (lastUpdate) {
        const lastUpdateDate = new Date(lastUpdate);
        const today = new Date();
        
        // If last update was today at the same hour, skip
        if (
          lastUpdateDate.getDate() === today.getDate() &&
          lastUpdateDate.getMonth() === today.getMonth() &&
          lastUpdateDate.getFullYear() === today.getFullYear() &&
          lastUpdateDate.getHours() === updateHour
        ) {
          return false;
        }
      }
      return true;
    } catch {
      return true;
    }
  }, [updateHour]);

  const recordUpdate = useCallback(() => {
    try {
      localStorage.setItem(LAST_UPDATE_KEY, new Date().toISOString());
    } catch {
      // Silently fail if localStorage isn't available
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const checkAndUpdate = async () => {
      if (shouldUpdate()) {
        try {
          await onUpdateTime();
          recordUpdate();
        } catch (error) {
          console.error('Error updating news:', error);
        }
      }
    };

    // Check immediately on mount
    checkAndUpdate();

    // Then check every minute
    interval = setInterval(checkAndUpdate, UPDATE_INTERVAL_CHECK);

    return () => clearInterval(interval);
  }, [shouldUpdate, onUpdateTime, recordUpdate]);
}
