/**
 * Boundary Validator
 * Ensures payload verification at EVERY data transfer point
 */
interface BoundaryValidation {
    boundary: string;
    location: string;
    hasValidation: boolean;
    validationType?: string;
    issue?: string;
}
export declare class BoundaryValidator {
    private projectPath;
    private boundaries;
    private boundaryPatterns;
    constructor(projectPath: string);
    analyze(): {
        boundaries: BoundaryValidation[];
        coverage: number;
        critical: BoundaryValidation[];
    };
    private scanProject;
    private analyzeFile;
    private checkWebhookHandlers;
    private checkQueueHandlers;
    private checkThirdPartyAdapters;
    private checkForValidation;
    private checkForWebhookValidation;
    private checkForQueueValidation;
    private checkForResponseValidation;
    private getValidationType;
    private getIssueDescription;
    private getLineNumber;
    private getTypeScriptFiles;
    generateReport(): string;
    private groupByType;
}
export {};
//# sourceMappingURL=boundary-validator.d.ts.map