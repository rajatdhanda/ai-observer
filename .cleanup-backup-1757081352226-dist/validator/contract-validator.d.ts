/**
 * Universal Contract Validator
 * Works with ANY folder structure, ANY database, ANY framework
 * Inspired by Postman's approach to API testing
 */
interface ValidationResult {
    entity: string;
    location: string;
    type: 'error' | 'warning';
    message: string;
    expected: string;
    actual: string;
    suggestion: string;
}
export declare class ContractValidator {
    private contracts;
    private results;
    private projectPath;
    constructor(projectPath: string);
    /**
     * Load contracts from yaml/json file
     * Searches for contracts.yaml, contracts.json, or .contracts
     */
    private loadContracts;
    /**
     * Main validation - scans entire project for contract violations
     */
    validate(): Promise<{
        score: number;
        violations: ValidationResult[];
        summary: string;
    }>;
    /**
     * Find all code files - works with ANY structure
     */
    private findAllFiles;
    private isRelevantFile;
    /**
     * Validate a single file against all contracts
     */
    private validateFile;
    /**
     * Smart detection - figure out if file is related to an entity
     * Works with ANY naming convention
     */
    private fileRelatedToEntity;
    /**
     * Validate file content against a specific contract
     */
    private validateAgainstContract;
    /**
     * Find common field name violations
     */
    private findFieldViolations;
    /**
     * Get common wrong variations of a field name
     */
    private getWrongVariations;
    /**
     * Validate hook returns correct shape
     */
    private validateHookReturn;
    /**
     * Validate component uses correct fields
     */
    private validateComponentUsage;
    /**
     * Calculate compliance score
     */
    private calculateScore;
    /**
     * Generate summary report
     */
    private generateSummary;
}
export {};
//# sourceMappingURL=contract-validator.d.ts.map