/**
 * 9 Core Validation Rules for AI-Generated Code
 * Detects drift and issues in existing codebases
 */
import { ValidationSummary } from '../types/validation-types';
export declare class NineRulesValidator {
    private projectPath;
    private program;
    private checker;
    private results;
    constructor(projectPath: string);
    validateAll(): Promise<ValidationSummary>;
    /**
     * Rule 1: Type-Database Alignment (30% of bugs)
     * Two-way checking: Zod ↔ DB
     * Enhanced with runtime validation detection
     */
    private rule1_TypeDatabaseAlignment;
    /**
     * Rule 2: Hook-Database Pattern (25% of bugs)
     * Component → Hook → DB (never direct)
     * Enhanced with cross-layer type checking
     */
    private rule2_HookDatabasePattern;
    /**
     * Rule 3: Error Handling Chain (20% of bugs)
     */
    private rule3_ErrorHandlingChain;
    /**
     * Rule 4: Loading States (15% of bugs)
     */
    private rule4_LoadingStates;
    /**
     * Rule 5: API Type Safety (10% of bugs)
     */
    private rule5_APITypeSafety;
    /**
     * Rule 6: Registry Usage - No Raw Strings
     */
    private rule6_RegistryUsage;
    /**
     * Rule 7: Mutation Hygiene
     */
    private rule7_MutationHygiene;
    /**
     * Rule 8: Form Validation (Both Sides)
     */
    private rule8_FormValidation;
    /**
     * Rule 9: Auth Guard Matrix
     */
    private rule9_AuthGuardMatrix;
    /**
     * Helper Methods
     */
    private checkTwoWayValidation;
    private findFiles;
    private getFilesRecursive;
    private calculateScore;
    private generateSummary;
    /**
     * Generate actionable report
     */
    generateReport(summary: ValidationSummary): string;
    /**
     * Check for large files that AI might struggle with
     */
    private checkFileSizeWarnings;
    /**
     * Check for duplicate function definitions
     */
    private checkDuplicateFunctions;
    /**
     * Check if exports match what's expected (no missing data)
     */
    private checkExportCompleteness;
}
export declare function runValidation(projectPath?: string): Promise<void>;
//# sourceMappingURL=nine-rules-validator.d.ts.map