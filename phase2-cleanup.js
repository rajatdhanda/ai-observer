/**
 * PHASE 2 CLEANUP: Remove Dist Duplicates + Some Other Files
 * MEDIUM RISK - Remove compiled dist/ files when src/ equivalents exist
 */

const fs = require('fs');
const path = require('path');

class Phase2Cleanup {
  constructor() {
    this.projectPath = process.cwd();
    this.removed = [];
  }

  async run() {
    console.log('🧹 Phase 2: Removing dist duplicates and other safe files...');
    
    // Create backup first
    await this.createBackup();
    
    // Remove dist files that have src equivalents
    await this.removeDistDuplicates();
    
    // Remove some obviously unused files
    await this.removeObviouslyUnused();
    
    console.log(`\n✅ Phase 2 complete! Removed ${this.removed.length} files:`);
    this.removed.forEach(file => console.log(`  🗑️  ${file}`));
    
    console.log('\n⚠️  If issues arise, these can be regenerated with: npm run build');
  }

  async createBackup() {
    console.log('💾 Creating Phase 2 backup...');
    const timestamp = Date.now();
    
    // Backup entire dist directory before we modify it
    if (fs.existsSync('dist')) {
      const backupDir = `.cleanup-phase2-backup-${timestamp}-dist`;
      this.copyDirectory('dist', backupDir);
      console.log(`✅ Phase 2 backup created: ${backupDir}`);
    }
  }

  async removeDistDuplicates() {
    console.log('\n🗑️  Removing dist/ files that have src/ equivalents...');
    
    // Find all .js files in dist/
    const distFiles = this.findFiles('dist/', /\.js$/);
    console.log(`Found ${distFiles.length} .js files in dist/`);
    
    let duplicateCount = 0;
    
    for (const distFile of distFiles) {
      // Check if equivalent src file exists
      const srcFile = distFile
        .replace('dist/', 'src/')
        .replace('.js', '.ts');
      
      if (fs.existsSync(srcFile)) {
        // It's a duplicate - safe to remove
        try {
          fs.unlinkSync(distFile);
          this.removed.push(path.relative(this.projectPath, distFile));
          duplicateCount++;
          console.log(`  ✅ Removed duplicate: ${path.relative(this.projectPath, distFile)}`);
        } catch (error) {
          console.log(`  ❌ Failed to remove: ${distFile} - ${error.message}`);
        }
      }
    }
    
    console.log(`🎯 Removed ${duplicateCount} dist/ duplicates`);
  }

  async removeObviouslyUnused() {
    console.log('\n🗑️  Removing obviously unused files...');
    
    const unusedFiles = [
      // Orphaned dist files
      'dist/design-system-validator.js',
      
      // Cleanup tools (keep the working ones)
      'cleanup-system.js',
      'manual-cleanup.js', 
      'phase1-cleanup.js',
      'CLEANUP_ANALYSIS.md'
    ];
    
    for (const file of unusedFiles) {
      if (fs.existsSync(file)) {
        try {
          fs.unlinkSync(file);
          this.removed.push(file);
          console.log(`  ✅ Removed unused: ${file}`);
        } catch (error) {
          console.log(`  ❌ Failed to remove: ${file} - ${error.message}`);
        }
      }
    }
  }

  findFiles(dir, pattern) {
    const files = [];
    if (!fs.existsSync(dir)) return files;
    
    const scan = (currentDir) => {
      try {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          if (entry.isDirectory()) {
            scan(fullPath);
          } else if (entry.isFile() && pattern.test(entry.name)) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip inaccessible directories
      }
    };
    
    scan(dir);
    return files;
  }

  copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const files = fs.readdirSync(src);
    for (const file of files) {
      const srcFile = path.join(src, file);
      const destFile = path.join(dest, file);
      
      if (fs.statSync(srcFile).isDirectory()) {
        this.copyDirectory(srcFile, destFile);
      } else {
        fs.copyFileSync(srcFile, destFile);
      }
    }
  }
}

// Run cleanup
if (require.main === module) {
  const cleanup = new Phase2Cleanup();
  cleanup.run().catch(console.error);
}

module.exports = Phase2Cleanup;