/**
 * Enhanced Overview Component
 * Complete architecture overview with all features from enhanced dashboard
 */

import { TableDetailView } from './table-detail-view';
import { QueryInspector } from './query-inspector';

export interface OverviewData {
  tables: any[];
  hooks: any[];
  components: any[];
  apis: any[];
  pages: any[];
  validation: {
    criticalCount: number;
    warningCount: number;
    infoCount: number;
  };
}

export class EnhancedOverview {
  static async fetchData(): Promise<OverviewData> {
    try {
      const [tablesRes, hooksRes, componentsRes, apisRes, pagesRes, validationRes] = await Promise.all([
        fetch('/api/table-mapping'),
        fetch('/api/architecture-data?type=hook'),
        fetch('/api/architecture-data?type=component'),
        fetch('/api/architecture-data?type=api'),
        fetch('/api/architecture-data?type=page'),
        fetch('/api/unified-report')
      ]);

      const [tables, hooks, components, apis, pages, validation] = await Promise.all([
        tablesRes.json(),
        hooksRes.json(),
        componentsRes.json(),
        apisRes.json(),
        pagesRes.json(),
        validationRes.json()
      ]) as [any, any[], any[], any[], any[], any];

      return {
        tables: Object.entries(tables.tables || {}).map(([name, data]: [string, any]) => ({
          name,
          ...data
        })),
        hooks: hooks || [],
        components: components || [],
        apis: apis || [],
        pages: pages || [],
        validation: validation?.summary || { criticalCount: 0, warningCount: 0, infoCount: 0 }
      };
    } catch (error) {
      console.error('Failed to fetch overview data:', error);
      return {
        tables: [],
        hooks: [],
        components: [],
        apis: [],
        pages: [],
        validation: { criticalCount: 0, warningCount: 0, infoCount: 0 }
      };
    }
  }

  static renderPage(): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI Observer - Enhanced Overview</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f0f0f;
            color: #e2e8f0;
            height: 100vh;
            overflow: hidden;
          }
          
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 16px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .header h1 {
            font-size: 24px;
            font-weight: 600;
            color: white;
          }
          
          .project-info {
            display: flex;
            gap: 20px;
            align-items: center;
            color: rgba(255,255,255,0.9);
            font-size: 14px;
          }
          
          .control-bar {
            background: #1a1a1a;
            border-bottom: 1px solid #333;
            padding: 12px 24px;
            display: flex;
            gap: 12px;
            align-items: center;
          }
          
          .btn {
            padding: 8px 16px;
            background: rgba(59, 130, 246, 0.1);
            border: 1px solid rgba(59, 130, 246, 0.3);
            color: #60a5fa;
            cursor: pointer;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 500;
            transition: all 0.2s;
          }
          
          .btn:hover {
            background: rgba(59, 130, 246, 0.2);
            transform: translateY(-1px);
          }
          
          .btn.primary {
            background: #3b82f6;
            border-color: #3b82f6;
            color: white;
          }
          
          .container {
            display: flex;
            height: calc(100vh - 120px);
          }
          
          .sidebar {
            width: 280px;
            background: #1a1a1a;
            border-right: 1px solid #333;
            overflow-y: auto;
            padding: 0;
          }
          
          .sidebar-section {
            border-bottom: 1px solid #333;
          }
          
          .sidebar-header {
            padding: 12px 16px;
            background: #252525;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 13px;
            font-weight: 500;
            color: #e2e8f0;
            transition: background 0.2s;
          }
          
          .sidebar-header:hover {
            background: #2a2a2a;
          }
          
          .sidebar-content {
            padding: 8px;
            display: none;
          }
          
          .sidebar-content.expanded {
            display: block;
          }
          
          .sidebar-item {
            padding: 8px 12px;
            background: #0f0f0f;
            border-radius: 6px;
            margin-bottom: 4px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 13px;
            transition: all 0.2s;
          }
          
          .sidebar-item:hover {
            background: #252525;
            transform: translateX(4px);
          }
          
          .sidebar-item.selected {
            background: #252525;
            border-left: 3px solid #3b82f6;
          }
          
          .health-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-left: 8px;
          }
          
          .health-good { background: #10b981; }
          .health-warning { background: #f59e0b; }
          .health-error { background: #ef4444; }
          
          .main-area {
            flex: 1;
            display: flex;
          }
          
          .content {
            flex: 1;
            overflow-y: auto;
            background: #0a0a0a;
          }
          
          .query-panel {
            width: 400px;
            background: #1a1a1a;
            border-left: 1px solid #333;
            overflow-y: auto;
          }
          
          .search-box {
            width: 100%;
            padding: 8px 12px;
            background: #0f0f0f;
            border: 1px solid #333;
            border-radius: 6px;
            color: #e2e8f0;
            font-size: 13px;
            margin-bottom: 12px;
          }
          
          .search-box:focus {
            outline: none;
            border-color: #3b82f6;
          }
          
          .validation-health {
            padding: 12px 16px;
            background: #0f0f0f;
            border-bottom: 1px solid #333;
          }
          
          .health-title {
            font-size: 12px;
            color: #64748b;
            margin-bottom: 8px;
            text-transform: uppercase;
          }
          
          .health-bars {
            display: flex;
            gap: 8px;
          }
          
          .health-bar {
            flex: 1;
            text-align: center;
            padding: 8px;
            background: #252525;
            border-radius: 4px;
          }
          
          .health-bar .count {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 4px;
          }
          
          .health-bar .label {
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
          }
          
          .tabs {
            display: flex;
            background: #1a1a1a;
            border-bottom: 1px solid #333;
            padding: 0 20px;
          }
          
          .tab {
            padding: 12px 16px;
            cursor: pointer;
            color: #94a3b8;
            font-size: 13px;
            border-bottom: 2px solid transparent;
            transition: all 0.2s;
          }
          
          .tab:hover {
            color: #f8fafc;
            background: #252525;
          }
          
          .tab.active {
            color: #f8fafc;
            border-bottom-color: #3b82f6;
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="header">
          <h1>🔍 AI Observer - Unified Control Center</h1>
          <div class="project-info">
            <span>Project: <strong id="projectName">Loading...</strong></span>
            <span>Framework: <strong id="framework">Next.js</strong></span>
            <span>Tables: <strong id="tableCount">0</strong></span>
          </div>
        </div>

        <!-- Control Bar -->
        <div class="control-bar">
          <button class="btn primary" onclick="runAll()">🚀 Run All</button>
          <button class="btn" onclick="exportReport()">📊 Export</button>
          <button class="btn" onclick="runContractTests()">✅ Test Contracts</button>
          <button class="btn" onclick="viewChanges()">📝 Changes</button>
          <span style="margin-left: auto; color: #64748b; font-size: 12px;">Last run: <span id="lastRun">Never</span></span>
        </div>

        <!-- Tabs -->
        <div class="tabs">
          <div class="tab active" onclick="switchTab('overview')">🏠 Overview</div>
          <div class="tab" onclick="switchTab('unified')">🎯 Unified</div>
          <div class="tab" onclick="switchTab('quality')">✅ Code Quality</div>
          <div class="tab" onclick="switchTab('contracts')">📋 Contracts</div>
          <div class="tab" onclick="switchTab('business')">🧠 Business Logic</div>
          <div class="tab" onclick="switchTab('design')">🎨 Design System</div>
          <div class="tab" onclick="switchTab('tests')">🧪 Tests</div>
          <div class="tab" onclick="switchTab('export')">📤 Export</div>
        </div>

        <!-- Main Container -->
        <div class="container">
          <!-- Sidebar -->
          <div class="sidebar">
            <!-- Search -->
            <div style="padding: 12px;">
              <input type="text" class="search-box" placeholder="Search tables..." onkeyup="filterSidebar(this.value)">
            </div>

            <!-- Tables Section -->
            <div class="sidebar-section">
              <div class="sidebar-header" onclick="toggleSection('tables')">
                <span>📊 TABLES (<span id="tablesCount">0</span>)</span>
                <span>▼</span>
              </div>
              <div id="tablesSection" class="sidebar-content expanded">
                <!-- Tables will be populated here -->
              </div>
            </div>

            <!-- Hooks Section -->
            <div class="sidebar-section">
              <div class="sidebar-header" onclick="toggleSection('hooks')">
                <span>🪝 HOOKS (<span id="hooksCount">0</span>)</span>
                <span>▼</span>
              </div>
              <div id="hooksSection" class="sidebar-content">
                <!-- Hooks will be populated here -->
              </div>
            </div>

            <!-- Components Section -->
            <div class="sidebar-section">
              <div class="sidebar-header" onclick="toggleSection('components')">
                <span>🧩 COMPONENTS (<span id="componentsCount">0</span>)</span>
                <span>▼</span>
              </div>
              <div id="componentsSection" class="sidebar-content">
                <!-- Components will be populated here -->
              </div>
            </div>

            <!-- APIs Section -->
            <div class="sidebar-section">
              <div class="sidebar-header" onclick="toggleSection('apis')">
                <span>🔌 API ROUTES (<span id="apisCount">0</span>)</span>
                <span>▼</span>
              </div>
              <div id="apisSection" class="sidebar-content">
                <!-- APIs will be populated here -->
              </div>
            </div>

            <!-- Pages Section -->
            <div class="sidebar-section">
              <div class="sidebar-header" onclick="toggleSection('pages')">
                <span>📄 PAGES (<span id="pagesCount">0</span>)</span>
                <span>▼</span>
              </div>
              <div id="pagesSection" class="sidebar-content">
                <!-- Pages will be populated here -->
              </div>
            </div>

            <!-- Validation Health -->
            <div class="validation-health">
              <div class="health-title">Validation Health</div>
              <div class="health-bars">
                <div class="health-bar">
                  <div class="count" style="color: #10b981;" id="checksScore">0%</div>
                  <div class="label">80-20 Checks</div>
                </div>
                <div class="health-bar">
                  <div class="count" style="color: #f59e0b;" id="registryScore">0%</div>
                  <div class="label">Registry Score</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Main Area -->
          <div class="main-area">
            <!-- Content -->
            <div class="content" id="mainContent">
              <!-- Dynamic content will be loaded here -->
            </div>

            <!-- Query Panel -->
            <div class="query-panel" id="queryPanel">
              <!-- Query inspector will be loaded here -->
            </div>
          </div>
        </div>

        <script type="module">
          // Import components
          import { TableDetailView } from './components/table-detail-view.js';
          import { QueryInspector } from './components/query-inspector.js';
          import { EnhancedOverview } from './components/enhanced-overview.js';

          let currentData = null;
          let selectedItem = null;

          // Initialize
          async function init() {
            currentData = await EnhancedOverview.fetchData();
            updateSidebar();
            loadOverview();
          }

          function updateSidebar() {
            // Update counts
            document.getElementById('tablesCount').textContent = currentData.tables.length;
            document.getElementById('hooksCount').textContent = currentData.hooks.length;
            document.getElementById('componentsCount').textContent = currentData.components.length;
            document.getElementById('apisCount').textContent = currentData.apis?.length || 0;
            document.getElementById('pagesCount').textContent = currentData.pages.length;
            document.getElementById('tableCount').textContent = currentData.tables.length;

            // Populate tables
            const tablesSection = document.getElementById('tablesSection');
            tablesSection.innerHTML = currentData.tables.map(table => {
              const healthClass = table.score >= 80 ? 'health-good' : 
                                 table.score >= 40 ? 'health-warning' : 'health-error';
              return \`
                <div class="sidebar-item" onclick="selectTable('\${table.name}')">
                  <span>\${table.name}</span>
                  <div style="display: flex; align-items: center;">
                    <span style="color: #64748b; font-size: 11px; margin-right: 8px;">\${table.score}%</span>
                    <span class="health-dot \${healthClass}"></span>
                  </div>
                </div>
              \`;
            }).join('');

            // Populate other sections similarly...
          }

          window.selectTable = function(tableName) {
            const table = currentData.tables.find(t => t.name === tableName);
            if (table) {
              document.getElementById('mainContent').innerHTML = TableDetailView.render(table);
              
              // Load query inspector for first hook
              if (table.hooks && table.hooks.length > 0) {
                const queryData = {
                  tableName: table.name,
                  hookName: table.hooks[0].hookName,
                  operation: 'findMany',
                  file: 'src/hooks/' + table.hooks[0].hookName + '.ts',
                  line: 28,
                  query: \`const { data, error, isLoading } = \${table.hooks[0].hookName}();\`,
                  hasValidation: true,
                  hasErrorHandling: table.hooks[0].hasErrorHandling || false,
                  dataFlow: {
                    type: true,
                    db: false,
                    hooks: table.hooks.length,
                    components: table.components
                  }
                };
                document.getElementById('queryPanel').innerHTML = QueryInspector.render(queryData);
              }
            }
          };

          function loadOverview() {
            const hasBreaking = currentData.validation.criticalCount > 0;
            document.getElementById('mainContent').innerHTML = \`
              <div style="padding: 20px;">
                <div style="
                  background: \${hasBreaking ? 'linear-gradient(135deg, #7f1d1d, #991b1b)' : '#1a1a1a'};
                  padding: 30px;
                  border-radius: 12px;
                  margin-bottom: 24px;
                  border: 2px solid \${hasBreaking ? '#ef4444' : '#333'};
                ">
                  <h1 style="color: #f8fafc; margin: 0; font-size: 32px;">
                    \${hasBreaking ? '🚨 Critical Issues Found!' : '✅ No Critical Issues'}
                  </h1>
                </div>
              </div>
            \`;
          }

          window.toggleSection = function(section) {
            const content = document.getElementById(section + 'Section');
            content.classList.toggle('expanded');
          };

          window.switchTab = function(tab) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            event.target.classList.add('active');
            // Load tab content...
          };

          // Start the app
          init();
        </script>
      </body>
      </html>
    `;
  }
}