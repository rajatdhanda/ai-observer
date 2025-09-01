import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

/**
 * Enhanced Data Flow Analyzer with Best Practices
 * - Call graph generation
 * - Dependency tracking
 * - Error propagation paths
 * - Performance bottleneck detection
 * - Data lineage tracking
 */

export interface DataFlowNode {
  id: string;
  type: 'function' | 'component' | 'api' | 'database' | 'external';
  name: string;
  file: string;
  line: number;
  inputs: DataType[];
  outputs: DataType[];
  dependencies: string[];
  calls: string[];
  calledBy: string[];
  errors: ErrorPattern[];
  performance: PerformanceMetric;
}

export interface DataType {
  name: string;
  type: string;
  required: boolean;
  validated: boolean;
  source?: string;
}

export interface ErrorPattern {
  type: 'throw' | 'catch' | 'propagate' | 'unhandled';
  message?: string;
  handled: boolean;
  propagatesTo: string[];
}

export interface PerformanceMetric {
  complexity: number;  // Cyclomatic complexity
  dbCalls: number;
  apiCalls: number;
  loops: number;
  asyncOperations: number;
  estimatedLatency?: number;
}

export interface DataLineage {
  field: string;
  origin: string;
  transformations: Transformation[];
  destinations: string[];
  validators: string[];
}

export interface Transformation {
  location: string;
  operation: string;
  adds?: string[];
  removes?: string[];
  modifies?: string[];
}

export interface CallGraph {
  nodes: Map<string, DataFlowNode>;
  edges: CallEdge[];
  clusters: Cluster[];
  criticalPaths: CriticalPath[];
  bottlenecks: Bottleneck[];
}

export interface CallEdge {
  from: string;
  to: string;
  type: 'sync' | 'async' | 'callback' | 'event';
  dataFlow: string[];
  errorFlow: boolean;
}

export interface Cluster {
  name: string;
  type: 'feature' | 'layer' | 'module';
  nodes: string[];
  externalDependencies: string[];
  cohesion: number;  // 0-1 score
}

export interface CriticalPath {
  name: string;
  nodes: string[];
  totalComplexity: number;
  estimatedLatency: number;
  errorRisk: 'high' | 'medium' | 'low';
  bottlenecks: string[];
}

export interface Bottleneck {
  nodeId: string;
  type: 'n+1' | 'synchronous-io' | 'heavy-computation' | 'multiple-db-calls';
  severity: 'critical' | 'major' | 'minor';
  impact: string[];
  suggestion: string;
}

export class EnhancedDataFlowAnalyzer {
  private program!: ts.Program;
  private checker!: ts.TypeChecker;
  private callGraph: CallGraph;
  private sourceFiles: Map<string, ts.SourceFile> = new Map();

  constructor(private projectPath: string) {
    this.callGraph = {
      nodes: new Map(),
      edges: [],
      clusters: [],
      criticalPaths: [],
      bottlenecks: []
    };
    
    this.initializeTypeScript();
  }

  private initializeTypeScript() {
    const configPath = ts.findConfigFile(
      this.projectPath,
      ts.sys.fileExists,
      'tsconfig.json'
    );

    if (!configPath) {
      throw new Error('Could not find tsconfig.json');
    }

    const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
    const parsedConfig = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      path.dirname(configPath)
    );

    this.program = ts.createProgram(
      parsedConfig.fileNames,
      parsedConfig.options
    );
    
    this.checker = this.program.getTypeChecker();

    // Store source files for quick access
    for (const sourceFile of this.program.getSourceFiles()) {
      if (!sourceFile.isDeclarationFile) {
        this.sourceFiles.set(sourceFile.fileName, sourceFile);
      }
    }
  }

  async analyze(): Promise<CallGraph> {
    console.log('🔍 Starting enhanced data flow analysis...');
    
    // Step 1: Build call graph
    this.buildCallGraph();
    
    // Step 2: Analyze dependencies
    this.analyzeDependencies();
    
    // Step 3: Detect error flows
    this.analyzeErrorFlows();
    
    // Step 4: Calculate performance metrics
    this.calculatePerformanceMetrics();
    
    // Step 5: Identify clusters
    this.identifyClusters();
    
    // Step 6: Find critical paths
    this.findCriticalPaths();
    
    // Step 7: Detect bottlenecks
    this.detectBottlenecks();
    
    // Step 8: Generate visualizations
    await this.generateVisualizations();
    
    return this.callGraph;
  }

  private buildCallGraph() {
    for (const [fileName, sourceFile] of this.sourceFiles) {
      this.visitNode(sourceFile, fileName);
    }
  }

  private visitNode(node: ts.Node, fileName: string) {
    if (ts.isFunctionDeclaration(node) || 
        ts.isMethodDeclaration(node) ||
        ts.isArrowFunction(node) ||
        ts.isFunctionExpression(node)) {
      
      const flowNode = this.createFlowNode(node, fileName);
      if (flowNode) {
        this.callGraph.nodes.set(flowNode.id, flowNode);
        this.analyzeFunction(node, flowNode);
      }
    }

    ts.forEachChild(node, child => this.visitNode(child, fileName));
  }

  private createFlowNode(node: ts.Node, fileName: string): DataFlowNode | null {
    const name = this.getNodeName(node);
    if (!name) return null;

    const { line } = ts.getLineAndCharacterOfPosition(
      node.getSourceFile(),
      node.getStart()
    );

    return {
      id: `${fileName}:${name}:${line}`,
      type: this.determineNodeType(node, fileName),
      name,
      file: fileName,
      line: line + 1,
      inputs: this.extractInputs(node),
      outputs: this.extractOutputs(node),
      dependencies: [],
      calls: [],
      calledBy: [],
      errors: [],
      performance: {
        complexity: 1,
        dbCalls: 0,
        apiCalls: 0,
        loops: 0,
        asyncOperations: 0
      }
    };
  }

  private getNodeName(node: ts.Node): string {
    if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
      return node.name?.getText() || 'anonymous';
    }
    
    if (ts.isVariableDeclaration(node.parent)) {
      return node.parent.name.getText();
    }
    
    return 'anonymous';
  }

  private determineNodeType(node: ts.Node, fileName: string): DataFlowNode['type'] {
    const fileNameLower = fileName.toLowerCase();
    
    if (fileNameLower.includes('/api/') || fileNameLower.includes('route')) {
      return 'api';
    }
    
    if (fileNameLower.includes('component') || fileNameLower.endsWith('.tsx')) {
      return 'component';
    }
    
    if (fileNameLower.includes('db') || fileNameLower.includes('database')) {
      return 'database';
    }
    
    return 'function';
  }

  private extractInputs(node: ts.Node): DataType[] {
    const inputs: DataType[] = [];
    
    if (ts.isFunctionLike(node) && node.parameters) {
      for (const param of node.parameters) {
        const type = this.checker.getTypeAtLocation(param);
        const typeString = this.checker.typeToString(type);
        
        inputs.push({
          name: param.name?.getText() || 'param',
          type: typeString,
          required: !param.questionToken,
          validated: this.hasValidation(param)
        });
      }
    }
    
    return inputs;
  }

  private extractOutputs(node: ts.Node): DataType[] {
    const outputs: DataType[] = [];
    
    if (ts.isFunctionLike(node)) {
      const signature = this.checker.getSignatureFromDeclaration(node);
      if (signature) {
        const returnType = this.checker.getReturnTypeOfSignature(signature);
        const typeString = this.checker.typeToString(returnType);
        
        outputs.push({
          name: 'return',
          type: typeString,
          required: true,
          validated: false
        });
      }
    }
    
    return outputs;
  }

  private hasValidation(node: ts.Node): boolean {
    // Check for validation patterns like zod, joi, etc.
    const parent = node.parent;
    if (!parent) return false;
    
    const text = parent.getText();
    return text.includes('.parse(') || 
           text.includes('.validate(') || 
           text.includes('z.') ||
           text.includes('joi.');
  }

  private analyzeFunction(node: ts.Node, flowNode: DataFlowNode) {
    const visitor = (child: ts.Node) => {
      // Track function calls
      if (ts.isCallExpression(child)) {
        const callName = this.getCallName(child);
        if (callName) {
          flowNode.calls.push(callName);
          
          // Track API calls
          if (callName.includes('fetch') || callName.includes('axios')) {
            flowNode.performance.apiCalls++;
          }
          
          // Track DB calls
          if (callName.includes('query') || callName.includes('find') || 
              callName.includes('create') || callName.includes('update')) {
            flowNode.performance.dbCalls++;
          }
          
          // Track async operations
          if (callName.includes('await') || callName.includes('async')) {
            flowNode.performance.asyncOperations++;
          }
        }
      }
      
      // Track loops
      if (ts.isForStatement(child) || ts.isWhileStatement(child) || 
          ts.isDoStatement(child) || ts.isForInStatement(child) || 
          ts.isForOfStatement(child)) {
        flowNode.performance.loops++;
        flowNode.performance.complexity++;
      }
      
      // Track conditionals (complexity)
      if (ts.isIfStatement(child) || ts.isConditionalExpression(child) ||
          ts.isSwitchStatement(child)) {
        flowNode.performance.complexity++;
      }
      
      // Track error handling
      if (ts.isThrowStatement(child)) {
        flowNode.errors.push({
          type: 'throw',
          handled: this.isInTryCatch(child),
          propagatesTo: []
        });
      }
      
      if (ts.isCatchClause(child)) {
        flowNode.errors.push({
          type: 'catch',
          handled: true,
          propagatesTo: []
        });
      }
      
      ts.forEachChild(child, visitor);
    };
    
    ts.forEachChild(node, visitor);
  }

  private getCallName(node: ts.CallExpression): string {
    const expression = node.expression;
    
    if (ts.isIdentifier(expression)) {
      return expression.text;
    }
    
    if (ts.isPropertyAccessExpression(expression)) {
      return expression.getText();
    }
    
    return '';
  }

  private isInTryCatch(node: ts.Node): boolean {
    let parent = node.parent;
    while (parent) {
      if (ts.isTryStatement(parent)) {
        return true;
      }
      parent = parent.parent;
    }
    return false;
  }

  private analyzeDependencies() {
    // Build call relationships
    for (const [id, node] of this.callGraph.nodes) {
      for (const call of node.calls) {
        const targetNode = this.findNodeByName(call);
        if (targetNode) {
          targetNode.calledBy.push(id);
          
          this.callGraph.edges.push({
            from: id,
            to: targetNode.id,
            type: node.performance.asyncOperations > 0 ? 'async' : 'sync',
            dataFlow: node.outputs.map(o => o.name),
            errorFlow: node.errors.length > 0
          });
        }
      }
    }
  }

  private findNodeByName(name: string): DataFlowNode | undefined {
    for (const node of this.callGraph.nodes.values()) {
      if (node.name === name || node.id.includes(name)) {
        return node;
      }
    }
    return undefined;
  }

  private analyzeErrorFlows() {
    // Track error propagation through call graph
    for (const [id, node] of this.callGraph.nodes) {
      if (node.errors.length > 0) {
        this.propagateErrors(node, new Set());
      }
    }
  }

  private propagateErrors(node: DataFlowNode, visited: Set<string>) {
    if (visited.has(node.id)) return;
    visited.add(node.id);
    
    for (const callerId of node.calledBy) {
      const caller = this.callGraph.nodes.get(callerId);
      if (caller) {
        const hasErrorHandling = caller.errors.some(e => e.type === 'catch');
        
        if (!hasErrorHandling) {
          caller.errors.push({
            type: 'propagate',
            handled: false,
            propagatesTo: [node.id]
          });
          
          this.propagateErrors(caller, visited);
        }
      }
    }
  }

  private calculatePerformanceMetrics() {
    for (const node of this.callGraph.nodes.values()) {
      // Estimate latency based on operations
      let estimatedLatency = 0;
      
      estimatedLatency += node.performance.dbCalls * 50;  // 50ms per DB call
      estimatedLatency += node.performance.apiCalls * 100; // 100ms per API call
      estimatedLatency += node.performance.loops * 10;     // 10ms per loop
      estimatedLatency += node.performance.complexity * 2;  // 2ms per branch
      
      node.performance.estimatedLatency = estimatedLatency;
    }
  }

  private identifyClusters() {
    // Group related nodes into clusters
    const clusters = new Map<string, Set<string>>();
    
    for (const [id, node] of this.callGraph.nodes) {
      const clusterName = this.getClusterName(node.file);
      
      if (!clusters.has(clusterName)) {
        clusters.set(clusterName, new Set());
      }
      
      clusters.get(clusterName)!.add(id);
    }
    
    // Convert to cluster objects
    for (const [name, nodeIds] of clusters) {
      const cluster: Cluster = {
        name,
        type: this.determineClusterType(name),
        nodes: Array.from(nodeIds),
        externalDependencies: this.findExternalDependencies(nodeIds),
        cohesion: this.calculateCohesion(nodeIds)
      };
      
      this.callGraph.clusters.push(cluster);
    }
  }

  private getClusterName(filePath: string): string {
    const parts = filePath.split('/');
    const relevantParts = parts.slice(-3, -1);
    return relevantParts.join('/');
  }

  private determineClusterType(name: string): Cluster['type'] {
    if (name.includes('feature')) return 'feature';
    if (name.includes('api') || name.includes('routes')) return 'layer';
    return 'module';
  }

  private findExternalDependencies(nodeIds: Set<string>): string[] {
    const external: Set<string> = new Set();
    
    for (const nodeId of nodeIds) {
      const node = this.callGraph.nodes.get(nodeId);
      if (node) {
        for (const call of node.calls) {
          const targetNode = this.findNodeByName(call);
          if (targetNode && !nodeIds.has(targetNode.id)) {
            external.add(targetNode.id);
          }
        }
      }
    }
    
    return Array.from(external);
  }

  private calculateCohesion(nodeIds: Set<string>): number {
    let internalCalls = 0;
    let externalCalls = 0;
    
    for (const nodeId of nodeIds) {
      const node = this.callGraph.nodes.get(nodeId);
      if (node) {
        for (const call of node.calls) {
          const targetNode = this.findNodeByName(call);
          if (targetNode) {
            if (nodeIds.has(targetNode.id)) {
              internalCalls++;
            } else {
              externalCalls++;
            }
          }
        }
      }
    }
    
    const total = internalCalls + externalCalls;
    return total > 0 ? internalCalls / total : 1;
  }

  private findCriticalPaths() {
    // Find paths with high complexity or latency
    const paths: CriticalPath[] = [];
    
    // Find entry points (nodes with no callers)
    const entryPoints = Array.from(this.callGraph.nodes.values())
      .filter(node => node.calledBy.length === 0);
    
    for (const entry of entryPoints) {
      const path = this.tracePath(entry, [], new Set());
      if (path.length > 0) {
        const criticalPath = this.analyzePath(path);
        paths.push(criticalPath);
      }
    }
    
    // Sort by criticality
    paths.sort((a, b) => b.totalComplexity - a.totalComplexity);
    
    this.callGraph.criticalPaths = paths.slice(0, 10); // Top 10 critical paths
  }

  private tracePath(node: DataFlowNode, path: DataFlowNode[], visited: Set<string>): DataFlowNode[] {
    if (visited.has(node.id)) return path;
    
    visited.add(node.id);
    path.push(node);
    
    let longestPath = path;
    
    for (const call of node.calls) {
      const targetNode = this.findNodeByName(call);
      if (targetNode) {
        const subPath = this.tracePath(targetNode, [...path], new Set(visited));
        if (subPath.length > longestPath.length) {
          longestPath = subPath;
        }
      }
    }
    
    return longestPath;
  }

  private analyzePath(path: DataFlowNode[]): CriticalPath {
    let totalComplexity = 0;
    let estimatedLatency = 0;
    const bottlenecks: string[] = [];
    
    for (const node of path) {
      totalComplexity += node.performance.complexity;
      estimatedLatency += node.performance.estimatedLatency || 0;
      
      if (node.performance.estimatedLatency && node.performance.estimatedLatency > 100) {
        bottlenecks.push(node.id);
      }
    }
    
    const hasUnhandledErrors = path.some(n => 
      n.errors.some(e => !e.handled)
    );
    
    return {
      name: `${path[0].name} → ${path[path.length - 1].name}`,
      nodes: path.map(n => n.id),
      totalComplexity,
      estimatedLatency,
      errorRisk: hasUnhandledErrors ? 'high' : 
                 totalComplexity > 20 ? 'medium' : 'low',
      bottlenecks
    };
  }

  private detectBottlenecks() {
    for (const [id, node] of this.callGraph.nodes) {
      const bottlenecks = this.analyzeBottlenecks(node);
      this.callGraph.bottlenecks.push(...bottlenecks);
    }
    
    // Sort by severity
    this.callGraph.bottlenecks.sort((a, b) => {
      const severityOrder = { critical: 0, major: 1, minor: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  private analyzeBottlenecks(node: DataFlowNode): Bottleneck[] {
    const bottlenecks: Bottleneck[] = [];
    
    // N+1 query detection
    if (node.performance.loops > 0 && node.performance.dbCalls > 0) {
      bottlenecks.push({
        nodeId: node.id,
        type: 'n+1',
        severity: 'critical',
        impact: node.calledBy,
        suggestion: 'Consider batch loading or using JOIN queries'
      });
    }
    
    // Multiple DB calls
    if (node.performance.dbCalls > 3) {
      bottlenecks.push({
        nodeId: node.id,
        type: 'multiple-db-calls',
        severity: 'major',
        impact: node.calledBy,
        suggestion: 'Consider combining queries or using transactions'
      });
    }
    
    // Synchronous IO in loops
    if (node.performance.loops > 0 && 
        (node.performance.apiCalls > 0 || node.performance.dbCalls > 0) &&
        node.performance.asyncOperations === 0) {
      bottlenecks.push({
        nodeId: node.id,
        type: 'synchronous-io',
        severity: 'critical',
        impact: node.calledBy,
        suggestion: 'Use Promise.all() or async/await for parallel execution'
      });
    }
    
    // Heavy computation
    if (node.performance.complexity > 10) {
      bottlenecks.push({
        nodeId: node.id,
        type: 'heavy-computation',
        severity: 'minor',
        impact: node.calledBy,
        suggestion: 'Consider memoization or moving to background job'
      });
    }
    
    return bottlenecks;
  }

  private async generateVisualizations() {
    const mermaidDiagram = this.generateMermaidDiagram();
    const d3Data = this.generateD3Data();
    
    // Save visualization data
    const outputDir = path.join(process.cwd(), '.observer');
    
    fs.writeFileSync(
      path.join(outputDir, 'dataflow-mermaid.md'),
      mermaidDiagram
    );
    
    fs.writeFileSync(
      path.join(outputDir, 'dataflow-d3.json'),
      JSON.stringify(d3Data, null, 2)
    );
    
    console.log('📊 Visualizations generated in .observer/');
  }

  private generateMermaidDiagram(): string {
    let diagram = '```mermaid\ngraph TD\n';
    
    // Add nodes
    for (const [id, node] of this.callGraph.nodes) {
      const label = `${node.name}<br/>📁 ${path.basename(node.file)}`;
      const style = this.getNodeStyle(node);
      diagram += `  ${this.sanitizeId(id)}["${label}"]${style}\n`;
    }
    
    // Add edges
    for (const edge of this.callGraph.edges) {
      const label = edge.errorFlow ? 'error' : edge.type;
      diagram += `  ${this.sanitizeId(edge.from)} -->|${label}| ${this.sanitizeId(edge.to)}\n`;
    }
    
    // Add subgraphs for clusters
    for (const cluster of this.callGraph.clusters) {
      diagram += `\n  subgraph ${this.sanitizeId(cluster.name)}\n`;
      for (const nodeId of cluster.nodes) {
        const node = this.callGraph.nodes.get(nodeId);
        if (node) {
          diagram += `    ${this.sanitizeId(nodeId)}\n`;
        }
      }
      diagram += `  end\n`;
    }
    
    diagram += '```\n';
    
    return diagram;
  }

  private sanitizeId(id: string): string {
    return id.replace(/[^a-zA-Z0-9]/g, '_');
  }

  private getNodeStyle(node: DataFlowNode): string {
    if (node.errors.some(e => !e.handled)) {
      return ':::error';
    }
    if (node.performance.estimatedLatency && node.performance.estimatedLatency > 200) {
      return ':::warning';
    }
    if (node.type === 'api') {
      return ':::api';
    }
    if (node.type === 'database') {
      return ':::database';
    }
    return '';
  }

  private generateD3Data() {
    const nodes = Array.from(this.callGraph.nodes.values()).map(node => ({
      id: node.id,
      name: node.name,
      type: node.type,
      complexity: node.performance.complexity,
      latency: node.performance.estimatedLatency,
      errors: node.errors.length,
      file: path.basename(node.file)
    }));
    
    const links = this.callGraph.edges.map(edge => ({
      source: edge.from,
      target: edge.to,
      type: edge.type,
      hasErrors: edge.errorFlow
    }));
    
    return { nodes, links };
  }

  async testEndpoints(): Promise<EndpointTestResult[]> {
    console.log('🏓 Testing API endpoints...');
    const results: EndpointTestResult[] = [];
    
    // Find API nodes
    const apiNodes = Array.from(this.callGraph.nodes.values())
      .filter(node => node.type === 'api');
    
    for (const node of apiNodes) {
      const endpoint = this.extractEndpoint(node);
      if (endpoint) {
        const result = await this.pingEndpoint(endpoint);
        results.push(result);
      }
    }
    
    return results;
  }

  private extractEndpoint(node: DataFlowNode): string | null {
    // Extract endpoint from file path
    const match = node.file.match(/api\/(.+?)\/(route|index)\.(ts|js)/);
    if (match) {
      return `/api/${match[1]}`;
    }
    return null;
  }

  private async pingEndpoint(endpoint: string): Promise<EndpointTestResult> {
    const baseUrl = 'http://localhost:3000'; // Configure this
    const url = `${baseUrl}${endpoint}`;
    
    try {
      const start = Date.now();
      const response = await fetch(url, { method: 'GET' });
      const latency = Date.now() - start;
      
      return {
        endpoint,
        status: response.status,
        latency,
        success: response.ok,
        error: null
      };
    } catch (error) {
      return {
        endpoint,
        status: 0,
        latency: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export interface EndpointTestResult {
  endpoint: string;
  status: number;
  latency: number;
  success: boolean;
  error: string | null;
}