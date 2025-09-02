#!/usr/bin/env node

/**
 * CLI command for tracing data flow through the application
 */

import { DataFlowTracer } from '../validator/data-flow-tracer';
import * as path from 'path';
import * as fs from 'fs';

// Parse command line arguments
const args = process.argv.slice(2);
const projectPath = args[0] || process.cwd();

// Resolve path
const resolvedPath = path.isAbsolute(projectPath) 
  ? projectPath 
  : path.resolve(process.cwd(), projectPath);

console.log('🔍 AI Observer - Data Flow Tracer\n');
console.log(`Project: ${resolvedPath}\n`);

async function run() {
  try {
    const tracer = new DataFlowTracer(resolvedPath);
    const graph = await tracer.analyze();
    
    console.log(`✅ Analysis complete!\n`);
    console.log(`📊 Results:`);
    console.log(`  - Nodes analyzed: ${graph.nodes.size}`);
    console.log(`  - Connections found: ${graph.edges.length}`);
    console.log(`  - Issues detected: ${graph.issues.length}\n`);
    
    if (graph.issues.length > 0) {
      const errors = graph.issues.filter(i => i.severity === 'error');
      const warnings = graph.issues.filter(i => i.severity === 'warning');
      
      if (errors.length > 0) {
        console.log(`❌ Critical Issues (${errors.length}):`);
        errors.slice(0, 5).forEach(issue => {
          console.log(`  - ${issue.message}`);
          if (issue.expected && issue.actual) {
            console.log(`    Expected: ${issue.expected}, Got: ${issue.actual}`);
          }
        });
        if (errors.length > 5) {
          console.log(`  ... and ${errors.length - 5} more`);
        }
        console.log();
      }
      
      if (warnings.length > 0) {
        console.log(`⚠️  Warnings (${warnings.length}):`);
        warnings.slice(0, 3).forEach(issue => {
          console.log(`  - ${issue.message}`);
        });
        if (warnings.length > 3) {
          console.log(`  ... and ${warnings.length - 3} more`);
        }
        console.log();
      }
    } else {
      console.log('✅ No data flow issues detected!');
    }
    
    // Save detailed report
    const report = tracer.generateReport();
    const reportPath = path.join(resolvedPath, '.observer', 'data-flow-report.md');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, report);
    
    console.log(`📝 Detailed report saved to: ${reportPath}`);
    
    // Save graph as JSON
    const graphPath = path.join(resolvedPath, '.observer', 'data-flow-graph.json');
    const graphData = {
      nodes: Array.from(graph.nodes.values()),
      edges: graph.edges,
      issues: graph.issues
    };
    fs.writeFileSync(graphPath, JSON.stringify(graphData, null, 2));
    
    process.exit(graph.issues.filter(i => i.severity === 'error').length > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

run();