/**
 * CONSERVATIVE MANUAL CLEANUP
 * Safer approach focusing on obvious junk files and duplicates
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ManualCleanup {
  constructor() {
    this.projectPath = process.cwd();
    this.removed = [];
  }

  async run() {
    console.log('🧹 Starting conservative manual cleanup...');
    
    // Create backup first
    await this.createBackup();
    
    // Stage 1: Remove obvious junk files
    await this.removeJunkFiles();
    
    // Stage 2: Remove test-projects directory (if exists)
    await this.removeTestProjects();
    
    // Stage 3: Clean up some dist duplicates safely
    await this.cleanDistDuplicates();
    
    // Verify health
    await this.verifyHealth();
    
    console.log(`\n✅ Cleanup complete! Removed ${this.removed.length} files:`);
    this.removed.forEach(file => console.log(`  🗑️  ${file}`));
  }

  async createBackup() {
    console.log('💾 Creating backup...');
    const backupDir = '.cleanup-backup-' + Date.now();
    
    // Backup critical directories
    execSync(`cp -r src ${backupDir}-src`);
    execSync(`cp -r dist ${backupDir}-dist`);
    execSync(`cp package.json ${backupDir}-package.json`);
    
    console.log(`✅ Backup created: ${backupDir}-*`);
  }

  async removeJunkFiles() {
    console.log('\n🗑️  Stage 1: Removing junk files...');
    
    const junkPatterns = [
      '*.md',
      '*README*',
      '*.log',
      '*.tmp',
      'test-smart-view.html',
      'test-layout.html'
    ];
    
    for (const pattern of junkPatterns) {
      try {
        const files = execSync(`find . -maxdepth 2 -name "${pattern}" -not -path "./node_modules/*"`, 
          { encoding: 'utf8' }).trim().split('\n').filter(f => f);
        
        for (const file of files) {
          if (fs.existsSync(file)) {
            fs.unlinkSync(file);
            this.removed.push(file);
            console.log(`  ✅ Removed: ${file}`);
          }
        }
      } catch (error) {
        // Pattern not found, continue
      }
    }
  }

  async removeTestProjects() {
    console.log('\n🗑️  Stage 2: Removing test-projects directory...');
    
    if (fs.existsSync('test-projects')) {
      execSync('rm -rf test-projects');
      this.removed.push('test-projects/');
      console.log('  ✅ Removed: test-projects/ directory');
    }
  }

  async cleanDistDuplicates() {
    console.log('\n🗑️  Stage 3: Cleaning obvious dist duplicates...');
    
    // Remove dist files that have identical src counterparts
    const distFiles = [
      'dist/dashboard/page-details-viewer.js',
      'dist/dashboard/hook-details-viewer.js', 
      'dist/dashboard/control-bar.js',
      'dist/dashboard/self-test.js'  // This one is likely unused
    ];
    
    for (const distFile of distFiles) {
      const srcFile = distFile.replace('dist/', 'src/');
      
      // Only remove dist file if src exists and they're similar
      if (fs.existsSync(distFile)) {
        if (distFile.includes('self-test') || !fs.existsSync(srcFile)) {
          // Safe to remove self-test or orphaned dist files
          fs.unlinkSync(distFile);
          this.removed.push(distFile);
          console.log(`  ✅ Removed: ${distFile}`);
        }
      }
    }
  }

  async verifyHealth() {
    console.log('\n🏥 Verifying health...');
    
    try {
      // Check if critical files still exist
      const criticalFiles = [
        'src/dashboard/index.ts',
        'src/dashboard/components/smart-analysis-view.js',
        'src/dashboard/components/issue-filter-panel.js',
        'package.json'
      ];
      
      let healthy = true;
      for (const file of criticalFiles) {
        if (!fs.existsSync(file)) {
          console.log(`❌ Critical file missing: ${file}`);
          healthy = false;
        }
      }
      
      if (healthy) {
        console.log('✅ Health check passed - all critical files present');
      } else {
        console.log('❌ Health check failed - restore from backup');
      }
      
      return healthy;
    } catch (error) {
      console.log('❌ Health check error:', error.message);
      return false;
    }
  }
}

// Run cleanup
if (require.main === module) {
  const cleanup = new ManualCleanup();
  cleanup.run().catch(console.error);
}

module.exports = ManualCleanup;