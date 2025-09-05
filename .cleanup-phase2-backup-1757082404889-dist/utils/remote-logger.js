"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.RemoteLogger = void 0;
// Remote Logger - Stores logs in memory for dashboard display
class RemoteLogger {
    static instance;
    logs = [];
    maxLogs = 200;
    constructor() { }
    static getInstance() {
        if (!RemoteLogger.instance) {
            RemoteLogger.instance = new RemoteLogger();
        }
        return RemoteLogger.instance;
    }
    log(level, message, source, details) {
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
    info(message, source, details) {
        this.log('info', message, source, details);
    }
    success(message, source, details) {
        this.log('success', message, source, details);
    }
    warning(message, source, details) {
        this.log('warning', message, source, details);
    }
    error(message, source, details) {
        this.log('error', message, source, details);
    }
    debug(message, source, details) {
        this.log('debug', message, source, details);
    }
    getLogs(limit) {
        return limit ? this.logs.slice(0, limit) : this.logs;
    }
    clear() {
        this.logs = [];
    }
    getRecentLogs(count = 50) {
        return this.logs.slice(0, count);
    }
    getRecentErrors(count = 50) {
        return this.logs.filter(log => log.level === 'error').slice(0, count);
    }
    getDiagnostics() {
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
exports.RemoteLogger = RemoteLogger;
// Export singleton instance
exports.logger = RemoteLogger.getInstance();
