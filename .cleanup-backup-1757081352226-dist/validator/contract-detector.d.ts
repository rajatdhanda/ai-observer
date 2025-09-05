/**
 * Contract Detector - Identifies missing and outdated contracts
 * Works with map.json to detect what needs contract definition
 */
interface Detection {
    type: 'missing' | 'outdated' | 'unused' | 'mismatch';
    entity: string;
    message: string;
    action: string;
    locations?: string[];
    fields?: string[];
}
export declare class ContractDetector {
    private mapPath;
    private projectPath?;
    private mapData;
    private contracts;
    private detections;
    constructor(mapPath: string, projectPath?: string | undefined);
    private loadData;
    private loadContractsFromDirectory;
    private aiFixes;
    /**
     * Main detection method
     */
    detect(): Detection[];
    /**
     * Detect entities in code that have no contract
     */
    private detectMissingContracts;
    /**
     * Detect fields used in code but not in contracts
     */
    private detectNewFields;
    /**
     * Detect contracts that aren't used in code
     */
    private detectUnusedContracts;
    /**
     * Detect snake_case vs camelCase mismatches
     */
    private detectNamingMismatches;
    /**
     * Helper methods
     */
    private readFileContent;
    private extractEntityName;
    private toSnakeCase;
    private toCamelCase;
    /**
     * Generate summary report
     */
    generateReport(): string;
}
export {};
//# sourceMappingURL=contract-detector.d.ts.map