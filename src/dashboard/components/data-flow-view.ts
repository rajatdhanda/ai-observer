/**
 * Enhanced Data Flow View Component with Postman-level UI
 */

export function renderDataFlowView(data: any): string {
  if (!data) {
    return `
      <div style="padding: 40px; text-align: center;">
        <div style="background: #1a1a1a; padding: 40px; border-radius: 12px; border: 2px dashed #333;">
          <h3 style="color: #64748b; margin-bottom: 20px;">⏳ No Data Flow Analysis Available</h3>
          <p style="color: #475569;">Run data flow analysis to see the complete flow diagram</p>
          <button onclick="runDataFlowAnalysis()" style="margin-top: 20px; padding: 10px 20px; background: linear-gradient(135deg, #667eea, #764ba2); border: none; border-radius: 6px; color: white; cursor: pointer;">
            🔄 Run Analysis Now
          </button>
        </div>
      </div>
    `;
  }

  const nodes = data.nodes || [];
  const edges = data.edges || [];
  const issues = data.issues || [];
  
  // Group nodes by type
  const types = nodes.filter((n: any) => n.type === 'type');
  const tables = nodes.filter((n: any) => n.type === 'table');
  const hooks = nodes.filter((n: any) => n.type === 'hook');
  const components = nodes.filter((n: any) => n.type === 'component');
  const apis = nodes.filter((n: any) => n.type === 'api');

  // Calculate health metrics
  const criticalIssues = issues.filter((i: any) => i.severity === 'error');
  const warnings = issues.filter((i: any) => i.severity === 'warning');
  const totalConnections = edges.length;
  const orphanedNodes = nodes.filter((n: any) => 
    !edges.some((e: any) => e.from === n.id || e.to === n.id)
  );

  // Flow analysis
  const flowPaths = analyzeFlowPaths(nodes, edges);
  const bottlenecks = findBottlenecks(nodes, edges);

  return `
    <div style="padding: 20px; background: #0a0a0a; min-height: calc(100vh - 200px);">
      <!-- Enhanced Header with Postman-style tabs -->
      <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 25px; border-radius: 12px; margin-bottom: 25px; border: 1px solid #334155;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h2 style="font-size: 28px; margin-bottom: 10px; color: #f1f5f9;">
              🔄 Data Flow Analysis
            </h2>
            <p style="color: #94a3b8; font-size: 14px;">
              Complete data flow visualization from Types → Database → Hooks → Components → APIs
            </p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button onclick="exportFlowDiagram()" style="padding: 8px 16px; background: #1e40af; border: none; border-radius: 6px; color: white; cursor: pointer; font-size: 13px;">
              📥 Export
            </button>
            <button onclick="refreshDataFlow()" style="padding: 8px 16px; background: #059669; border: none; border-radius: 6px; color: white; cursor: pointer; font-size: 13px;">
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      <!-- Postman-style Navigation Tabs -->
      <div style="display: flex; gap: 2px; background: #1a1a1a; padding: 4px; border-radius: 8px; margin-bottom: 25px;">
        <button onclick="showFlowTab('overview')" class="flow-tab active" style="flex: 1; padding: 12px; background: #2563eb; border: none; border-radius: 6px; color: white; cursor: pointer; font-weight: 500;">
          📊 Overview
        </button>
        <button onclick="showFlowTab('diagram')" class="flow-tab" style="flex: 1; padding: 12px; background: transparent; border: none; border-radius: 6px; color: #94a3b8; cursor: pointer; font-weight: 500;">
          🔀 Flow Diagram
        </button>
        <button onclick="showFlowTab('issues')" class="flow-tab" style="flex: 1; padding: 12px; background: transparent; border: none; border-radius: 6px; color: #94a3b8; cursor: pointer; font-weight: 500; position: relative;">
          ⚠️ Issues
          ${criticalIssues.length > 0 ? `<span style="position: absolute; top: 5px; right: 10px; background: #ef4444; color: white; border-radius: 10px; padding: 2px 6px; font-size: 10px;">${criticalIssues.length}</span>` : ''}
        </button>
        <button onclick="showFlowTab('nodes')" class="flow-tab" style="flex: 1; padding: 12px; background: transparent; border: none; border-radius: 6px; color: #94a3b8; cursor: pointer; font-weight: 500;">
          📦 Nodes (${nodes.length})
        </button>
        <button onclick="showFlowTab('test')" class="flow-tab" style="flex: 1; padding: 12px; background: transparent; border: none; border-radius: 6px; color: #94a3b8; cursor: pointer; font-weight: 500;">
          🧪 Test Flow
        </button>
      </div>

      <!-- Tab Content -->
      <div id="flow-tab-content">
        <!-- Overview Tab (Default) -->
        <div id="overview-content">
          <!-- Health Score Card -->
          <div style="background: linear-gradient(135deg, ${getHealthGradient(nodes, issues)}); padding: 30px; border-radius: 12px; margin-bottom: 25px; position: relative; overflow: hidden;">
            <div style="position: absolute; top: 0; right: 0; width: 200px; height: 200px; background: rgba(255,255,255,0.1); border-radius: 50%; transform: translate(50%, -50%);"></div>
            <div style="position: relative; z-index: 1;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <h3 style="font-size: 20px; margin-bottom: 10px; opacity: 0.9;">Overall Health Score</h3>
                  <div style="display: flex; align-items: baseline; gap: 15px;">
                    <span style="font-size: 48px; font-weight: bold;">
                      ${calculateHealthScore(nodes, edges, issues)}%
                    </span>
                    <span style="font-size: 18px; opacity: 0.8;">
                      ${getHealthLabel(calculateHealthScore(nodes, edges, issues))}
                    </span>
                  </div>
                </div>
                <div style="text-align: right;">
                  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
                    <div>
                      <div style="font-size: 28px; font-weight: bold;">${totalConnections}</div>
                      <div style="opacity: 0.8; font-size: 13px;">Connections</div>
                    </div>
                    <div>
                      <div style="font-size: 28px; font-weight: bold;">${orphanedNodes.length}</div>
                      <div style="opacity: 0.8; font-size: 13px;">Orphaned</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Layer Distribution -->
          <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin-bottom: 25px;">
            ${renderLayerCard('Types', types.length, '#3b82f6', 'type-layer')}
            ${renderLayerCard('Tables', tables.length, '#8b5cf6', 'table-layer')}
            ${renderLayerCard('Hooks', hooks.length, '#06b6d4', 'hook-layer')}
            ${renderLayerCard('Components', components.length, '#10b981', 'component-layer')}
            ${renderLayerCard('APIs', apis.length, '#f59e0b', 'api-layer')}
          </div>

          <!-- Flow Pipeline Visualization -->
          <div style="background: #1a1a1a; padding: 25px; border-radius: 12px; margin-bottom: 25px; border: 1px solid #262626;">
            <h3 style="margin-bottom: 20px; color: #e2e8f0; font-size: 18px;">🔄 Data Flow Pipeline</h3>
            <div style="overflow-x: auto;">
              <div style="display: flex; align-items: center; gap: 20px; padding: 20px; background: #0f0f0f; border-radius: 8px; min-width: fit-content;">
                ${renderPipelineStage('Types', types.length, '#3b82f6', types.length > 0)}
                ${renderPipelineArrow(types.length > 0 && tables.length > 0)}
                ${renderPipelineStage('Database', tables.length, '#8b5cf6', tables.length > 0)}
                ${renderPipelineArrow(tables.length > 0 && hooks.length > 0)}
                ${renderPipelineStage('Hooks', hooks.length, '#06b6d4', hooks.length > 0)}
                ${renderPipelineArrow(hooks.length > 0 && components.length > 0)}
                ${renderPipelineStage('Components', components.length, '#10b981', components.length > 0)}
                ${renderPipelineArrow(components.length > 0 && apis.length > 0)}
                ${renderPipelineStage('APIs', apis.length, '#f59e0b', apis.length > 0)}
              </div>
            </div>
          </div>

          <!-- Critical Issues -->
          ${criticalIssues.length > 0 ? `
            <div style="background: rgba(239, 68, 68, 0.1); padding: 20px; border-radius: 12px; border: 1px solid rgba(239, 68, 68, 0.3); margin-bottom: 25px;">
              <h3 style="color: #fca5a5; margin-bottom: 15px; font-size: 18px;">
                🚨 Critical Issues (${criticalIssues.length})
              </h3>
              <div style="space-y: 10px;">
                ${criticalIssues.slice(0, 3).map((issue: any) => `
                  <div style="background: rgba(0, 0, 0, 0.3); padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                      <div style="flex: 1;">
                        <div style="color: #f87171; font-weight: 500; margin-bottom: 5px;">
                          ${issue.message}
                        </div>
                        <div style="color: #fca5a5; font-size: 13px; opacity: 0.8;">
                          ${issue.node || 'Unknown location'}
                        </div>
                      </div>
                      <button onclick="fixIssue('${issue.id}')" style="padding: 6px 12px; background: #7c2d12; border: none; border-radius: 4px; color: #fca5a5; cursor: pointer; font-size: 12px;">
                        Fix →
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Bottlenecks -->
          ${bottlenecks.length > 0 ? `
            <div style="background: rgba(245, 158, 11, 0.1); padding: 20px; border-radius: 12px; border: 1px solid rgba(245, 158, 11, 0.3);">
              <h3 style="color: #fcd34d; margin-bottom: 15px; font-size: 18px;">
                🔶 Performance Bottlenecks
              </h3>
              ${bottlenecks.map((b: any) => `
                <div style="background: rgba(0, 0, 0, 0.3); padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                  <div style="color: #fbbf24; font-weight: 500;">${b.node}</div>
                  <div style="color: #fcd34d; font-size: 13px; margin-top: 5px;">
                    ${b.connections} connections · ${b.reason}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Hidden JavaScript for interactivity -->
      <script>
        function showFlowTab(tab) {
          // Update tab styles
          document.querySelectorAll('.flow-tab').forEach(t => {
            t.style.background = 'transparent';
            t.style.color = '#94a3b8';
          });
          event.target.style.background = '#2563eb';
          event.target.style.color = 'white';
          
          // Load tab content
          const content = document.getElementById('flow-tab-content');
          switch(tab) {
            case 'diagram':
              loadFlowDiagram();
              break;
            case 'issues':
              loadIssuesView();
              break;
            case 'nodes':
              loadNodesView();
              break;
            case 'test':
              loadTestView();
              break;
            default:
              // Overview is already loaded
          }
        }

        function loadFlowDiagram() {
          const content = document.getElementById('flow-tab-content');
          content.innerHTML = '<div style="padding: 20px; text-align: center;">Loading interactive diagram...</div>';
          // Would load actual diagram here
        }

        function fixIssue(issueId) {
          console.log('Fixing issue:', issueId);
          // Would open fix dialog
        }

        async function runDataFlowAnalysis() {
          const res = await fetch('/api/data-flow');
          const data = await res.json();
          // Refresh view
          location.reload();
        }
      </script>
    </div>
  `;
}

// Helper functions
function getHealthGradient(nodes: any[], issues: any[]): string {
  const score = calculateHealthScore(nodes, [], issues);
  if (score >= 80) return '#047857 0%, #065f46 100%';
  if (score >= 60) return '#b45309 0%, #92400e 100%';
  return '#b91c1c 0%, #991b1b 100%';
}

function calculateHealthScore(nodes: any[], edges: any[], issues: any[]): number {
  if (nodes.length === 0) return 0;
  
  const criticalIssues = issues.filter((i: any) => i.severity === 'error').length;
  const warnings = issues.filter((i: any) => i.severity === 'warning').length;
  
  let score = 100;
  score -= criticalIssues * 15;
  score -= warnings * 5;
  
  // Penalty for orphaned nodes
  const orphaned = nodes.filter((n: any) => 
    !edges.some((e: any) => e.from === n.id || e.to === n.id)
  ).length;
  score -= (orphaned / nodes.length) * 20;
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

function getHealthLabel(score: number): string {
  if (score >= 80) return '✅ Excellent';
  if (score >= 60) return '⚠️ Good';
  if (score >= 40) return '🔶 Needs Work';
  return '🚨 Critical';
}

function renderLayerCard(title: string, count: number, color: string, id: string): string {
  return `
    <div id="${id}" onclick="filterByLayer('${title.toLowerCase()}')" style="background: #0f0f0f; padding: 20px; border-radius: 10px; border: 1px solid #262626; cursor: pointer; transition: all 0.2s; position: relative; overflow: hidden;">
      <div style="position: absolute; top: 0; left: 0; width: 100%; height: 3px; background: ${color};"></div>
      <div style="color: #94a3b8; font-size: 12px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">
        ${title}
      </div>
      <div style="display: flex; align-items: baseline; gap: 5px;">
        <span style="font-size: 32px; font-weight: bold; color: ${color};">
          ${count}
        </span>
        <span style="color: #64748b; font-size: 14px;">items</span>
      </div>
      ${count === 0 ? `
        <div style="position: absolute; bottom: 5px; right: 5px; color: #ef4444; font-size: 10px;">
          ⚠️ Missing
        </div>
      ` : ''}
    </div>
  `;
}

function renderPipelineStage(name: string, count: number, color: string, active: boolean): string {
  return `
    <div style="text-align: center; opacity: ${active ? '1' : '0.4'};">
      <div style="padding: 20px; background: ${active ? color : '#333'}; border-radius: 10px; min-width: 120px; position: relative;">
        <div style="font-size: 24px; margin-bottom: 5px;">
          ${getPipelineIcon(name)}
        </div>
        <div style="font-weight: 500; margin-bottom: 5px;">${name}</div>
        <div style="font-size: 20px; font-weight: bold;">${count}</div>
        ${!active ? `
          <div style="position: absolute; top: 5px; right: 5px; color: #ef4444; font-size: 16px;">
            ⚠️
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function renderPipelineArrow(active: boolean): string {
  return `
    <div style="color: ${active ? '#10b981' : '#4b5563'}; font-size: 24px;">
      →
    </div>
  `;
}

function getPipelineIcon(stage: string): string {
  const icons: any = {
    'Types': '📝',
    'Database': '🗄️',
    'Hooks': '🪝',
    'Components': '🧩',
    'APIs': '🔌'
  };
  return icons[stage] || '📦';
}

function analyzeFlowPaths(nodes: any[], edges: any[]): any[] {
  // Analyze complete paths through the system
  const paths: any[] = [];
  // Implementation would trace paths from types to APIs
  return paths;
}

function findBottlenecks(nodes: any[], edges: any[]): any[] {
  // Find nodes with too many connections
  const bottlenecks: any[] = [];
  nodes.forEach(node => {
    const connections = edges.filter((e: any) => e.from === node.id || e.to === node.id).length;
    if (connections > 5) {
      bottlenecks.push({
        node: node.name,
        connections,
        reason: connections > 10 ? 'Too many dependencies' : 'High coupling'
      });
    }
  });
  return bottlenecks;
}