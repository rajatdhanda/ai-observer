/**
 * Validation Types - Extracted for better maintainability
 * Used by validation rules and analysis systems
 */
export interface ValidationResult {
    rule: string;
    ruleNumber: number;
    status: 'pass' | 'fail' | 'warning';
    score: number;
    issues: ValidationIssue[];
    coverage: {
        checked: number;
        passed: number;
        total: number;
    };
}
export interface ValidationIssue {
    severity: 'critical' | 'warning' | 'info';
    file: string;
    line?: number;
    message: string;
    suggestion: string;
    codeSnippet?: string;
}
export interface ValidationSummary {
    overallScore: number;
    passedRules: number;
    totalRules: number;
    criticalIssues: number;
    warnings: number;
    results: ValidationResult[];
    metrics: {
        contractCoverage: number;
        parseCoverage: number;
        dbDriftScore: number;
        cacheHygiene: number;
        authCoverage: number;
    };
}
//# sourceMappingURL=validation-types.d.ts.map