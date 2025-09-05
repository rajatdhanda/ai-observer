interface SchemaVersion {
    name: string;
    version: string;
    filePath: string;
    hash: string;
    hasBreakingChanges?: boolean;
    deprecationDate?: string;
}
interface VersionViolation {
    schema: string;
    issue: string;
    severity: 'error' | 'warning';
    suggestion: string;
}
export declare class VersionValidator {
    private projectPath;
    private schemasPath;
    private changelogPath;
    private schemaHashes;
    private violations;
    constructor(projectPath: string);
    validate(): {
        violations: VersionViolation[];
        schemas: SchemaVersion[];
        coverage: number;
    };
    private scanSchemas;
    private extractVersion;
    private extractSchemaName;
    private extractDeprecationDate;
    private checkVersioning;
    private checkBreakingChanges;
    private checkDeprecations;
    private checkChangelog;
    private isBreakingChange;
    private getStoredVersion;
    private getNextVersion;
    private getContentHash;
    private loadStoredHashes;
    private saveStoredHashes;
    generateReport(): string;
}
export {};
//# sourceMappingURL=version-validator.d.ts.map