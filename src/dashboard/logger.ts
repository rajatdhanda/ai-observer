import * as fs from 'fs';
import * as path from 'path';

export class DashboardLogger {
  private logFile: string;
  private errorFile: string;

  constructor(projectPath: string) {
    const logDir = path.join(projectPath, '.observer', 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().split('T')[0];
    this.logFile = path.join(logDir, `dashboard-${timestamp}.log`);
    this.errorFile = path.join(logDir, `dashboard-errors-${timestamp}.log`);
  }

  log(level: 'INFO' | 'WARN' | 'ERROR', message: string, context?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      context,
      pid: process.pid,
      memory: process.memoryUsage(),
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    
    // Write to appropriate file
    if (level === 'ERROR') {
      fs.appendFileSync(this.errorFile, logLine);
    }
    fs.appendFileSync(this.logFile, logLine);
    
    // Also console log for immediate visibility
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

  getRecentLogs(lines: number = 100): string[] {
    try {
      const logs = fs.readFileSync(this.logFile, 'utf-8').split('\n').filter(Boolean);
      return logs.slice(-lines);
    } catch {
      return [];
    }
  }

  getRecentErrors(lines: number = 50): string[] {
    try {
      const errors = fs.readFileSync(this.errorFile, 'utf-8').split('\n').filter(Boolean);
      return errors.slice(-lines);
    } catch {
      return [];
    }
  }
}