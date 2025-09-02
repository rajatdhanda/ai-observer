/**
 * Simplified Data Flow View with working tabs
 */

export function renderDataFlowWithTabs(data: any): string {
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
  
  // Group nodes
  const nodesByType = {
    types: nodes.filter((n: any) => n.type === 'type'),
    tables: nodes.filter((n: any) => n.type === 'table'),
    hooks: nodes.filter((n: any) => n.type === 'hook'),
    components: nodes.filter((n: any) => n.type === 'component'),
    apis: nodes.filter((n: any) => n.type === 'api')
  };

  // Calculate metrics
  const criticalIssues = issues.filter((i: any) => i.severity === 'error').length;
  const warnings = issues.filter((i: any) => i.severity === 'warning').length;
  const orphaned = nodes.filter((n: any) => 
    !edges.some((e: any) => e.from === n.id || e.to === n.id)
  ).length;
  
  let healthScore = 100;
  healthScore -= criticalIssues * 15;
  healthScore -= warnings * 5;
  healthScore -= (orphaned / Math.max(nodes.length, 1)) * 20;
  healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));

  const healthGradient = healthScore >= 80 ? '#047857 0%, #065f46 100%' :
                         healthScore >= 60 ? '#b45309 0%, #92400e 100%' :
                         '#b91c1c 0%, #991b1b 100%';
  
  const healthLabel = healthScore >= 80 ? '✅ Excellent' :
                     healthScore >= 60 ? '⚠️ Good' :
                     healthScore >= 40 ? '🔶 Needs Work' :
                     '🚨 Critical';

  // Generate all tab content upfront
  const overviewContent = generateOverviewContent(nodesByType, edges, issues, healthScore, healthGradient, healthLabel, orphaned);
  const diagramContent = generateDiagramContent(nodes, edges);
  const issuesContent = generateIssuesContent(issues);
  const nodesContent = generateNodesContent(nodes);
  const testContent = generateTestContent();

  return `
    <div style="padding: 20px; background: #0a0a0a; min-height: calc(100vh - 200px);">
      <!-- Header -->
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
            <button onclick="exportFlowData()" style="padding: 8px 16px; background: #1e40af; border: none; border-radius: 6px; color: white; cursor: pointer; font-size: 13px;">
              📥 Export
            </button>
            <button onclick="location.reload()" style="padding: 8px 16px; background: #059669; border: none; border-radius: 6px; color: white; cursor: pointer; font-size: 13px;">
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div style="display: flex; gap: 2px; background: #1a1a1a; padding: 4px; border-radius: 8px; margin-bottom: 25px;">
        <button onclick="switchDataFlowTab('overview', this)" class="dftab dftab-active" style="flex: 1; padding: 12px; background: #2563eb; border: none; border-radius: 6px; color: white; cursor: pointer; font-weight: 500;">
          📊 Overview
        </button>
        <button onclick="switchDataFlowTab('diagram', this)" class="dftab" style="flex: 1; padding: 12px; background: transparent; border: none; border-radius: 6px; color: #94a3b8; cursor: pointer; font-weight: 500;">
          🔀 Flow Diagram
        </button>
        <button onclick="switchDataFlowTab('issues', this)" class="dftab" style="flex: 1; padding: 12px; background: transparent; border: none; border-radius: 6px; color: #94a3b8; cursor: pointer; font-weight: 500; position: relative;">
          ⚠️ Issues
          ${criticalIssues > 0 ? `<span style="position: absolute; top: 5px; right: 10px; background: #ef4444; color: white; border-radius: 10px; padding: 2px 6px; font-size: 10px;">${criticalIssues}</span>` : ''}
        </button>
        <button onclick="switchDataFlowTab('nodes', this)" class="dftab" style="flex: 1; padding: 12px; background: transparent; border: none; border-radius: 6px; color: #94a3b8; cursor: pointer; font-weight: 500;">
          📦 Nodes (${nodes.length})
        </button>
        <button onclick="switchDataFlowTab('test', this)" class="dftab" style="flex: 1; padding: 12px; background: transparent; border: none; border-radius: 6px; color: #94a3b8; cursor: pointer; font-weight: 500;">
          🧪 Test Flow
        </button>
      </div>

      <!-- Tab Contents (all pre-rendered) -->
      <div id="dftab-overview" class="dftab-content" style="display: block;">
        ${overviewContent}
      </div>
      
      <div id="dftab-diagram" class="dftab-content" style="display: none;">
        ${diagramContent}
      </div>
      
      <div id="dftab-issues" class="dftab-content" style="display: none;">
        ${issuesContent}
      </div>
      
      <div id="dftab-nodes" class="dftab-content" style="display: none;">
        ${nodesContent}
      </div>
      
      <div id="dftab-test" class="dftab-content" style="display: none;">
        ${testContent}
      </div>
    </div>

    <script>
      // Store data globally for export (functions are defined in enhanced.html)
      window.dataFlowData = ${JSON.stringify(data)};
    </script>
  `;
}

function generateOverviewContent(nodesByType: any, edges: any[], issues: any[], healthScore: number, healthGradient: string, healthLabel: string, orphaned: number): string {
  const critical = issues.filter((i: any) => i.severity === 'error');
  const warnings = issues.filter((i: any) => i.severity === 'warning');
  
  return `
    <!-- Health Score Card -->
    <div style="background: linear-gradient(135deg, ${healthGradient}); padding: 30px; border-radius: 12px; margin-bottom: 25px; position: relative; overflow: hidden;">
      <div style="position: absolute; top: 0; right: 0; width: 200px; height: 200px; background: rgba(255,255,255,0.1); border-radius: 50%; transform: translate(50%, -50%);"></div>
      <div style="position: relative; z-index: 1;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="font-size: 20px; margin-bottom: 10px; opacity: 0.9;">Overall Health Score</h3>
            <div style="display: flex; align-items: baseline; gap: 15px;">
              <span style="font-size: 48px; font-weight: bold;">${healthScore}%</span>
              <span style="font-size: 18px; opacity: 0.8;">${healthLabel}</span>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
              <div>
                <div style="font-size: 28px; font-weight: bold;">${edges.length}</div>
                <div style="opacity: 0.8; font-size: 13px;">Connections</div>
              </div>
              <div>
                <div style="font-size: 28px; font-weight: bold;">${orphaned}</div>
                <div style="opacity: 0.8; font-size: 13px;">Orphaned</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Layer Cards -->
    <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin-bottom: 25px;">
      ${renderLayerCard('Types', nodesByType.types.length, '#3b82f6')}
      ${renderLayerCard('Tables', nodesByType.tables.length, '#8b5cf6')}
      ${renderLayerCard('Hooks', nodesByType.hooks.length, '#06b6d4')}
      ${renderLayerCard('Components', nodesByType.components.length, '#10b981')}
      ${renderLayerCard('APIs', nodesByType.apis.length, '#f59e0b')}
    </div>

    <!-- Pipeline -->
    <div style="background: #1a1a1a; padding: 25px; border-radius: 12px; margin-bottom: 25px;">
      <h3 style="margin-bottom: 20px; color: #e2e8f0;">🔄 Data Flow Pipeline</h3>
      <div style="display: flex; align-items: center; gap: 20px; padding: 20px; background: #0f0f0f; border-radius: 8px;">
        ${renderPipelineStage('Types', nodesByType.types.length, '#3b82f6', '📝')}
        ${renderArrow(nodesByType.types.length > 0)}
        ${renderPipelineStage('Database', nodesByType.tables.length, '#8b5cf6', '🗄️')}
        ${renderArrow(nodesByType.tables.length > 0)}
        ${renderPipelineStage('Hooks', nodesByType.hooks.length, '#06b6d4', '🪝')}
        ${renderArrow(nodesByType.hooks.length > 0)}
        ${renderPipelineStage('Components', nodesByType.components.length, '#10b981', '🧩')}
        ${renderArrow(nodesByType.apis.length > 0)}
        ${renderPipelineStage('APIs', nodesByType.apis.length, '#f59e0b', '🔌')}
      </div>
    </div>

    ${warnings.length > 0 ? `
      <div style="background: rgba(245, 158, 11, 0.1); padding: 20px; border-radius: 12px; border: 1px solid rgba(245, 158, 11, 0.3);">
        <h3 style="color: #fcd34d; margin-bottom: 15px;">⚠️ Warnings (${warnings.length})</h3>
        ${warnings.slice(0, 3).map((issue: any) => `
          <div style="background: rgba(0, 0, 0, 0.3); padding: 15px; border-radius: 8px; margin-bottom: 10px;">
            <div style="color: #fbbf24; font-weight: 500;">${issue.message}</div>
            <div style="color: #fcd34d; font-size: 13px; margin-top: 5px;">
              ${issue.node || 'Unknown location'}
            </div>
          </div>
        `).join('')}
      </div>
    ` : ''}
  `;
}

function generateDiagramContent(nodes: any[], edges: any[]): string {
  return `
    <div style="background: #1a1a1a; padding: 30px; border-radius: 12px;">
      <h3 style="color: #e2e8f0; margin-bottom: 20px;">Interactive Flow Diagram</h3>
      <div style="background: #0f0f0f; padding: 20px; border-radius: 8px; min-height: 500px;">
        <p style="color: #64748b;">Flow diagram visualization</p>
        <div style="margin-top: 20px;">
          <p style="color: #94a3b8;">Nodes: ${nodes.length}</p>
          <p style="color: #94a3b8;">Edges: ${edges.length}</p>
        </div>
      </div>
    </div>
  `;
}

function generateIssuesContent(issues: any[]): string {
  const critical = issues.filter((i: any) => i.severity === 'error');
  const warnings = issues.filter((i: any) => i.severity === 'warning');
  
  return `
    <div style="padding: 20px;">
      <div style="display: flex; gap: 20px; margin-bottom: 20px;">
        <div style="background: #1a1a1a; padding: 15px; border-radius: 8px; flex: 1;">
          <div style="color: #ef4444; font-size: 32px; font-weight: bold;">${critical.length}</div>
          <div style="color: #94a3b8; font-size: 14px;">Critical Issues</div>
        </div>
        <div style="background: #1a1a1a; padding: 15px; border-radius: 8px; flex: 1;">
          <div style="color: #f59e0b; font-size: 32px; font-weight: bold;">${warnings.length}</div>
          <div style="color: #94a3b8; font-size: 14px;">Warnings</div>
        </div>
      </div>
      
      ${warnings.length > 0 ? `
        <div style="background: #1a1a1a; padding: 20px; border-radius: 8px;">
          <h3 style="color: #f59e0b; margin-bottom: 15px;">⚠️ Warnings</h3>
          ${warnings.map((issue: any) => `
            <div style="background: #0f0f0f; padding: 15px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid #f59e0b;">
              <div style="color: #fbbf24; font-weight: 500;">${issue.message}</div>
              <div style="color: #94a3b8; font-size: 13px; margin-top: 5px;">
                📍 ${issue.node || 'Unknown'}
              </div>
              ${issue.suggestion ? `
                <div style="color: #60a5fa; font-size: 13px; margin-top: 10px;">
                  💡 ${issue.suggestion}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      ` : '<p style="color: #10b981;">✅ No issues found!</p>'}
    </div>
  `;
}

function generateNodesContent(nodes: any[]): string {
  const nodesByType: any = {};
  nodes.forEach(node => {
    if (!nodesByType[node.type]) nodesByType[node.type] = [];
    nodesByType[node.type].push(node);
  });
  
  return `
    <div style="padding: 20px;">
      <input type="text" placeholder="Search nodes..." onkeyup="filterDataNodes(this.value)"
             style="width: 100%; padding: 12px; background: #1a1a1a; border: 1px solid #333; border-radius: 8px; color: white; margin-bottom: 20px;">
      
      ${Object.entries(nodesByType).map(([type, typeNodes]: any) => `
        <div style="margin-bottom: 30px;">
          <h3 style="color: #e2e8f0; margin-bottom: 15px;">${type}s (${typeNodes.length})</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;">
            ${typeNodes.map((node: any) => `
              <div class="df-node-card" data-node-name="${node.name.toLowerCase()}"
                   style="background: #1a1a1a; padding: 15px; border-radius: 8px; border: 1px solid #333;">
                <div style="color: ${getNodeColor(node.type)}; font-weight: 500;">${node.name}</div>
                <div style="color: #64748b; font-size: 12px; margin-top: 5px;">
                  ${node.file ? node.file.split('/').pop() : 'Unknown'}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function generateTestContent(): string {
  return `
    <div style="padding: 20px;">
      <div style="background: #1a1a1a; padding: 30px; border-radius: 12px;">
        <h3 style="color: #e2e8f0; margin-bottom: 20px;">🧪 Test Data Flow</h3>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
          <div>
            <h4 style="color: #94a3b8; margin-bottom: 15px;">Request</h4>
            <div style="background: #0f0f0f; padding: 20px; border-radius: 8px;">
              <button onclick="testDataFlow()" style="width: 100%; padding: 10px; background: #2563eb; border: none; border-radius: 6px; color: white; cursor: pointer;">
                ▶️ Test Flow
              </button>
            </div>
          </div>
          
          <div>
            <h4 style="color: #94a3b8; margin-bottom: 15px;">Response</h4>
            <div id="df-test-results" style="background: #0f0f0f; padding: 20px; border-radius: 8px; min-height: 100px;">
              <p style="color: #64748b;">Run test to see results</p>
            </div>
          </div>
        </div>
        
        <div style="margin-top: 30px;">
          <h4 style="color: #94a3b8; margin-bottom: 15px;">Flow Trace</h4>
          <div id="df-flow-trace" style="background: #0f0f0f; padding: 20px; border-radius: 8px;">
            <p style="color: #64748b;">Trace will appear here</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderLayerCard(title: string, count: number, color: string): string {
  return `
    <div style="background: #0f0f0f; padding: 20px; border-radius: 10px; border: 1px solid #262626; position: relative;">
      <div style="position: absolute; top: 0; left: 0; width: 100%; height: 3px; background: ${color};"></div>
      <div style="color: #94a3b8; font-size: 12px; margin-bottom: 8px;">${title}</div>
      <div style="display: flex; align-items: baseline; gap: 5px;">
        <span style="font-size: 32px; font-weight: bold; color: ${color};">${count}</span>
        <span style="color: #64748b; font-size: 14px;">items</span>
      </div>
    </div>
  `;
}

function renderPipelineStage(name: string, count: number, color: string, icon: string): string {
  return `
    <div style="text-align: center; opacity: ${count > 0 ? '1' : '0.4'};">
      <div style="padding: 20px; background: ${count > 0 ? color : '#333'}; border-radius: 10px; min-width: 120px;">
        <div style="font-size: 24px;">${icon}</div>
        <div style="font-weight: 500;">${name}</div>
        <div style="font-size: 20px; font-weight: bold;">${count}</div>
      </div>
    </div>
  `;
}

function renderArrow(active: boolean): string {
  return `<div style="color: ${active ? '#10b981' : '#4b5563'}; font-size: 24px;">→</div>`;
}

function getNodeColor(type: string): string {
  const colors: any = {
    type: '#3b82f6',
    table: '#8b5cf6',
    hook: '#06b6d4',
    component: '#10b981',
    api: '#f59e0b'
  };
  return colors[type] || '#64748b';
}