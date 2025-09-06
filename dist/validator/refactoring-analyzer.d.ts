/**
 * Smart Refactoring Impact Analysis Engine
 * Analyzes codebase impact for contract violations and generates safe refactoring plans
 */
interface RefactoringImpact {
    pattern: string;
    fromProperty: string;
    toProperty: string;
    entity: string;
    totalFiles: number;
    totalReferences: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    estimatedMinutes: number;
    affectedFiles: FileImpact[];
    executionSteps: ExecutionStep[];
    dependencyChain: string[];
}
interface FileImpact {
    path: string;
    type: 'contract' | 'type' | 'component' | 'database' | 'test';
    references: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    previewChanges: ChangePreview[];
}
interface ChangePreview {
    line: number;
    before: string;
    after: string;
    context: string;
}
interface ExecutionStep {
    step: number;
    description: string;
    files: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    automated: boolean;
}
export declare class RefactoringAnalyzer {
    private projectPath;
    constructor(projectPath: string);
    /**
     * Analyze impact of changing a property across the codebase
     */
    analyzeRefactoringImpact(fromProperty: string, toProperty: string, entity: string): RefactoringImpact;
    /**
     * Find all files that reference a specific property
     */
    findAffectedFiles(property: string): string[];
    /**
     * Recursively scan directory for files containing the property
     */
    private scanDirectoryForProperty;
    /**
     * Check if file is relevant for refactoring analysis
     */
    private isRelevantFile;
    /**
     * Check if file contains the property (using same logic as validation)
     */
    private fileContainsProperty;
    /**
     * Analyze impact for each affected file
     */
    private analyzeFileImpacts;
    /**
     * Count references to property in file content
     */
    private countReferences;
    /**
     * Determine file type for risk assessment
     */
    private determineFileType;
    /**
     * Calculate risk level for individual file
     */
    private calculateFileRisk;
    /**
     * Generate preview of changes for a file
     */
    private generatePreviewChanges;
    /**
     * Calculate overall risk level
     */
    private calculateOverallRisk;
    /**
     * Estimate time required for refactoring
     */
    private estimateTime;
    /**
     * Generate step-by-step execution plan
     */
    private generateExecutionPlan;
    /**
     * Build dependency chain for entity
     */
    private buildDependencyChain;
    /**
     * Get refactoring suggestions for current violations
     */
    getRefactoringSuggestions(violations: any[]): RefactoringImpact[];
}
export {};
//# sourceMappingURL=refactoring-analyzer.d.ts.map