/**
 * Design System Validator - 80/20 Rule
 * High impact design system checks with minimal effort
 */
interface DesignViolation {
    type: 'import' | 'token' | 'component' | 'a11y';
    severity: 'error' | 'warning';
    file: string;
    line: number;
    message: string;
    suggestion: string;
}
export declare class DesignSystemValidator {
    private projectPath;
    private violations;
    private dsComponents;
    private allowedDSPaths;
    private detectedDSPath;
    private bannedImports;
    constructor(projectPath: string);
    private detectDesignSystem;
    validate(): {
        violations: DesignViolation[];
        score: number;
        summary: {
            imports: number;
            tokens: number;
            a11y: number;
            total: number;
        };
        designSystemPath: string;
    };
    private validateFile;
    private checkImportGuard;
    private checkTokenGuard;
    private checkComponentUsage;
    private checkA11yGuard;
    private getSourceFiles;
    private findLineNumber;
    private getLineIndex;
    generateReport(): string;
    private groupByType;
}
export {};
//# sourceMappingURL=design-system-validator.d.ts.map