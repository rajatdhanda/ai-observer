export declare class ProjectContextDetector {
    private projectPath;
    constructor(projectPath: string);
    detectFramework(): string;
    findEntryPoints(): string[];
    findApiRoutes(): string[];
    detectDatabase(): string;
    getKeyDependencies(): Record<string, string>;
    detectEnvVars(): string[];
    getBuildCommands(): Record<string, string>;
    private walkDir;
}
//# sourceMappingURL=project-context-detector.d.ts.map