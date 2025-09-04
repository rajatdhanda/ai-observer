// Remote Logger - Stores logs in memory for API access
export class RemoteLogger {
  private logs: Array<{timestamp: string, level: string, message: string, context?: any}> = [];
  private errors: Array<{timestamp: string, message: string, error: any}> = [];
  private maxLogs = 500;
  private maxErrors = 100;

  log(level: 'INFO' | 'WARN' | 'ERROR', message: string, context?: any) {
    const timestamp = new Date().toISOString();
    const entry = { timestamp, level, message, context };
    
    // Add to memory buffer
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest
    }
    
    // Also track errors separately
    if (level === 'ERROR') {
      this.errors.push({ timestamp, message, error: context });
      if (this.errors.length > this.maxErrors) {
        this.errors.shift();
      }
    }
    
    // Console output for local visibility
    if (level === 'ERROR') {
      console.error(`[${timestamp}] ERROR:`, message, context);
    } else if (level === 'WARN') {
      console.warn(`[${timestamp}] WARN:`, message);
    } else {
      console.log(`[${timestamp}] INFO:`, message);
    }
  }

  info(message: string, context?: any) {
    this.log('INFO', message, context);
  }

  warn(message: string, context?: any) {
    this.log('WARN', message, context);
  }

  error(message: string, error?: Error | any) {
    this.log('ERROR', message, {
      error: error?.message || error,
      stack: error?.stack,
      details: error
    });
  }

  getRecentLogs(limit: number = 100): any[] {
    return this.logs.slice(-limit);
  }

  getRecentErrors(limit: number = 50): any[] {
    return this.errors.slice(-limit);
  }
  
  getDiagnostics() {
    return {
      totalLogs: this.logs.length,
      totalErrors: this.errors.length,
      recentActivity: this.logs.slice(-10),
      recentErrors: this.errors.slice(-5),
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    };
  }
}