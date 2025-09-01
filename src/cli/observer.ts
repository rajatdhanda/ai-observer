#!/usr/bin/env node

/**
 * AI Observer CLI
 * Generic tool to analyze ANY TypeScript/JavaScript project
 */

import * as fs from 'fs';
import * as path from 'path';
import { ProjectAnalyzer } from '../analyzer';
import { BusinessLogicAnalyzer } from '../analyzer/business-logic-analyzer';
import { EnhancedDataFlowAnalyzer } from '../analyzer/enhanced-data-flow';
import { spawn } from 'child_process';

class ObserverCLI {
  private projectPath: string;
  private command: string;

  constructor() {
    const args = process.argv.slice(2);
    this.command = args[0] || 'help';
    this.projectPath = args[1] || process.cwd();

    // Resolve relative paths
    if (!path.isAbsolute(this.projectPath)) {
      this.projectPath = path.resolve(process.cwd(), this.projectPath);
    }
  }

  async run() {
    console.log(`\n🔍 AI Observer\n`);
    console.log(`Project: ${this.projectPath}\n`);

    switch (this.command) {
      case 'analyze':
        await this.analyze();
        break;
      case 'business':
        await this.analyzeBusiness();
        break;
      case 'flow':
        await this.analyzeFlow();
        break;
      case 'dashboard':
        await this.startDashboard();
        break;
      case 'watch':
        await this.watch();
        break;
      default:
        this.showHelp();
    }
  }

  private async analyze() {
    console.log('📊 Running full analysis...\n');
    
    // Ensure project exists
    if (!fs.existsSync(this.projectPath)) {
      console.error(`❌ Project path does not exist: ${this.projectPath}`);
      process.exit(1);
    }

    // Create .observer directory
    const observerDir = path.join(this.projectPath, '.observer');
    if (!fs.existsSync(observerDir)) {
      fs.mkdirSync(observerDir, { recursive: true });
    }

    try {
      // Run standard analysis
      const analyzer = new ProjectAnalyzer();
      const analysis = await analyzer.analyze(this.projectPath);
      
      // Save results
      fs.writeFileSync(
        path.join(observerDir, 'analysis.json'),
        JSON.stringify(analysis, null, 2)
      );

      // Display summary
      console.log('✅ Analysis complete!\n');
      console.log(`📈 Summary:`);
      console.log(`  - Types: ${analysis.types?.totalCount || 0}`);
      console.log(`  - Entities: ${analysis.entities?.length || 0}`);
      console.log(`  - Validation Rules: ${analysis.validationRules?.length || 0}`);
      console.log(`  - Data Flow Layers: ${analysis.dataFlow?.layers?.length || 0}`);
      console.log(`\nResults saved to: ${path.join(observerDir, 'analysis.json')}`);
      
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      process.exit(1);
    }
  }

  private async analyzeBusiness() {
    console.log('🏢 Analyzing business logic...\n');
    
    const observerDir = path.join(this.projectPath, '.observer');
    if (!fs.existsSync(observerDir)) {
      fs.mkdirSync(observerDir, { recursive: true });
    }

    try {
      const analyzer = new BusinessLogicAnalyzer(this.projectPath);
      const results = await analyzer.analyze();
      
      // Save results
      fs.writeFileSync(
        path.join(observerDir, 'business-analysis.json'),
        JSON.stringify(results, null, 2)
      );

      // Display summary
      console.log('✅ Business analysis complete!\n');
      console.log(`📊 Found:`);
      console.log(`  - Tables: ${results.tables.length}`);
      console.log(`  - Workflows: ${results.workflows.length}`);
      console.log(`  - Hooks: ${results.hooks.length}`);
      console.log(`  - Features: ${results.features.length}`);
      console.log(`  - Business Rules: ${results.businessRules.length}`);
      
      // Show feature health
      console.log(`\n🏥 Feature Health:`);
      results.features.forEach(feature => {
        const icon = feature.healthStatus === 'working' ? '✅' : 
                     feature.healthStatus === 'broken' ? '❌' : '⚠️';
        console.log(`  ${icon} ${feature.name}: ${feature.healthStatus}`);
        if (feature.issues.length > 0) {
          feature.issues.forEach(issue => {
            console.log(`     - ${issue}`);
          });
        }
      });
      
    } catch (error) {
      console.error('❌ Business analysis failed:', error);
      process.exit(1);
    }
  }

  private async analyzeFlow() {
    console.log('🔄 Analyzing data flow...\n');
    
    const observerDir = path.join(this.projectPath, '.observer');
    if (!fs.existsSync(observerDir)) {
      fs.mkdirSync(observerDir, { recursive: true });
    }

    try {
      const analyzer = new EnhancedDataFlowAnalyzer(this.projectPath);
      const results = await analyzer.analyze();
      
      // Convert Map to serializable format
      const serializable = {
        ...results,
        nodes: Array.from(results.nodes.values())
      };
      
      // Save results
      fs.writeFileSync(
        path.join(observerDir, 'flow-analysis.json'),
        JSON.stringify(serializable, null, 2)
      );

      // Display summary
      console.log('✅ Flow analysis complete!\n');
      console.log(`📊 Found:`);
      console.log(`  - Functions analyzed: ${results.nodes.size}`);
      console.log(`  - Bottlenecks: ${results.bottlenecks.length}`);
      console.log(`  - Critical paths: ${results.criticalPaths.length}`);
      
      // Show bottlenecks
      if (results.bottlenecks.length > 0) {
        console.log(`\n⚠️  Bottlenecks detected:`);
        results.bottlenecks.slice(0, 5).forEach(b => {
          console.log(`  - ${b.type}: ${b.suggestion || 'Check implementation'}`);
          console.log(`    Severity: ${b.severity}`);
        });
      }
      
    } catch (error) {
      console.error('❌ Flow analysis failed:', error);
      process.exit(1);
    }
  }

  private async startDashboard() {
    console.log('🚀 Starting dashboard...\n');
    
    // Start dashboard with project path
    const dashboardProcess = spawn('ts-node', [
      path.join(__dirname, '../dashboard/index.ts'),
      this.projectPath
    ], {
      stdio: 'inherit',
      env: {
        ...process.env,
        OBSERVER_PROJECT_PATH: this.projectPath
      }
    });

    dashboardProcess.on('error', (error) => {
      console.error('❌ Failed to start dashboard:', error);
      process.exit(1);
    });
  }

  private async watch() {
    console.log('👁️  Starting watch mode...\n');
    
    // Start observer in watch mode
    const watchProcess = spawn('ts-node', [
      path.join(__dirname, '../index.ts'),
      '--watch'
    ], {
      stdio: 'inherit',
      cwd: this.projectPath
    });

    watchProcess.on('error', (error) => {
      console.error('❌ Failed to start watch mode:', error);
      process.exit(1);
    });
  }

  private showHelp() {
    console.log(`
Usage: observer <command> [project-path]

Commands:
  analyze [path]    Run full project analysis
  business [path]   Analyze business logic and features
  flow [path]       Analyze data flow and bottlenecks
  dashboard [path]  Start interactive dashboard
  watch [path]      Start watch mode for real-time monitoring
  help             Show this help message

Examples:
  observer analyze                    # Analyze current directory
  observer analyze ./my-project       # Analyze specific project
  observer business ../other-project  # Analyze business logic
  observer dashboard .                # Start dashboard for current dir
  observer flow /absolute/path        # Analyze data flow

The tool will analyze ANY TypeScript/JavaScript project and provide:
  - Type and schema detection
  - Business logic understanding
  - Data flow visualization
  - Error and bottleneck detection
  - Real-time monitoring dashboard
    `);
  }
}

// Run CLI
const cli = new ObserverCLI();
cli.run().catch(console.error);