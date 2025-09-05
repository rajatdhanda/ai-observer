export interface CTAIssue {
    file: string;
    line: number;
    type: 'missing_handler' | 'orphaned_text' | 'placeholder' | 'broken_link';
    element: string;
    text: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    suggestion: string;
}
export declare class CTAValidator {
    private projectPath;
    private issues;
    private ctaKeywords;
    constructor(projectPath: string);
    validate(): Promise<{
        issues: CTAIssue[];
        stats: any;
    }>;
    private scanDirectory;
    private shouldSkipDirectory;
    private isReactFile;
    private analyzeFile;
    private checkOrphanedCTAText;
    private detectElementType;
    private extractText;
    private addIssue;
    private generateStats;
}
//# sourceMappingURL=cta-validator.d.ts.map