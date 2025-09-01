import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { EnhancedDataFlowAnalyzer } from '../analyzer/enhanced-data-flow';
import { ProjectAnalyzer } from '../analyzer';
import { BusinessLogicAnalyzer } from '../analyzer/business-logic-analyzer';
import { renderBusinessView } from './components/business-view';
import { ProjectValidator } from '../validator';
import { renderValidationView } from './components/validation-view';
import { TableMapper } from '../validator/table-mapper';
import { renderTableFlowView } from './components/table-flow-view';

const PORT = 3001;

class Dashboard {
  private analysisData: any = null;
  private flowAnalyzer: EnhancedDataFlowAnalyzer | null = null;
  private dataFlowResults: any = null;
  private activeErrors: any[] = [];
  private bottlenecks: any[] = [];
  private businessAnalyzer: BusinessLogicAnalyzer | null = null;
  private businessData: any = null;
  private projectPath: string;
  private availableProjects: string[] = [];
  private validator: ProjectValidator | null = null;
  private validationResults: any = null;
  private tableMapper: TableMapper | null = null;
  private tableMappingResults: any = null;

  constructor() {
    // Get project path from environment or command line
    this.projectPath = process.argv[2] || process.env.OBSERVER_PROJECT_PATH || process.cwd();
    this.scanForProjects();
  }

  private scanForProjects() {
    // Look for TypeScript projects in common locations
    const locations = [
      process.cwd(),
      path.join(process.cwd(), 'test-projects'),
      path.join(process.cwd(), '..')
    ];

    for (const loc of locations) {
      if (fs.existsSync(loc)) {
        const dirs = fs.readdirSync(loc, { withFileTypes: true })
          .filter(d => d.isDirectory())
          .map(d => path.join(loc, d.name))
          .filter(p => fs.existsSync(path.join(p, 'tsconfig.json')) || fs.existsSync(path.join(p, 'package.json')));
        this.availableProjects.push(...dirs);
      }
    }
  }

  async start() {
    // Load analysis if exists for current project
    const analysisPath = path.join(this.projectPath, '.observer', 'analysis.json');
    if (fs.existsSync(analysisPath)) {
      this.analysisData = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
    }

    const server = http.createServer(async (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      if (req.url === '/api/projects') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          current: this.projectPath,
          available: this.availableProjects
        }));
      } else if (req.url?.startsWith('/api/set-project')) {
        const url = new URL(req.url, `http://localhost:${PORT}`);
        const newPath = url.searchParams.get('path');
        if (newPath && fs.existsSync(newPath)) {
          this.projectPath = newPath;
          this.analysisData = null;
          this.businessData = null;
          this.dataFlowResults = null;
          
          // Reload analysis for new project
          const analysisPath = path.join(this.projectPath, '.observer', 'analysis.json');
          if (fs.existsSync(analysisPath)) {
            this.analysisData = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
          }
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, path: this.projectPath }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid project path' }));
        }
      } else if (req.url === '/api/analysis') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(this.analysisData || {}));
      } else if (req.url === '/api/check-errors') {
        const errors = await this.checkForErrors();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(errors));
      } else if (req.url === '/api/analyze-flow') {
        const flow = await this.analyzeDataFlow();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(flow));
      } else if (req.url === '/api/business-analysis') {
        const business = await this.analyzeBusinessLogic();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(business));
      } else if (req.url === '/api/business-view') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(renderBusinessView(this.businessData));
      } else if (req.url === '/api/validate') {
        const validation = await this.runValidation();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(validation));
      } else if (req.url === '/api/validation-view') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(renderValidationView(this.validationResults));
      } else if (req.url === '/api/table-mapping') {
        const mapping = await this.mapTables();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(mapping));
      } else if (req.url === '/api/table-flow-view') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(renderTableFlowView(this.tableMappingResults));
      } else if (req.url === '/enhanced') {
        const enhancedPath = path.join(__dirname, 'enhanced.html');
        const html = fs.readFileSync(enhancedPath, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
      } else if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(this.getHTML());
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    server.listen(PORT, () => {
      console.log(`
AI Observer Dashboard
URL: http://localhost:${PORT}
Project: ${this.projectPath}

Features:
- Real-time error detection
- Data flow analysis
- Business logic analysis
- Type validation

Available projects: ${this.availableProjects.length}
      `);
    });
  }

  private async checkForErrors() {
    const projectPath = this.projectPath;
    
    // Run flow analysis
    if (!this.dataFlowResults) {
      await this.analyzeDataFlow();
    }

    // Extract errors and issues
    const errors = [];
    
    // Get unhandled errors from flow analysis
    if (this.dataFlowResults?.nodes) {
      for (const node of this.dataFlowResults.nodes) {
        if (node.errors?.length > 0) {
          const unhandled = node.errors.filter((e: any) => !e.handled);
          if (unhandled.length > 0) {
            errors.push({
              type: 'unhandled_error',
              severity: 'error',
              file: node.file,
              function: node.name,
              line: node.line,
              errors: unhandled
            });
          }
        }
      }
    }

    // Get bottlenecks
    if (this.dataFlowResults?.bottlenecks) {
      errors.push(...this.dataFlowResults.bottlenecks.map((b: any) => ({
        type: 'bottleneck',
        severity: b.severity,
        ...b
      })));
    }

    // Apply validation rules
    if (this.analysisData?.validationRules) {
      const criticalRules = this.analysisData.validationRules
        .filter((r: any) => r.severity === 'error' && r.type === 'security');
      
      errors.push(...criticalRules.map((r: any) => ({
        type: 'validation',
        severity: 'error',
        rule: r.name,
        path: r.path
      })));
    }

    this.activeErrors = errors;
    return { errors, timestamp: new Date().toISOString() };
  }

  private async analyzeDataFlow() {
    const projectPath = this.projectPath;
    this.flowAnalyzer = new EnhancedDataFlowAnalyzer(projectPath);
    const result = await this.flowAnalyzer.analyze();
    
    // Convert Map to array for serialization
    this.dataFlowResults = {
      ...result,
      nodes: Array.from(result.nodes.values())
    };
    
    this.bottlenecks = result.bottlenecks || [];
    
    return this.dataFlowResults;
  }

  private async analyzeBusinessLogic() {
    const projectPath = this.projectPath;
    this.businessAnalyzer = new BusinessLogicAnalyzer(projectPath);
    this.businessData = await this.businessAnalyzer.analyze();
    return this.businessData;
  }

  private async runValidation() {
    this.validator = new ProjectValidator(this.projectPath);
    this.validationResults = await this.validator.validate();
    return this.validationResults;
  }

  private async mapTables() {
    this.tableMapper = new TableMapper(this.projectPath);
    const results = await this.tableMapper.analyze();
    // Convert Map to serializable object
    this.tableMappingResults = {
      ...results,
      tables: Object.fromEntries(results.tables)
    };
    return this.tableMappingResults;
  }

  private getHTML(): string {
    const hasAnalysis = this.analysisData !== null;
    
    return `<!DOCTYPE html>
<html>
<head>
  <title>AI Observer</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: system-ui, -apple-system, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      padding: 20px;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    h1 { 
      font-size: 2.5rem;
      margin-bottom: 2rem;
      background: linear-gradient(to right, #3b82f6, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .card {
      background: #1e293b;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #334155;
    }
    .stat-value {
      font-size: 3rem;
      font-weight: bold;
      color: #3b82f6;
    }
    .stat-label {
      color: #94a3b8;
      text-transform: uppercase;
      font-size: 0.875rem;
      margin-top: 8px;
    }
    .section {
      background: #1e293b;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }
    h2 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
      color: #cbd5e1;
    }
    .entity-item {
      padding: 12px;
      background: #0f172a;
      border-radius: 8px;
      margin-bottom: 8px;
    }
    .entity-name {
      font-weight: 600;
      color: #e2e8f0;
    }
    .entity-meta {
      font-size: 0.875rem;
      color: #64748b;
      margin-top: 4px;
    }
    .no-data {
      text-align: center;
      padding: 60px;
      color: #64748b;
    }
    .btn {
      background: linear-gradient(to right, #3b82f6, #8b5cf6);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 1rem;
      cursor: pointer;
      margin-bottom: 20px;
    }
    .btn:hover {
      opacity: 0.9;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      background: #334155;
      padding: 12px;
      text-align: left;
      font-weight: 500;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #334155;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge.error { background: #7f1d1d; color: #fca5a5; }
    .badge.warning { background: #78350f; color: #fcd34d; }
    .badge.info { background: #1e3a8a; color: #93c5fd; }
  </style>
</head>
<body>
  <div class="container">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
      <h1>AI Observer Dashboard</h1>
      <div style="display: flex; gap: 10px; align-items: center;">
        <select id="projectSelector" style="background: #1e293b; color: #e2e8f0; padding: 10px; border-radius: 8px; border: 1px solid #334155;">
          ${this.availableProjects.map(p => `
            <option value="${p}" ${p === this.projectPath ? 'selected' : ''}>
              ${path.basename(p)}
            </option>
          `).join('')}
        </select>
        <button class="btn" onclick="changeProject()">Switch Project</button>
      </div>
    </div>
    
    <div style="background: #1e293b; padding: 10px 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
      <strong>Current Project:</strong> ${this.projectPath}
    </div>
    
    ${hasAnalysis ? this.renderAnalysis() : this.renderNoData()}
  </div>
</body>
</html>`;
  }

  private renderNoData(): string {
    return `
    <div class="section">
      <div class="no-data">
        <h2>No Analysis Found</h2>
        <p style="margin: 20px 0;">Run the analyzer to get started:</p>
        <code style="background: #334155; padding: 10px; border-radius: 4px; display: inline-block;">
          npm run analyze:streax
        </code>
      </div>
    </div>
    `;
  }

  private renderAnalysis(): string {
    const data = this.analysisData;
    
    return `
    <div style="display: flex; gap: 10px; margin-bottom: 20px;">
      <button class="btn" onclick="location.reload()">Refresh</button>
      <button class="btn" onclick="checkErrors()">Check for Errors</button>
      <button class="btn" onclick="analyzeFlow()">Analyze Data Flow</button>
      <button class="btn" onclick="analyzeBusiness()">Analyze Business Logic</button>
      <button class="btn" onclick="runValidation()" style="background: linear-gradient(to right, #ef4444, #f59e0b);">🔍 Run 80-20 Validation</button>
      <button class="btn" onclick="mapTableFlow()" style="background: linear-gradient(to right, #8b5cf6, #3b82f6);">🗺️ Map Table Usage</button>
    </div>
    
    <div id="errorPanel" class="section" style="display: none; background: #7f1d1d; border: 2px solid #ef4444;">
      <h2 style="color: #fca5a5;">🚨 Active Errors & Issues</h2>
      <div id="errorList"></div>
    </div>
    
    <div id="flowPanel" class="section" style="display: none;">
      <h2>🔄 Data Flow Analysis</h2>
      <div id="flowResults"></div>
    </div>
    
    <div id="businessPanel" class="section" style="display: none;">
      <h2>🏢 Business Logic Analysis</h2>
      <div id="businessResults"></div>
    </div>
    
    <script>
      async function checkErrors() {
        const res = await fetch('/api/check-errors');
        const data = await res.json();
        
        const panel = document.getElementById('errorPanel');
        const list = document.getElementById('errorList');
        
        if (data.errors && data.errors.length > 0) {
          panel.style.display = 'block';
          let html = '';
          for (const e of data.errors) {
            const severityColor = e.severity === 'critical' ? '#ef4444' : 
                                  e.severity === 'error' ? '#f59e0b' : '#3b82f6';
            html += '<div style="background: #0f172a; padding: 12px; margin: 8px 0; border-radius: 8px; border-left: 4px solid ' + severityColor + ';">';
            html += '<div style="font-weight: bold; color: #fca5a5;">' + e.type.toUpperCase() + ': ' + e.severity + '</div>';
            html += '<div style="color: #e2e8f0; margin: 8px 0;">';
            if (e.file) html += 'File: ' + e.file + ':' + (e.line || '?') + '<br>';
            if (e.function) html += 'Function: ' + e.function + '<br>';
            if (e.suggestion) html += 'Fix: ' + e.suggestion;
            html += '</div></div>';
          }
          list.innerHTML = html;
        } else {
          panel.style.display = 'block';
          panel.style.background = '#14532d';
          panel.style.borderColor = '#10b981';
          list.innerHTML = '<div style="color: #86efac;">✅ No errors detected!</div>';
        }
      }
      
      async function analyzeFlow() {
        const panel = document.getElementById('flowPanel');
        const results = document.getElementById('flowResults');
        panel.style.display = 'block';
        results.innerHTML = '<div style="color: #64748b;">Analyzing data flow...</div>';
        
        const res = await fetch('/api/analyze-flow');
        const data = await res.json();
        
        if (data.nodes) {
          const complexNodes = data.nodes
            .filter(n => n.performance && n.performance.complexity > 5)
            .sort((a, b) => b.performance.complexity - a.performance.complexity);
          
          let html = '<div style="margin-bottom: 20px;"><h3>High Complexity Functions</h3>';
          for (const n of complexNodes.slice(0, 5)) {
            html += '<div style="background: #0f172a; padding: 8px; margin: 4px 0; border-radius: 4px;">';
            html += '<strong>' + n.name + '</strong> - Complexity: ' + n.performance.complexity;
            if (n.performance.dbCalls > 0) html += ' | DB Calls: ' + n.performance.dbCalls;
            html += '</div>';
          }
          html += '</div>';
          html += '<div>';
          html += '<h3>Bottlenecks Found: ' + (data.bottlenecks ? data.bottlenecks.length : 0) + '</h3>';
          html += '<h3>Critical Paths: ' + (data.criticalPaths ? data.criticalPaths.length : 0) + '</h3>';
          html += '<h3>Total Nodes Analyzed: ' + data.nodes.length + '</h3>';
          html += '</div>';
          results.innerHTML = html;
        }
      }
      
      async function changeProject() {
        const selector = document.getElementById('projectSelector');
        const newPath = selector.value;
        const res = await fetch('/api/set-project?path=' + encodeURIComponent(newPath));
        if (res.ok) {
          location.reload();
        }
      }
      
      async function analyzeBusiness() {
        const panel = document.getElementById('businessPanel');
        if (!panel) {
          // Create business panel if it doesn't exist
          const container = document.querySelector('.container');
          const newPanel = document.createElement('div');
          newPanel.id = 'businessPanel';
          newPanel.className = 'section';
          newPanel.style.display = 'none';
          newPanel.innerHTML = '<h2>🏢 Business Logic Analysis</h2><div id="businessResults"></div>';
          container.insertBefore(newPanel, container.querySelector('.grid'));
        }
        
        const resultsPanel = document.getElementById('businessPanel');
        const results = document.getElementById('businessResults');
        resultsPanel.style.display = 'block';
        results.innerHTML = '<div style="color: #64748b;">Analyzing business logic...</div>';
        
        // First analyze the business logic
        await fetch('/api/business-analysis');
        
        // Then fetch the rendered view
        const viewRes = await fetch('/api/business-view');
        const viewHtml = await viewRes.text();
        results.innerHTML = viewHtml;
      }
      
      async function runValidation() {
        const panel = document.getElementById('validationPanel');
        if (!panel) {
          // Create validation panel if it doesn't exist
          const container = document.querySelector('.container');
          const newPanel = document.createElement('div');
          newPanel.id = 'validationPanel';
          newPanel.className = 'section';
          newPanel.style.display = 'none';
          newPanel.innerHTML = '<h2>🔍 80-20 Validation Results</h2><div id="validationResults"></div>';
          container.insertBefore(newPanel, container.querySelector('.grid'));
        }
        
        const resultsPanel = document.getElementById('validationPanel');
        const results = document.getElementById('validationResults');
        resultsPanel.style.display = 'block';
        results.innerHTML = '<div style="color: #64748b;">Running validation checks...</div>';
        
        // Run validation
        const res = await fetch('/api/validate');
        const data = await res.json();
        
        // Fetch the rendered view
        const viewRes = await fetch('/api/validation-view');
        const viewHtml = await viewRes.text();
        results.innerHTML = viewHtml;
        
        // Show score in alert if critical issues
        if (data.critical && data.critical.length > 0) {
          console.error('Found ' + data.critical.length + ' critical issues!');
        }
      }
      
      async function mapTableFlow() {
        const panel = document.getElementById('tableFlowPanel');
        if (!panel) {
          // Create table flow panel if it doesn't exist
          const container = document.querySelector('.container');
          const newPanel = document.createElement('div');
          newPanel.id = 'tableFlowPanel';
          newPanel.className = 'section';
          newPanel.style.display = 'none';
          newPanel.innerHTML = '<h2>🗺️ Table Usage Mapping</h2><div id="tableFlowResults"></div>';
          container.insertBefore(newPanel, container.querySelector('.grid'));
        }
        
        const resultsPanel = document.getElementById('tableFlowPanel');
        const results = document.getElementById('tableFlowResults');
        resultsPanel.style.display = 'block';
        results.innerHTML = '<div style="color: #64748b;">Mapping table usage across codebase...</div>';
        
        // Run table mapping
        const res = await fetch('/api/table-mapping');
        const data = await res.json();
        
        // Fetch the rendered view
        const viewRes = await fetch('/api/table-flow-view');
        const viewHtml = await viewRes.text();
        results.innerHTML = viewHtml;
      }
    </script>
    
    <div class="grid">
      <div class="card">
        <div class="stat-value">${data.types?.totalCount || 0}</div>
        <div class="stat-label">Type Definitions</div>
      </div>
      <div class="card">
        <div class="stat-value">${data.entities?.length || 0}</div>
        <div class="stat-label">Business Entities</div>
      </div>
      <div class="card">
        <div class="stat-value">${data.validationRules?.length || 0}</div>
        <div class="stat-label">Validation Rules</div>
      </div>
      <div class="card">
        <div class="stat-value">${data.dataFlow?.layers?.length || 0}</div>
        <div class="stat-label">Data Layers</div>
      </div>
    </div>

    <div class="section">
      <h2>Framework</h2>
      <div>${data.framework?.name} ${data.framework?.version} (${data.framework?.type})</div>
    </div>

    <div class="section">
      <h2>Business Entities (${data.entities?.length || 0})</h2>
      <div style="max-height: 400px; overflow-y: auto;">
        ${(data.entities || []).map((e: any) => `
          <div class="entity-item">
            <div class="entity-name">${e.name}</div>
            <div class="entity-meta">
              ${e.properties?.length || 0} properties • 
              ${e.relationships?.length || 0} relationships • 
              Type: ${e.type}
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="section">
      <h2>Data Flow Layers</h2>
      ${(data.dataFlow?.layers || []).map((layer: any) => `
        <div class="entity-item">
          <div class="entity-name">${layer.name} (${layer.type})</div>
          <div class="entity-meta">${layer.components?.length || 0} components</div>
        </div>
      `).join('')}
    </div>

    <div class="section">
      <h2>Critical Paths</h2>
      ${(data.dataFlow?.criticalPaths || []).map((path: any) => `
        <div class="entity-item">
          <div class="entity-name">${path.name}</div>
          <div class="entity-meta">
            Risk: <span class="badge ${path.errorRisk}">${path.errorRisk}</span> • 
            Steps: ${path.steps?.join(' → ') || 'None'}
          </div>
        </div>
      `).join('')}
    </div>

    <div class="section">
      <h2>Validation Rules Summary</h2>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(
            (data.validationRules || []).reduce((acc: any, rule: any) => {
              acc[rule.type] = (acc[rule.type] || 0) + 1;
              return acc;
            }, {})
          ).map(([type, count]) => `
            <tr>
              <td>${type}</td>
              <td>${count}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    `;
  }
}

const dashboard = new Dashboard();
dashboard.start();