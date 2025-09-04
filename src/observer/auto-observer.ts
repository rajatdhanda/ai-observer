#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * AUTO OBSERVER - Runs silently in background
 * Updates FIX_THIS.json automatically when code changes
 * Zero manual intervention needed
 */

class AutoObserver {
  private projectPath: string;
  private lastCheckTime: number = 0;
  private lastFileCount: number = 0;
  
  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  start() {
    // Create .observer folder if doesn't exist
    const observerDir = path.join(this.projectPath, '.observer');
    if (!fs.existsSync(observerDir)) {
      fs.mkdirSync(observerDir, { recursive: true });
    }

    // Initial analysis
    this.runQuickAnalysis();

    // Check every 60 seconds (lightweight check)
    setInterval(() => {
      if (this.hasChanges()) {
        this.runQuickAnalysis();
      }
    }, 60000);
  }

  private hasChanges(): boolean {
    try {
      // Super lightweight - just check if any .ts/.tsx/.js files were modified
      const result = execSync(
        `find ${this.projectPath}/src -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \\) -newer ${this.projectPath}/.observer/FIX_THIS.json 2>/dev/null | head -1`,
        { encoding: 'utf-8' }
      ).trim();
      
      return result.length > 0;
    } catch {
      return true; // If check fails, run analysis to be safe
    }
  }

  private runQuickAnalysis() {
    const fixPath = path.join(this.projectPath, '.observer', 'FIX_THIS.json');
    
    try {
      // Run only critical checks (not full analysis)
      const issues = [];
      
      // 1. Check if contracts exist (most important)
      if (!fs.existsSync(path.join(this.projectPath, '.observer', 'contracts.json'))) {
        issues.push({
          file: '.observer/contracts.json:0',
          issue: 'No contracts defined',
          fix: 'Create contracts.json'
        });
      }

      // 2. Quick TypeScript check (only if tsconfig exists)
      if (fs.existsSync(path.join(this.projectPath, 'tsconfig.json'))) {
        try {
          execSync('npx tsc --noEmit --incremental', {
            cwd: this.projectPath,
            stdio: 'pipe',
            timeout: 10000 // 10 second timeout
          });
        } catch (e: any) {
          // Parse first 5 errors only
          const output = e.stdout?.toString() || '';
          const lines = output.split('\n').slice(0, 5);
          
          lines.forEach((line: string) => {
            const match = line.match(/(.+)\((\d+),\d+\):\s+error\s+TS\d+:\s+(.+)/);
            if (match) {
              issues.push({
                file: `${match[1]}:${match[2]}`,
                issue: match[3],
                fix: 'Fix TypeScript error'
              });
            }
          });
        }
      }

      // Update FIX_THIS.json only if there are changes
      const existingData = fs.existsSync(fixPath) ? 
        JSON.parse(fs.readFileSync(fixPath, 'utf-8')) : null;
      
      const newData = {
        README: "Auto-generated. Fix Group 1 first. AI should read this file regularly.",
        generated: new Date().toISOString(),
        project: this.projectPath,
        fix_groups: issues.length > 0 ? [{
          group: 1,
          title: 'Critical issues to fix',
          why: 'Blocking issues detected',
          fixes: issues.slice(0, 10) // Max 10 issues
        }] : [],
        stats: {
          total_issues: issues.length,
          auto_update: true
        }
      };

      // Only write if different
      if (JSON.stringify(existingData?.fix_groups) !== JSON.stringify(newData.fix_groups)) {
        fs.writeFileSync(fixPath, JSON.stringify(newData, null, 2));
      }
    } catch (error) {
      // Silent fail - this runs in background
    }
  }
}

// Auto-start if called directly
if (require.main === module) {
  const projectPath = process.argv[2] || process.cwd();
  const observer = new AutoObserver(projectPath);
  observer.start();
  
  console.log(`🤖 Auto-Observer started for: ${projectPath}`);
  console.log('📁 Updates .observer/FIX_THIS.json automatically');
  console.log('🔄 Checking every 60 seconds...');
  
  // Keep process alive
  process.stdin.resume();
}