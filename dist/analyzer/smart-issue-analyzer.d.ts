export interface Issue {
    file: string;
    line: number;
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    category?: string;
    feature?: string;
    impacts?: string[];
    suggestion?: string;
    rule?: string;
}
export interface IssueBucket {
    name: 'BLOCKERS' | 'STRUCTURAL' | 'COMPLIANCE';
    title: string;
    description: string;
    color: string;
    priority: number;
    issues: Issue[];
    count: number;
}
export interface IssueGroup {
    group: number;
    title: string;
    why: string;
    fixes: Array<{
        file: string;
        issue: string;
        fix: string;
    }>;
}
export declare class SmartIssueAnalyzer {
    private projectPath;
    private issues;
    private projectType;
    private hasPayments;
    private hasAuth;
    private hasDatabase;
    private hasAPI;
    constructor(projectPath: string);
    analyze(): Promise<void>;
    private detectProjectFeatures;
    private collectAllIssues;
    private checkObserverSetup;
    private getValidatorSystemIssues;
    private categorizeValidatorRule;
    private categorizeRule;
    private organizeBuckets;
    private isBlockerIssue;
    private isStructuralIssue;
    private runTypeScriptCheck;
    private checkEnvironmentVariables;
    private runESLintCheck;
    private checkSecurityIssues;
    private runDesignSystemValidation;
    private isCriticalEnvVar;
    private getErrorSeverity;
    private categorizeError;
    private getSuggestion;
    private createSmartGroups;
    private loadPreviousState;
    private saveState;
    private generateEnhancedFixFile;
    private getIssuesByRule;
    private detectFramework;
    private findEntryPoints;
    private findApiRoutes;
    private detectDatabase;
    private getKeyDependencies;
    private detectEnvVars;
    private getBuildCommands;
    private walkDir;
}
//# sourceMappingURL=smart-issue-analyzer.d.ts.map