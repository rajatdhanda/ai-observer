/**
 * GENIUS CLEANUP SYSTEM
 * Creates reference snapshots and verifies app health after cleanup
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

class CleanupSystem {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.snapshotPath = path.join(projectPath, '.cleanup-snapshots');
    this.logPath = path.join(this.snapshotPath, 'cleanup.log');
    
    // Ensure snapshot directory exists
    if (!fs.existsSync(this.snapshotPath)) {
      fs.mkdirSync(this.snapshotPath, { recursive: true });
    }
  }

  /**
   * STEP 1: Create comprehensive baseline snapshot
   */
  async createBaselineSnapshot() {
    console.log('🔍 Creating baseline snapshot...');
    
    const snapshot = {
      timestamp: new Date().toISOString(),
      fileStructure: this.getFileStructure(),
      packageInfo: this.getPackageInfo(),
      dashboardHealth: await this.testDashboardHealth(),
      gitStatus: this.getGitStatus(),
      checksums: this.getFileChecksums()
    };
    
    // Save baseline
    fs.writeFileSync(
      path.join(this.snapshotPath, 'baseline.json'),
      JSON.stringify(snapshot, null, 2)
    );
    
    console.log('✅ Baseline snapshot created');
    console.log(`📊 Total files: ${snapshot.fileStructure.totalFiles}`);
    console.log(`📦 Issues found: ${snapshot.dashboardHealth.issueCount || 'N/A'}`);
    
    return snapshot;
  }

  /**
   * STEP 2: Analyze file usage and dependencies
   */
  analyzeFileUsage() {
    console.log('🔍 Analyzing file dependencies...');
    
    const analysis = {
      srcFiles: this.scanDirectory(path.join(this.projectPath, 'src')),
      distFiles: this.scanDirectory(path.join(this.projectPath, 'dist')),
      unusedFiles: [],
      duplicates: [],
      importMap: new Map(),
      usageCount: new Map()
    };
    
    // Build import/usage map
    this.buildDependencyMap(analysis);
    
    // Find unused files
    this.findUnusedFiles(analysis);
    
    // Find duplicates
    this.findDuplicateFiles(analysis);
    
    // Save analysis
    fs.writeFileSync(
      path.join(this.snapshotPath, 'file-analysis.json'),
      JSON.stringify({
        ...analysis,
        importMap: Array.from(analysis.importMap.entries()),
        usageCount: Array.from(analysis.usageCount.entries())
      }, null, 2)
    );
    
    console.log(`🗑️  Found ${analysis.unusedFiles.length} potentially unused files`);
    console.log(`📋 Found ${analysis.duplicates.length} duplicate groups`);
    
    return analysis;
  }

  /**
   * STEP 3: Smart cleanup with verification
   */
  async performSmartCleanup() {
    const analysis = JSON.parse(
      fs.readFileSync(path.join(this.snapshotPath, 'file-analysis.json'))
    );
    
    const cleanupPlan = this.generateCleanupPlan(analysis);
    console.log('🧹 Cleanup Plan Generated:');
    console.log(`  - Remove ${cleanupPlan.toRemove.length} unused files`);
    console.log(`  - Consolidate ${cleanupPlan.toDedupe.length} duplicate groups`);
    
    // Execute cleanup in stages with verification
    for (let i = 0; i < cleanupPlan.stages.length; i++) {
      const stage = cleanupPlan.stages[i];
      console.log(`\n🚀 Stage ${i + 1}: ${stage.description}`);
      
      // Backup current state
      await this.createStageBackup(`stage-${i + 1}-before`);
      
      // Execute stage
      this.executeCleanupStage(stage);
      
      // Verify health
      const isHealthy = await this.verifyHealth();
      if (!isHealthy) {
        console.log('❌ Health check failed! Rolling back...');
        await this.rollbackToBackup(`stage-${i + 1}-before`);
        break;
      }
      
      console.log('✅ Stage completed successfully');
    }
  }

  /**
   * Get current file structure with metadata
   */
  getFileStructure() {
    const structure = {
      totalFiles: 0,
      byExtension: {},
      byDirectory: {},
      sizes: {},
      unusualFiles: []
    };
    
    const scanDir = (dir, relativePath = '') => {
      try {
        const files = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const file of files) {
          const fullPath = path.join(dir, file.name);
          const relPath = path.join(relativePath, file.name);
          
          if (file.isDirectory()) {
            if (!file.name.startsWith('.') && file.name !== 'node_modules') {
              structure.byDirectory[relPath] = structure.byDirectory[relPath] || 0;
              scanDir(fullPath, relPath);
            }
          } else {
            structure.totalFiles++;
            const ext = path.extname(file.name);
            const stats = fs.statSync(fullPath);
            
            structure.byExtension[ext] = (structure.byExtension[ext] || 0) + 1;
            structure.byDirectory[relativePath] = (structure.byDirectory[relativePath] || 0) + 1;
            structure.sizes[relPath] = stats.size;
            
            // Flag unusual files
            if (this.isUnusualFile(file.name, relPath)) {
              structure.unusualFiles.push(relPath);
            }
          }
        }
      } catch (error) {
        // Skip inaccessible directories
      }
    };
    
    scanDir(this.projectPath);
    return structure;
  }

  /**
   * Test dashboard health (assumes dashboard is already running)
   */
  async testDashboardHealth() {
    console.log('🏥 Testing dashboard health...');
    
    try {
      // Check if dashboard is running
      const dashboardRunning = this.isDashboardRunning();
      
      if (!dashboardRunning) {
        console.log('⚠️  Dashboard not running, starting temporarily...');
        // Start dashboard in background for testing
        const child = require('child_process').spawn('npm', ['run', 'dashboard'], {
          cwd: this.projectPath,
          detached: true,
          stdio: 'ignore'
        });
        child.unref();
        
        // Wait for startup
        await new Promise(resolve => setTimeout(resolve, 8000));
      }
      
      // Test health endpoints
      const health = await this.checkHealthEndpoints();
      
      if (!dashboardRunning) {
        // Clean up if we started it
        execSync('pkill -f "dashboard" || true');
      }
      
      return health;
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  /**
   * Check if dashboard is already running
   */
  isDashboardRunning() {
    try {
      const result = execSync('lsof -i :3001', { encoding: 'utf8' });
      return result.includes('node') || result.includes('ts-node');
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if dashboard endpoints are responding correctly
   */
  async checkHealthEndpoints() {
    const health = { healthy: true, endpoints: {}, issueCount: null };
    
    try {
      // Simple curl test for basic connectivity
      const curlTest = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/modular-fixed', 
        { encoding: 'utf8', timeout: 5000 });
      
      health.endpoints['http://localhost:3001/modular-fixed'] = {
        status: parseInt(curlTest.trim()),
        ok: curlTest.trim() === '200'
      };
      
      // Test smart analysis endpoint for issue count
      try {
        const smartAnalysis = execSync('curl -s http://localhost:3001/api/smart-analysis', 
          { encoding: 'utf8', timeout: 5000 });
        const data = JSON.parse(smartAnalysis);
        health.issueCount = data.analysis?.stats?.total_issues_found || null;
        health.endpoints['http://localhost:3001/api/smart-analysis'] = { ok: true };
      } catch (error) {
        health.endpoints['http://localhost:3001/api/smart-analysis'] = { error: error.message };
      }
      
    } catch (error) {
      health.healthy = false;
      health.error = error.message;
    }
    
    return health;
  }

  /**
   * Build dependency map to understand file relationships
   */
  buildDependencyMap(analysis) {
    const allFiles = [...analysis.srcFiles, ...analysis.distFiles];
    
    for (const file of allFiles) {
      if (file.endsWith('.js') || file.endsWith('.ts')) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          const imports = this.extractImports(content);
          
          analysis.importMap.set(file, imports);
          
          // Count usage
          for (const imp of imports) {
            const count = analysis.usageCount.get(imp) || 0;
            analysis.usageCount.set(imp, count + 1);
          }
        } catch (error) {
          // Skip unreadable files
        }
      }
    }
  }

  /**
   * Extract import statements from file content
   */
  extractImports(content) {
    const imports = [];
    const patterns = [
      /import.*from\s+['"]([^'"]+)['"]/g,
      /require\(['"]([^'"]+)['"]\)/g,
      /src=["']([^"']+\.js)["']/g,
      /<script\s+src=["']([^"']+)["']/g
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        imports.push(match[1]);
      }
    }
    
    return imports;
  }

  /**
   * Identify files that appear to be unused
   */
  findUnusedFiles(analysis) {
    const allFiles = [...analysis.srcFiles, ...analysis.distFiles];
    
    for (const file of allFiles) {
      const basename = path.basename(file);
      const usage = analysis.usageCount.get(file) || 0;
      
      if (usage === 0 && this.couldBeUnused(file, basename)) {
        analysis.unusedFiles.push(file);
      }
    }
  }

  /**
   * Find duplicate files by content hash
   */
  findDuplicateFiles(analysis) {
    const hashMap = new Map();
    const allFiles = [...analysis.srcFiles, ...analysis.distFiles];
    
    for (const file of allFiles) {
      try {
        const content = fs.readFileSync(file);
        const hash = crypto.createHash('md5').update(content).digest('hex');
        
        if (!hashMap.has(hash)) {
          hashMap.set(hash, []);
        }
        hashMap.get(hash).push(file);
      } catch (error) {
        // Skip unreadable files
      }
    }
    
    // Find groups with duplicates
    for (const [hash, files] of hashMap) {
      if (files.length > 1) {
        analysis.duplicates.push({ hash, files });
      }
    }
  }

  /**
   * Generate safe cleanup plan
   */
  generateCleanupPlan(analysis) {
    const plan = {
      toRemove: [],
      toDedupe: [],
      stages: []
    };
    
    // Stage 1: Remove obvious junk files
    const safeToRemove = analysis.unusedFiles.filter(file => {
      return (
        file.endsWith('.md') ||
        file.includes('README') ||
        file.endsWith('.log') ||
        file.includes('.tmp') ||
        file.includes('test') ||
        file.includes('.example.')
      );
    });
    
    if (safeToRemove.length > 0) {
      plan.stages.push({
        description: `Remove ${safeToRemove.length} safe junk files`,
        type: 'remove',
        files: safeToRemove,
        risk: 'low'
      });
    }
    
    // Stage 2: Remove dist duplicates (keep src versions)
    const distDuplicates = analysis.duplicates
      .map(group => group.files.filter(f => f.includes('/dist/')))
      .flat()
      .filter(file => {
        // Only remove if corresponding src file exists
        const srcVersion = file.replace('/dist/', '/src/');
        return analysis.srcFiles.includes(srcVersion);
      });
    
    if (distDuplicates.length > 0) {
      plan.stages.push({
        description: `Remove ${distDuplicates.length} dist duplicates`,
        type: 'remove',
        files: distDuplicates,
        risk: 'medium'
      });
    }
    
    // Stage 3: Remove unused component files (careful)
    const unusedComponents = analysis.unusedFiles.filter(file => {
      return (
        file.endsWith('.js') &&
        !file.includes('index') &&
        !file.includes('main') &&
        (analysis.usageCount.get(file) || 0) === 0
      );
    });
    
    if (unusedComponents.length > 0) {
      plan.stages.push({
        description: `Remove ${unusedComponents.length} unused components`,
        type: 'remove',
        files: unusedComponents,
        risk: 'high'
      });
    }
    
    return plan;
  }

  /**
   * Execute a single cleanup stage
   */
  executeCleanupStage(stage) {
    console.log(`🧹 Executing: ${stage.description}`);
    
    for (const file of stage.files) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
          console.log(`  ✅ Removed: ${path.relative(this.projectPath, file)}`);
        }
      } catch (error) {
        console.log(`  ❌ Failed to remove: ${file} - ${error.message}`);
      }
    }
  }

  /**
   * Create backup of current state
   */
  async createStageBackup(stageName) {
    const backupDir = path.join(this.snapshotPath, 'backups', stageName);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Copy critical directories
    const criticalDirs = ['src', 'dist', 'package.json'];
    for (const item of criticalDirs) {
      const srcPath = path.join(this.projectPath, item);
      const destPath = path.join(backupDir, item);
      
      if (fs.existsSync(srcPath)) {
        if (fs.statSync(srcPath).isDirectory()) {
          this.copyDirectory(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }
    
    console.log(`💾 Created backup: ${stageName}`);
  }

  /**
   * Rollback to a previous backup
   */
  async rollbackToBackup(stageName) {
    const backupDir = path.join(this.snapshotPath, 'backups', stageName);
    
    if (!fs.existsSync(backupDir)) {
      throw new Error(`Backup ${stageName} not found`);
    }
    
    // Restore from backup
    const items = fs.readdirSync(backupDir);
    for (const item of items) {
      const srcPath = path.join(backupDir, item);
      const destPath = path.join(this.projectPath, item);
      
      // Remove current version
      if (fs.existsSync(destPath)) {
        if (fs.statSync(destPath).isDirectory()) {
          this.removeDirectory(destPath);
        } else {
          fs.unlinkSync(destPath);
        }
      }
      
      // Restore backup
      if (fs.statSync(srcPath).isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
    
    console.log(`🔄 Rolled back to: ${stageName}`);
  }

  /**
   * Copy directory recursively
   */
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

  /**
   * Remove directory recursively
   */
  removeDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        this.removeDirectory(filePath);
      } else {
        fs.unlinkSync(filePath);
      }
    }
    fs.rmdirSync(dir);
  }

  /**
   * Helper methods
   */
  scanDirectory(dir) {
    const files = [];
    if (!fs.existsSync(dir)) return files;
    
    const scan = (currentDir) => {
      try {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          if (entry.isDirectory() && !entry.name.startsWith('.')) {
            scan(fullPath);
          } else if (entry.isFile()) {
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

  isUnusualFile(filename, relativePath) {
    const unusual = [
      /\.md$/i,
      /readme/i,
      /\.log$/i,
      /\.tmp$/i,
      /test.*\.js$/i,
      /\.example\./i
    ];
    
    return unusual.some(pattern => pattern.test(filename) || pattern.test(relativePath));
  }

  couldBeUnused(file, basename) {
    // Skip if it's likely an entry point
    if (basename.includes('index') || basename.includes('main')) return false;
    
    // Skip if it's in a test directory
    if (file.includes('/test/') || file.includes('/__test__/')) return true;
    
    // Skip critical files
    if (basename.includes('package.json') || basename.includes('.gitignore')) return false;
    
    return true;
  }

  getPackageInfo() {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(this.projectPath, 'package.json')));
      return {
        name: pkg.name,
        version: pkg.version,
        dependencies: Object.keys(pkg.dependencies || {}),
        devDependencies: Object.keys(pkg.devDependencies || {})
      };
    } catch {
      return null;
    }
  }

  getGitStatus() {
    try {
      return {
        branch: execSync('git branch --show-current', { encoding: 'utf8' }).trim(),
        status: execSync('git status --porcelain', { encoding: 'utf8' }).trim(),
        lastCommit: execSync('git log -1 --oneline', { encoding: 'utf8' }).trim()
      };
    } catch {
      return null;
    }
  }

  getFileChecksums() {
    // Create checksums for critical files
    const criticalFiles = [
      'package.json',
      'src/dashboard/index.ts',
      'src/dashboard/components/smart-analysis-view.js',
      'src/dashboard/components/issue-filter-panel.js'
    ];
    
    const checksums = {};
    for (const file of criticalFiles) {
      try {
        const fullPath = path.join(this.projectPath, file);
        const content = fs.readFileSync(fullPath);
        checksums[file] = crypto.createHash('md5').update(content).digest('hex');
      } catch (error) {
        checksums[file] = 'FILE_NOT_FOUND';
      }
    }
    
    return checksums;
  }

  async verifyHealth() {
    console.log('🔍 Verifying health after cleanup...');
    
    try {
      const currentHealth = await this.testDashboardHealth();
      const baseline = JSON.parse(fs.readFileSync(path.join(this.snapshotPath, 'baseline.json')));
      
      // Compare critical metrics
      const healthy = (
        currentHealth.healthy &&
        currentHealth.issueCount === baseline.dashboardHealth.issueCount
      );
      
      if (healthy) {
        console.log('✅ Health check passed');
      } else {
        console.log('❌ Health check failed');
        console.log('Expected:', baseline.dashboardHealth.issueCount, 'issues');
        console.log('Got:', currentHealth.issueCount, 'issues');
      }
      
      return healthy;
    } catch (error) {
      console.log('❌ Health check error:', error.message);
      return false;
    }
  }
}

// Export for use
module.exports = CleanupSystem;

// CLI usage
if (require.main === module) {
  const cleanup = new CleanupSystem();
  
  async function main() {
    const command = process.argv[2];
    
    switch (command) {
      case 'snapshot':
        await cleanup.createBaselineSnapshot();
        break;
      case 'analyze':
        cleanup.analyzeFileUsage();
        break;
      case 'cleanup':
        await cleanup.performSmartCleanup();
        break;
      default:
        console.log('Usage: node cleanup-system.js [snapshot|analyze|cleanup]');
    }
  }
  
  main().catch(console.error);
}