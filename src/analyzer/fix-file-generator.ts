import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { Issue, IssueBucket } from '../types/analysis-types';
import { ProjectContextDetector } from './project-context-detector';

export class FixFileGenerator {
  constructor(
    private projectPath: string,
    private issues: Issue[],
    private projectType: string,
    private hasPayments: boolean,
    private hasAuth: boolean,
    private hasDatabase: boolean,
    private hasAPI: boolean,
    private contextDetector: ProjectContextDetector
  ) {}

  generateEnhancedFixFile(buckets: IssueBucket[]): void {
    const outputDir = path.join(this.projectPath, '.observer');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Load previous state to track progress
    const previousState = this.loadPreviousState();
    const isFirstRun = !previousState;
    const previousIssuesCount = previousState?.total_issues || 0;
    const fixedCount = previousIssuesCount > this.issues.length ? 
                       previousIssuesCount - this.issues.length : 0;
    
    const totalIssues = this.issues.length;
    const criticalIssues = this.issues.filter(i => i.severity === 'critical').length;
    
    const enhancedFixFile = {
      README: isFirstRun ? 
        `ALL ${totalIssues} issues organized by importance buckets. Fix BLOCKERS first.` :
        `${fixedCount} issues fixed! ${totalIssues} remaining in ${buckets.length} buckets.`,
      generated: new Date().toISOString(),
      project: this.projectPath,
      project_type: this.projectType,
      detected_features: {
        has_payments: this.hasPayments,
        has_auth: this.hasAuth,
        has_database: this.hasDatabase,
        has_api: this.hasAPI
      },
      
      // NEW: Bucket-based organization showing ALL issues
      issue_buckets: buckets.map(bucket => ({
        name: bucket.name,
        title: bucket.title,
        description: bucket.description,
        color: bucket.color,
        priority: bucket.priority,
        count: bucket.count,
        issues: bucket.issues.map(issue => ({
          file: issue.file,
          line: issue.line,
          rule: issue.rule || issue.type,
          severity: issue.severity,
          message: issue.message,
          fix: issue.suggestion || 'Fix required',
          category: issue.category
        }))
      })),
      
      // Enhanced stats showing complete visibility
      stats: {
        total_issues_found: totalIssues,
        issues_shown: totalIssues, // NOW SHOWING ALL ISSUES
        visibility_percentage: 100, // 100% visibility instead of 24%
        
        by_bucket: buckets.map(b => ({ name: b.name, count: b.count })),
        by_severity: {
          critical: this.issues.filter(i => i.severity === 'critical').length,
          high: this.issues.filter(i => i.severity === 'high').length,
          medium: this.issues.filter(i => i.severity === 'medium').length,
          low: this.issues.filter(i => i.severity === 'low').length
        },
        by_rule: this.getIssuesByRule(),
        
        buckets_total: buckets.length,
        fixed_since_last_run: fixedCount,
        remaining_issues: totalIssues
      },
      
      // Context without step-by-step instructions
      context: {
        total: `${totalIssues} issues in ${buckets.length} priority buckets`,
        bucket_priorities: buckets.map(b => ({ [b.name]: b.description }))
      },
      
      progress: {
        session_started: previousState?.session_started || new Date().toISOString(),
        runs_count: (previousState?.runs_count || 0) + 1,
        total_fixed: (previousState?.total_fixed || 0) + fixedCount,
        enhancement_note: "Enhanced with bucket classification - showing ALL issues"
      }
    };
    
    // Run Python pattern analyzer to add AI insights
    let finalFixFile = enhancedFixFile;
    try {
      const pythonScriptPath = path.join(__dirname, 'pattern-insights.py');
      const result = execSync(
        `python3 "${pythonScriptPath}"`,
        {
          input: JSON.stringify(enhancedFixFile),
          encoding: 'utf8',
          maxBuffer: 10 * 1024 * 1024 // 10MB buffer
        }
      );
      
      // Parse the result which should have ai_insights added
      const enhancedWithInsights = JSON.parse(result);
      if (enhancedWithInsights.ai_insights) {
        finalFixFile = enhancedWithInsights;
        console.log('✨ Added AI-powered pattern insights');
      }
    } catch (error) {
      console.log('⚠️ Pattern insights skipped (Python not available or error)');
      // Continue without insights if Python fails
    }
    
    // Write the enhanced file to .observer
    fs.writeFileSync(
      path.join(outputDir, 'FIX_THIS.json'),
      JSON.stringify(finalFixFile, null, 2)
    );
    
    // Also save to src/contracts/fixes.json for new project structure
    const contractsDir = path.join(this.projectPath, 'src', 'contracts');
    if (!fs.existsSync(contractsDir)) {
      fs.mkdirSync(contractsDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(contractsDir, 'fixes.json'),
      JSON.stringify(finalFixFile, null, 2)
    );
    
    // Save context.json with essential project info for AI
    const contextFile = {
      analyzed_at: new Date().toISOString(),
      project_path: this.projectPath,
      total_files: this.issues.filter((i, idx, arr) => 
        arr.findIndex(x => x.file === i.file) === idx
      ).length,
      framework: this.contextDetector.detectFramework(),
      entry_points: this.contextDetector.findEntryPoints(),
      api_routes: this.contextDetector.findApiRoutes(),
      database_type: this.contextDetector.detectDatabase(),
      key_dependencies: this.contextDetector.getKeyDependencies(),
      environment_vars: this.contextDetector.detectEnvVars(),
      build_commands: this.contextDetector.getBuildCommands()
    };
    
    fs.writeFileSync(
      path.join(contractsDir, 'context.json'),
      JSON.stringify(contextFile, null, 2)
    );
    
    // Save current state for next run
    this.saveState({
      total_issues: totalIssues,
      session_started: enhancedFixFile.progress.session_started,
      runs_count: enhancedFixFile.progress.runs_count,
      total_fixed: enhancedFixFile.progress.total_fixed,
      last_run: new Date().toISOString(),
      enhancement: 'bucket_classification'
    });
    
    console.log(`📊 Enhanced analysis complete: ${totalIssues} total issues in ${buckets.length} buckets`);
    console.log('📈 Visibility improved from 24% to 100% - AI now sees ALL issues!');
    
    if (fixedCount > 0) {
      console.log(`✨ Great progress! ${fixedCount} issues fixed since last run`);
    }
    if (totalIssues === 0) {
      console.log(`🎉 All issues resolved! Project is clean.`);
    }
  }
  
  private getIssuesByRule(): Record<string, number> {
    const byRule: Record<string, number> = {};
    for (const issue of this.issues) {
      const rule = issue.rule || issue.type || 'other';
      byRule[rule] = (byRule[rule] || 0) + 1;
    }
    return byRule;
  }

  private loadPreviousState(): any {
    const statePath = path.join(this.projectPath, '.observer', 'analysis_state.json');
    if (fs.existsSync(statePath)) {
      try {
        return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  private saveState(state: any): void {
    const statePath = path.join(this.projectPath, '.observer', 'analysis_state.json');
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  }
}