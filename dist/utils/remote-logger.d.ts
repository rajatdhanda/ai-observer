export declare class RemoteLogger {
    private static instance;
    private logs;
    private maxLogs;
    private constructor();
    static getInstance(): RemoteLogger;
    log(level: string, message: string, source?: string, details?: any): void;
    info(message: string, source?: string, details?: any): void;
    success(message: string, source?: string, details?: any): void;
    warning(message: string, source?: string, details?: any): void;
    error(message: string, source?: string, details?: any): void;
    debug(message: string, source?: string, details?: any): void;
    getLogs(limit?: number): any[];
    clear(): void;
    getRecentLogs(count?: number): any[];
    getRecentErrors(count?: number): any[];
    getDiagnostics(): any;
}
export declare const logger: RemoteLogger;
//# sourceMappingURL=remote-logger.d.ts.map