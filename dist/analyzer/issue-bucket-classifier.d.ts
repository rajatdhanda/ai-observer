import { Issue, IssueBucket } from '../types/analysis-types';
export declare class IssueBucketClassifier {
    private issues;
    constructor(issues: Issue[]);
    organizeBuckets(): IssueBucket[];
    private isBlockerIssue;
    private isStructuralIssue;
}
//# sourceMappingURL=issue-bucket-classifier.d.ts.map