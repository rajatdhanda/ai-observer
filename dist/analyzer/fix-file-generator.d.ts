import { Issue, IssueBucket } from '../types/analysis-types';
import { ProjectContextDetector } from './project-context-detector';
export declare class FixFileGenerator {
    private projectPath;
    private issues;
    private projectType;
    private hasPayments;
    private hasAuth;
    private hasDatabase;
    private hasAPI;
    private contextDetector;
    constructor(projectPath: string, issues: Issue[], projectType: string, hasPayments: boolean, hasAuth: boolean, hasDatabase: boolean, hasAPI: boolean, contextDetector: ProjectContextDetector);
    generateEnhancedFixFile(buckets: IssueBucket[]): void;
    private getIssuesByRule;
    private loadPreviousState;
    private saveState;
}
//# sourceMappingURL=fix-file-generator.d.ts.map