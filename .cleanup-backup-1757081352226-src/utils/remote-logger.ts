// Remote Logger - Stores logs in memory for dashboard display
export class RemoteLogger {
  private static instance: RemoteLogger;
  private logs: any[] = [];
  private maxLogs: number = 200;

  private constructor() {}

  static getInstance(): RemoteLogger {
    if (!RemoteLogger.instance) {
      RemoteLogger.instance = new RemoteLogger();
    }
    return RemoteLogger.instance;
  }

  log(level: string, message: string, source?: string, details?: any) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      source: source || 'observer',
      details: details ? JSON.stringify(details) : undefined
    };

    this.logs.unshift(entry);
    
    // Keep only the latest logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Also log to console for debugging
    const prefix = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      debug: '🔍'
    }[level] || '📝';

    console.log(`${prefix} [${source || 'observer'}] ${message}`);
  }

  info(message: string, source?: string, details?: any) {
    this.log('info', message, source, details);
  }

  success(message: string, source?: string, details?: any) {
    this.log('success', message, source, details);
  }

  warning(message: string, source?: string, details?: any) {
    this.log('warning', message, source, details);
  }

  error(message: string, source?: string, details?: any) {
    this.log('error', message, source, details);
  }

  debug(message: string, source?: string, details?: any) {
    this.log('debug', message, source, details);
  }

  getLogs(limit?: number): any[] {
    return limit ? this.logs.slice(0, limit) : this.logs;
  }

  clear() {
    this.logs = [];
  }

  getRecentLogs(count: number = 50): any[] {
    return this.logs.slice(0, count);
  }

  getRecentErrors(count: number = 50): any[] {
    return this.logs.filter(log => log.level === 'error').slice(0, count);
  }

  getDiagnostics(): any {
    const errorCount = this.logs.filter(log => log.level === 'error').length;
    const warningCount = this.logs.filter(log => log.level === 'warning').length;
    
    return {
      totalLogs: this.logs.length,
      errorCount,
      warningCount,
      lastLogTime: this.logs.length > 0 ? this.logs[0].timestamp : null
    };
  }
}

// Export singleton instance
export const logger = RemoteLogger.getInstance();