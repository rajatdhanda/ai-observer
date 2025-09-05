/**
 * Table-to-Code Mapper
 * Maps how each database table flows through the application
 */
export interface TableMapping {
    tables: Map<string, TableUsage>;
    summary: {
        totalTables: number;
        fullyMapped: number;
        partiallyMapped: number;
        unmapped: number;
    };
    issues: TableIssue[];
}
export interface TableUsage {
    tableName: string;
    typeDefinition?: {
        file: string;
        line: number;
        hasZodSchema: boolean;
        schemaName?: string;
    };
    databaseQueries: {
        file: string;
        operations: string[];
        hasValidation: boolean;
    }[];
    hooks: {
        file: string;
        hookName: string;
        operations: string[];
        hasErrorHandling: boolean;
        hasLoadingState: boolean;
        usedInComponents?: string[];
    }[];
    components: {
        file: string;
        componentName: string;
        usage: 'display' | 'input' | 'both';
        directDBAccess: boolean;
    }[];
    apiEndpoints: {
        route: string;
        methods: string[];
        hasValidation: boolean;
    }[];
    mutations: {
        file: string;
        mutationName: string;
        hasCacheInvalidation: boolean;
    }[];
    dataFlow: {
        complete: boolean;
        chain: string[];
        missingLinks: string[];
    };
    score: number;
}
export interface TableIssue {
    table: string;
    type: 'critical' | 'warning';
    issue: string;
    suggestion: string;
    file?: string;
}
export declare class TableMapper {
    private projectPath;
    private tables;
    private issues;
    private program;
    private checker;
    constructor(projectPath: string);
    analyze(): Promise<TableMapping>;
    private discoverTables;
    private extractTablesFromFile;
    private looksLikeTable;
    private normalizeTableName;
    private mapDatabaseQueries;
    private findComponentsUsingHook;
    private mapHooks;
    private mapComponents;
    private mapAPIEndpoints;
    private mapMutations;
    private validateDataFlow;
    private calculateScores;
    private generateSummary;
    private getFiles;
    private getAllFiles;
}
//# sourceMappingURL=table-mapper.d.ts.map