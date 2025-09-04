import * as fs from 'fs';
import * as path from 'path';
import { SmartIssueAnalyzer } from './smart-issue-analyzer';

export class BackgroundAnalyzer {
  private projectPath: string;
  private lastChecksum: string = '';
  private isAnalyzing: boolean = false;
  
  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  // Smart triggers - only run when:
  // 1. File saved (detected by mtime change)
  // 2. Build/test command run 
  // 3. Git commit made
  // 4. Manual request via dashboard
  async checkAndAnalyze(): Promise<boolean> {
    if (this.isAnalyzing) return false;
    
    // Quick checksum to see if anything changed
    const currentChecksum = await this.getProjectChecksum();
    if (currentChecksum === this.lastChecksum) {
      return false; // Nothing changed, skip
    }
    
    this.isAnalyzing = true;
    this.lastChecksum = currentChecksum;
    
    try {
      // Run the smart analyzer
      const analyzer = new SmartIssueAnalyzer(this.projectPath);
      await analyzer.analyze();
      
      // Update the FIX_THIS.json silently
      return true;
    } catch (error) {
      console.error('Background analysis failed:', error);
      return false;
    } finally {
      this.isAnalyzing = false;
    }
  }

  // Lightweight checksum - just check key files modification times
  private async getProjectChecksum(): Promise<string> {
    const checksumData: string[] = [];
    
    // Check package.json
    const packagePath = path.join(this.projectPath, 'package.json');
    if (fs.existsSync(packagePath)) {
      const stats = fs.statSync(packagePath);
      checksumData.push(`package:${stats.mtime.getTime()}`);
    }
    
    // Check src folder modification time
    const srcPath = path.join(this.projectPath, 'src');
    if (fs.existsSync(srcPath)) {
      const stats = fs.statSync(srcPath);
      checksumData.push(`src:${stats.mtime.getTime()}`);
    }
    
    // Check .env
    const envPath = path.join(this.projectPath, '.env');
    if (fs.existsSync(envPath)) {
      const stats = fs.statSync(envPath);
      checksumData.push(`env:${stats.mtime.getTime()}`);
    }
    
    return checksumData.join('|');
  }

  // Called by dashboard API endpoint
  async triggerAnalysis(): Promise<any> {
    const updated = await this.checkAndAnalyze();
    
    // Return current state
    const fixPath = path.join(this.projectPath, '.observer', 'FIX_THIS.json');
    if (fs.existsSync(fixPath)) {
      const data = JSON.parse(fs.readFileSync(fixPath, 'utf-8'));
      return {
        updated,
        issues_count: data.stats.total_issues_found,
        groups_count: data.fix_groups.length,
        last_update: data.generated
      };
    }
    
    return { updated, issues_count: 0, groups_count: 0 };
  }
}