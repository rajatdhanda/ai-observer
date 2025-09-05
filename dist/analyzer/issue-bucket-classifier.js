"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IssueBucketClassifier = void 0;
class IssueBucketClassifier {
    issues;
    constructor(issues) {
        this.issues = issues;
    }
    organizeBuckets() {
        const buckets = [
            {
                name: 'BLOCKERS',
                title: 'Critical Runtime Issues',
                description: 'Issues that prevent the application from running or cause crashes',
                color: '#ef4444',
                priority: 1,
                issues: [],
                count: 0
            },
            {
                name: 'STRUCTURAL',
                title: 'Important Architectural Issues',
                description: 'Issues that affect code organization, maintainability, and reliability',
                color: '#f59e0b',
                priority: 2,
                issues: [],
                count: 0
            },
            {
                name: 'COMPLIANCE',
                title: 'Code Quality & Standards Issues',
                description: 'Issues that improve code quality, consistency, and best practices',
                color: '#3b82f6',
                priority: 3,
                issues: [],
                count: 0
            }
        ];
        // Classify issues into buckets based on rule and severity
        for (const issue of this.issues) {
            if (this.isBlockerIssue(issue)) {
                buckets[0].issues.push(issue);
            }
            else if (this.isStructuralIssue(issue)) {
                buckets[1].issues.push(issue);
            }
            else {
                buckets[2].issues.push(issue);
            }
        }
        // Update counts
        buckets.forEach(bucket => {
            bucket.count = bucket.issues.length;
        });
        return buckets.filter(bucket => bucket.count > 0); // Only return buckets with issues
    }
    isBlockerIssue(issue) {
        // BLOCKERS: Critical runtime issues that prevent the app from working
        if (issue.severity === 'critical') {
            return (issue.rule === 'Contract Compliance' ||
                issue.rule === 'Contract Violation' || // ADDED: Cross-layer contract violations
                issue.type === 'contract_violation' || // ADDED: Direct check for contract violations
                issue.rule === 'Type-Database Alignment' ||
                issue.rule === 'Export Completeness' ||
                issue.type === 'missing_contracts' ||
                issue.type === 'typescript_error' ||
                issue.type === 'export_completeness' ||
                issue.type === 'security' ||
                issue.category === 'setup' ||
                issue.category === 'api_completeness');
        }
        return false;
    }
    isStructuralIssue(issue) {
        // STRUCTURAL: Important architectural issues affecting maintainability
        return (issue.rule === 'Error Handling' ||
            issue.rule === 'Cache Invalidation' ||
            issue.rule === 'Hook-Database Pattern' ||
            issue.rule === 'API Type Safety' ||
            issue.rule === 'Auth Guards' ||
            issue.rule === 'File Size Warnings' ||
            issue.rule === 'Duplicate Functions' ||
            issue.rule === 'Export Completeness' ||
            issue.type === 'file_size_warnings' ||
            issue.type === 'duplicate_functions' ||
            issue.type === 'export_completeness' ||
            issue.category === 'architecture' ||
            issue.category === 'performance' ||
            issue.category === 'maintainability' ||
            issue.category === 'code_drift' ||
            issue.category === 'api_completeness');
    }
}
exports.IssueBucketClassifier = IssueBucketClassifier;
