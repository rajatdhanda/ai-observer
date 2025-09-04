#!/usr/bin/env ts-node
/**
 * Map Generator - Creates codebase-map.json
 * Just facts, no opinions - simple grep/AST parsing
 * Auto-detects exports, imports, patterns
 */
interface FileMetrics {
    loc: number;
    functions: number;
    exports: number;
    imports: number;
    complexity: number;
}
interface CodebaseMap {
    meta: {
        generated: string;
        projectPath: string;
        fileCount: number;
    };
    exports: Record<string, Array<{
        name: string;
        line: number;
    }>>;
    imports: Record<string, string[]>;
    entryPoints: Record<string, {
        type: string;
        protected: boolean;
    }>;
    files: Record<string, {
        hasParse?: number;
        hasAuth?: number;
        hasTryCatch?: number;
        hasLoadingState?: number;
        hasErrorState?: number;
        hasFormValidation?: number;
        mutations?: string[];
        invalidates?: string[];
        metrics?: FileMetrics;
    }>;
    tables?: Record<string, {
        hooks: string[];
        components: string[];
        apis: string[];
        files: string[];
    }>;
}
export declare class MapGenerator {
    private projectPath;
    private map;
    constructor(projectPath: string);
    generate(): Promise<CodebaseMap>;
    private getAllFiles;
    private isRelevantFile;
    private processFile;
    private extractExports;
    private extractImports;
    private extractImportNames;
    private calculateMetrics;
    private analyzeFile;
    private findEntryPoints;
    private fileToRoute;
    private fileToApiRoute;
    private isProtectedRoute;
    private mapTablesToFunctions;
    saveToFile(outputPath: string): Promise<void>;
}
export {};
//# sourceMappingURL=map-generator.d.ts.map