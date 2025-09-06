/**
 * Cross-Layer Validator
 * Validates alignment between Types → Contracts → Golden Examples → UI Components
 * Catches misalignments early in the chain before they cascade to components
 */
interface CrossLayerIssue {
    layer1: string;
    layer2: string;
    file: string;
    property?: string;
    expected?: string;
    actual?: string;
    message: string;
    severity: 'critical' | 'high' | 'medium';
    fix: string;
}
export declare class CrossLayerValidator {
    private projectPath;
    private issues;
    private typeDefinitions;
    private contractSchemas;
    private goldenExamples;
    constructor(projectPath: string);
    validate(): CrossLayerIssue[];
    private loadTypeDefinitions;
    private extractTypeProperties;
    private parseProperties;
    private loadContracts;
    private parseContracts;
    private loadGoldenExamples;
    private validateContractsAgainstTypes;
    private compareContractToType;
    private validateGoldenAgainstContracts;
    private traverseGolden;
    private validateGoldenAgainstTypes;
    private validateScreenData;
    private checkPropertiesAlignment;
    private checkItemProperties;
    private validateComponentUsage;
    private checkComponentsInDir;
    private analyzeComponent;
    private hasContractProperty;
    private snakeToCamel;
    private screenNameToType;
    private isEntityContext;
    private isDescriptiveUIField;
    getStats(): {
        total: number;
        critical: number;
        high: number;
        medium: number;
    };
}
export {};
//# sourceMappingURL=cross-layer-validator.d.ts.map