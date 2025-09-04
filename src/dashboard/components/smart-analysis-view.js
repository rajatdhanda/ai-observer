// Smart Analysis View Component
class SmartAnalysisView {
  constructor(containerId) {
    this.containerId = containerId;
  }

  async render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    try {
      // Fetch the smart analysis data
      const response = await fetch('/api/smart-analysis');
      const data = await response.json();

      // Check if we need to add the layout wrapper
      // The container might already have the two-column layout from the parent
      const needsLayout = !container.querySelector('#smartAnalysisMain');
      
      if (needsLayout) {
        // Create two-column layout
        container.innerHTML = `
          <div style="display: flex; height: 100%; gap: 0;">
            <!-- Main Content (left) -->
            <div id="smartAnalysisMain" style="flex: 1; overflow-y: auto; min-width: 0; padding-right: 20px;">
              ${!data || !data.exists ? this.renderNoAnalysis() : this.renderAnalysis(data.analysis)}
            </div>
            
            <!-- Live Log Panel (right) -->
            <div id="liveLogPanel" style="width: 400px; flex-shrink: 0; height: 100%;">
              ${window.liveLogPanel ? window.liveLogPanel.renderPanel() : '<div>Loading logs...</div>'}
            </div>
          </div>
        `;
      } else {
        // Just update the main content
        const mainDiv = container.querySelector('#smartAnalysisMain');
        if (mainDiv) {
          mainDiv.innerHTML = !data || !data.exists ? this.renderNoAnalysis() : this.renderAnalysis(data.analysis);
        }
      }

      // Start log polling if panel exists
      if (window.liveLogPanel) {
        window.liveLogPanel.startPolling();
      }
    } catch (error) {
      console.error('Failed to load smart analysis:', error);
      container.innerHTML = this.renderError(error);
    }
  }

  renderNoAnalysis() {
    return `
      <div style="padding: 40px; text-align: center;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    width: 120px; height: 120px; border-radius: 50%; 
                    margin: 0 auto 24px; display: flex; align-items: center; 
                    justify-content: center; font-size: 48px;">
          🤖
        </div>
        <h2 style="color: #f8fafc; margin-bottom: 16px;">No Smart Analysis Yet</h2>
        <p style="color: #94a3b8; margin-bottom: 24px;">
          Run smart analysis to generate AI-friendly fix instructions
        </p>
        <button onclick="runSmartAnalysis()" style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; border: none; padding: 12px 24px;
          border-radius: 8px; cursor: pointer; font-size: 14px;
        ">
          Run Smart Analysis
        </button>
        <div style="margin-top: 24px; padding: 16px; background: #1a1a1a; 
                    border-radius: 8px; text-align: left;">
          <code style="color: #10b981; font-size: 12px;">
            npm run smart-analyze /path/to/project
          </code>
        </div>
      </div>
    `;
  }

  renderAnalysis(analysis) {
    const stats = analysis.stats || {};
    const groups = analysis.fix_groups || [];
    
    return `
      <div style="padding: 20px;">
        <!-- Live Status Bar -->
        <div style="background: #0a0a0a; border: 1px solid #333; border-radius: 8px; padding: 12px; margin-bottom: 20px; font-family: monospace;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span id="refreshStatus" style="color: #10b981; font-size: 11px;">🟢 Live</span>
              <span style="color: #64748b; font-size: 11px;">Smart refresh enabled</span>
            </div>
            <button onclick="window.smartRefreshManager?.forceRefresh()" style="
              background: #1e293b; color: #94a3b8; border: 1px solid #334155;
              padding: 4px 12px; border-radius: 4px; font-size: 11px;
              cursor: pointer; transition: all 0.2s;
            " onmouseover="this.style.background='#334155'" onmouseout="this.style.background='#1e293b'">
              🔄 Refresh Now
            </button>
          </div>
          <div style="color: #94a3b8; font-size: 12px;">
            [${new Date(analysis.generated).toLocaleTimeString()}] Checking... 
            ✅ Found ${stats.total_issues || stats.total_issues_found || 0} issues 
            (${groups.length} groups)
          </div>
          ${groups.map(g => `
            <div style="color: #64748b; font-size: 11px; margin-left: 20px;">
              └─ Group ${g.group}: ${g.fixes.length} ${g.title.toLowerCase()}
            </div>
          `).join('')}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <h2 style="color: #f8fafc; margin: 0;">
            🤖 Smart Analysis Results
          </h2>
          <div style="color: #94a3b8; font-size: 12px;">
            Last Check: ${new Date(analysis.generated).toLocaleString()}
          </div>
        </div>

        <!-- Summary Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); 
                      padding: 20px; border-radius: 12px;">
            <div style="font-size: 32px; font-weight: bold; color: white;">
              ${stats.critical_shown || groups.reduce((sum, g) => sum + g.fixes.length, 0) || 0}
            </div>
            <div style="color: rgba(255,255,255,0.9); font-size: 13px; margin-top: 4px;">
              Critical Issues to Fix
            </div>
          </div>
          
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); 
                      padding: 20px; border-radius: 12px;">
            <div style="font-size: 32px; font-weight: bold; color: white;">
              ${stats.groups_shown || groups.length || 0}
            </div>
            <div style="color: rgba(255,255,255,0.9); font-size: 13px; margin-top: 4px;">
              Fix Groups
            </div>
          </div>
          
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                      padding: 20px; border-radius: 12px;">
            <div style="font-size: 32px; font-weight: bold; color: white;">
              ${stats.total_issues_found || stats.total_issues || 0}
            </div>
            <div style="color: rgba(255,255,255,0.9); font-size: 13px; margin-top: 4px;">
              Total Issues Found
            </div>
          </div>
        </div>

        <!-- Instructions -->
        <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 12px; 
                    padding: 20px; margin-bottom: 24px;">
          <h3 style="color: #f8fafc; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
            📋 AI Instructions
            <span style="background: #10b981; color: white; padding: 2px 8px; 
                         border-radius: 4px; font-size: 11px; font-weight: normal;">
              ${analysis.README || 'Fix in order'}
            </span>
          </h3>
          <div style="color: #94a3b8; font-size: 13px; line-height: 1.8;">
            ${this.renderInstructions(analysis.instructions)}
          </div>
        </div>

        <!-- Fix Groups -->
        ${groups.map(group => this.renderGroup(group)).join('')}

        <!-- File Location -->
        <div style="margin-top: 32px; padding: 16px; background: #0f0f0f; 
                    border-radius: 8px; border: 1px solid #252525;">
          <div style="color: #64748b; font-size: 12px; margin-bottom: 8px;">
            📁 Fix instructions saved to:
          </div>
          <code style="color: #3b82f6; font-size: 12px; font-family: monospace;">
            ${analysis.project}/.observer/FIX_THIS.json
          </code>
        </div>
      </div>
    `;
  }

  renderInstructions(instructions) {
    if (!instructions) return 'No specific instructions';
    
    return Object.entries(instructions).map(([key, value]) => `
      <div style="margin-bottom: 8px;">
        <strong style="color: #f8fafc; text-transform: capitalize;">
          ${key.replace('step', 'Step ')}:
        </strong> 
        ${value}
      </div>
    `).join('');
  }

  renderGroup(group) {
    return `
      <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 12px; 
                  padding: 20px; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); 
                      width: 40px; height: 40px; border-radius: 50%; 
                      display: flex; align-items: center; justify-content: center; 
                      color: white; font-weight: bold;">
            ${group.group}
          </div>
          <div>
            <h3 style="color: #f8fafc; margin: 0;">${group.title}</h3>
            <div style="color: #94a3b8; font-size: 12px; margin-top: 4px;">
              ${group.why}
            </div>
          </div>
        </div>
        
        <div style="space-y: 8px;">
          ${group.fixes.map(fix => this.renderFix(fix)).join('')}
        </div>
      </div>
    `;
  }

  renderFix(fix) {
    return `
      <div style="background: #0f0f0f; padding: 12px; border-radius: 8px; 
                  margin-bottom: 8px; border-left: 3px solid #3b82f6;">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div style="flex: 1;">
            <div style="color: #ef4444; font-size: 13px; margin-bottom: 4px;">
              ❌ ${fix.issue}
            </div>
            <div style="color: #3b82f6; font-family: monospace; font-size: 11px; margin-bottom: 8px;">
              📁 ${fix.file}
            </div>
            <div style="background: #065f46; padding: 8px; border-radius: 4px; margin-top: 8px;">
              <code style="color: #10b981; font-size: 12px;">
                ✅ Fix: ${fix.fix}
              </code>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderError(error) {
    return `
      <div style="padding: 40px; text-align: center;">
        <div style="color: #ef4444; font-size: 48px; margin-bottom: 16px;">⚠️</div>
        <h3 style="color: #f8fafc;">Failed to Load Analysis</h3>
        <p style="color: #94a3b8; margin-top: 8px;">${error.message}</p>
      </div>
    `;
  }
}

// Global function to run analysis
window.runSmartAnalysis = async function() {
  const btn = event.target;
  btn.disabled = true;
  btn.textContent = 'Running...';
  
  try {
    const response = await fetch('/api/run-smart-analysis', { method: 'POST' });
    const result = await response.json();
    
    if (result.success) {
      // Reload the view
      const view = new SmartAnalysisView('mainContent');
      view.render();
    } else {
      alert('Analysis failed: ' + result.error);
    }
  } catch (error) {
    alert('Failed to run analysis: ' + error.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Run Smart Analysis';
  }
};

// Auto-refresh every 5 seconds if on Smart Analysis tab
window.autoRefreshInterval = null;

window.startAutoRefresh = function() {
  if (window.autoRefreshInterval) clearInterval(window.autoRefreshInterval);
  
  window.autoRefreshInterval = setInterval(() => {
    // Only refresh if on Smart Analysis tab
    const activeTab = document.querySelector('.tab.active');
    if (activeTab && activeTab.textContent.includes('Smart Analysis')) {
      const view = new SmartAnalysisView('mainContent');
      view.render();
    }
  }, 5000); // Refresh every 5 seconds
};

window.stopAutoRefresh = function() {
  if (window.autoRefreshInterval) {
    clearInterval(window.autoRefreshInterval);
    window.autoRefreshInterval = null;
  }
};

// Export for use
window.SmartAnalysisView = SmartAnalysisView;