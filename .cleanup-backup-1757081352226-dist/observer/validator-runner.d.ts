#!/usr/bin/env ts-node
/**
 * Validator Runner - Reads map.json and runs the 9 core validators
 * Each validator is simple: read map → check rule → return violations
 */
interface Violation {
    rule: string;
    severity: 'critical' | 'warning' | 'info';
    file: string;
    message: string;
    fix?: string;
}
export declare class ValidatorRunner {
    private map;
    private violations;
    private mapPath;
    constructor(mapPath: string);
    /**
     * Run all 9 core validators
     */
    runAll(): {
        violations: Violation[];
        score: number;
        summary: any;
        contractDetections?: any;
    };
    /**
     * Rule 1: Type-Database Alignment (30% of bugs)
     * Check: All DB functions must parse with Zod
     */
    private validateTypeDatabaseAlignment;
    /**
     * Rule 2: Hook-Database Pattern (25% of bugs)
     * Check: Components shouldn't import DB directly
     */
    private validateHookDatabasePattern;
    /**
     * Rule 3: Error Handling Chain (20% of bugs)
     * Check: Hooks must have error states, APIs must have try-catch
     */
    private validateErrorHandling;
    /**
     * Rule 4: Loading States (15% of bugs)
     * Check: Hooks must have loading states
     */
    private validateLoadingStates;
    /**
     * Rule 5: API Type Safety (10% of bugs)
     * Check: APIs must parse input/output
     */
    private validateAPITypeSafety;
    /**
     * Rule 6: Registry Usage (Low impact)
     * Check: No raw route strings
     */
    private validateRegistryUsage;
    /**
     * Rule 7: Cache Invalidation (Low impact)
     * Check: Mutations must invalidate cache
     */
    private validateCacheInvalidation;
    /**
     * Rule 8: Form Validation (Low impact)
     * Check: Forms must have validation
     */
    private validateFormValidation;
    /**
     * Rule 9: Auth Guards (Medium impact)
     * Check: Protected routes must have auth
     */
    private validateAuthGuards;
    /**
     * Contract Detection - Find missing/outdated contracts
     */
    private validateContracts;
    /**
     * Calculate health score based on violations
     */
    private calculateScore;
    /**
     * Generate summary statistics
     */
    private generateSummary;
    /**
     * Print results to console
     */
    printResults(): void;
}
export {};
//# sourceMappingURL=validator-runner.d.ts.map