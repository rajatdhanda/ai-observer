/**
 * Comprehensive Contract Validator
 * Validates ALL entities against contracts.yaml comprehensively
 * Checks Golden Examples, Components, Types, and Database layers
 */
interface ContractViolation {
    entity: string;
    file: string;
    line?: number;
    property: string;
    expected: string;
    actual: string;
    message: string;
    severity: 'critical';
    fix: string;
}
export declare class ComprehensiveContractValidator {
    private projectPath;
    private violations;
    private contracts;
    private propertyMappings;
    constructor(projectPath: string);
    validate(): ContractViolation[];
    private loadContracts;
    private buildPropertyMappings;
    private validateGoldenExamples;
    private validateObject;
    private validateAllComponents;
    private scanDirectory;
    private validateComponentFile;
    private validateTypeDefinitions;
    private validateDatabaseSchemas;
    private isForeignKeyReference;
    private isDescriptiveUIField;
    private determineEntityContext;
    getStats(): {
        total: number;
        critical: number;
    };
}
export {};
//# sourceMappingURL=comprehensive-contract-validator.d.ts.map