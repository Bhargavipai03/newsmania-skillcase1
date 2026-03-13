
// utils/apiRotator.ts

// Define a simple structure for tracking API key usage.
// In a real system, this might be stored in Redis or a database.
export interface UsageInfo {
  count: number;
  lastReset: Date; // For daily/monthly limits
  // Add more fields as needed, e.g., for cost tracking
}

export class ApiRotator {
  private usageTracker: Map<string, UsageInfo>; // Key: "serviceName_key"

  constructor() {
    this.usageTracker = new Map<string, UsageInfo>();
    // In a real app, you might load initial usage data from persistent storage.
  }

  /**
   * Gets the next available API key for a given service.
   * This is a simplified stub. A real implementation would check rate limits,
   * key health, priority, etc.
   * @param service - The name of the service (e.g., "newsapi", "mediastack").
   * @param keys - An array of available keys for that service.
   * @returns The next key to use, or null if none are available.
   */
  getNextAvailableKey(service: string, keys: string[]): string | null {
    if (!keys || keys.length === 0) {
      console.warn(`No keys configured for service: ${service}`);
      return null;
    }
    // Simple rotation: just return the first key for now.
    // A real implementation would check usageTracker and rate limits.
    const keyToUse = keys[0];
    if (!keyToUse || keyToUse.startsWith("YOUR_")) {
        console.warn(`Placeholder or invalid key detected for service ${service}: ${keyToUse}`);
        return null;
    }
    return keyToUse;
  }

  /**
   * Records the usage of an API key.
   * @param service - The name of the service.
   * @param key - The API key used.
   * @param cost - Optional cost associated with the API call (e.g., tokens used).
   */
  recordUsage(service: string, key: string, cost?: number): void {
    const trackerKey = `${service}_${key}`;
    const currentUsage = this.usageTracker.get(trackerKey) || { count: 0, lastReset: new Date() };
    
    currentUsage.count += (cost || 1); // Increment by 1 if cost not specified
    this.usageTracker.set(trackerKey, currentUsage);
    
    // console.log(`Usage recorded for ${trackerKey}: Count ${currentUsage.count}`);
    // In a real app, persist this to a database or Redis.
  }

  /**
   * Checks if a specific key is available (e.g., not rate-limited).
   * This is a stub.
   * @param service - The name of the service.
   * @param key - The API key.
   * @returns True if the key is considered available, false otherwise.
   */
  isKeyAvailable(service: string, key: string): boolean {
    // Placeholder: always returns true.
    // A real implementation would check usageTracker against configured rate limits.
    const trackerKey = `${service}_${key}`;
    const usage = this.usageTracker.get(trackerKey);
    // Example: if (usage && usage.count >= dailyLimit) return false;
    return true;
  }

  /**
   * Resets daily rate limits.
   * This would typically be called by a cron job.
   */
  resetDailyLimits(): void {
    console.log("Simulating reset of daily API limits.");
    // Iterate through usageTracker and reset counts for keys with daily limits.
    // For simplicity, this example doesn't differentiate limit types (daily/monthly).
    this.usageTracker.forEach((usage, key) => {
      // Assuming all tracked keys have daily limits for this example
      this.usageTracker.set(key, { ...usage, count: 0, lastReset: new Date() });
    });
  }

  // Monthly reset logic would be similar but check against the month.
}
