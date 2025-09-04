/**
 * File Analysis View
 * Shows file-level metrics for finding problematic files quickly
 * 80% impact with 20% effort - find large, complex, disconnected files
 */

window.loadFileAnalysisView = async function() {
  const mainContent = document.getElementById('mainContent');
  mainContent.innerHTML = `
    <div style="padding: 20px;">
      <div style="text-align: center; color: #9ca3af; margin: 40px 0;">
        <div style="font-size: 20px; margin-bottom: 16px;">⟳</div>
        <div>Analyzing file metrics...</div>
      </div>
    </div>
  `;
  
  try {
    // Fetch map data
    const response = await fetch('/api/map-validation');
    if (!response.ok) throw new Error('Failed to fetch map data');
    
    const mapData = await response.json();
    
    // Process file metrics
    const fileAnalysis = analyzeFiles(mapData);
    
    mainContent.innerHTML = `
      <div style="padding: 20px;">
        <div style="
          background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%);
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 24px;
          color: white;
        ">
          <h1 style="margin: 0 0 8px 0; display: flex; align-items: center; gap: 12px;">
            📊 File Analysis
          </h1>
          <p style="margin: 0; opacity: 0.9; font-size: 14px;">
            Find large, complex, and disconnected files - 80/20 rule
          </p>
        </div>
        
        ${renderFileSummary(fileAnalysis)}
        ${renderLargestFiles(fileAnalysis)}
        ${renderMostComplexFiles(fileAnalysis)}
        ${renderDisconnectedFiles(fileAnalysis)}
        ${renderFileConnections(fileAnalysis)}
      </div>
    `;
  } catch (error) {
    console.error('Error loading file analysis:', error);
    mainContent.innerHTML = `
      <div style="padding: 20px;">
        <div style="text-align: center; color: #ef4444; margin: 40px 0;">
          <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
          <h2>Error Loading File Analysis</h2>
          <p style="color: #64748b;">Failed to load file data: ${error.message}</p>
        </div>
      </div>
    `;
  }
};

function analyzeFiles(mapData) {
  const files = [];
  
  // Process each file in the map
  for (const [path, data] of Object.entries(mapData.files || {})) {
    const metrics = data.metrics || {};
    const exports = mapData.exports[path] || [];
    const imports = mapData.imports[path] || [];
    
    files.push({
      path,
      name: path.split('/').pop(),
      loc: metrics.loc || 0,
      functions: metrics.functions || 0,
      exports: exports.length,
      imports: imports.length,
      complexity: metrics.complexity || 0,
      hasValidation: data.hasParse || 0,
      hasErrorHandling: data.hasTryCatch || 0,
      hasAuth: data.hasAuth || 0
    });
  }
  
  // Sort for different views
  const bySize = [...files].sort((a, b) => b.loc - a.loc);
  const byComplexity = [...files].sort((a, b) => b.complexity - a.complexity);
  const byExports = [...files].sort((a, b) => b.exports - a.exports);
  const noExports = files.filter(f => f.exports === 0 && !f.path.includes('page.tsx') && !f.path.includes('route.ts'));
  const noImports = files.filter(f => f.imports === 0);
  
  return {
    total: files.length,
    totalLoc: files.reduce((sum, f) => sum + f.loc, 0),
    avgLoc: Math.round(files.reduce((sum, f) => sum + f.loc, 0) / files.length),
    bySize,
    byComplexity,
    byExports,
    noExports,
    noImports,
    files
  };
}

function renderFileSummary(analysis) {
  const largeFiles = analysis.files.filter(f => f.loc > 500).length;
  const complexFiles = analysis.files.filter(f => f.complexity > 20).length;
  const disconnected = analysis.noExports.length;
  
  return `
    <div style="
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    ">
      <h2 style="color: #f8fafc; margin: 0 0 20px 0;">📈 Overview</h2>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
        <div style="background: #0f0f0f; padding: 20px; border-radius: 8px; text-align: center;">
          <div style="color: #3b82f6; font-size: 28px; font-weight: bold; margin-bottom: 8px;">
            ${analysis.total}
          </div>
          <div style="color: #64748b; font-size: 12px;">Total Files</div>
        </div>
        
        <div style="background: #0f0f0f; padding: 20px; border-radius: 8px; text-align: center;">
          <div style="color: ${largeFiles > 5 ? '#ef4444' : '#10b981'}; font-size: 28px; font-weight: bold; margin-bottom: 8px;">
            ${largeFiles}
          </div>
          <div style="color: #64748b; font-size: 12px;">Large Files (>500 LOC)</div>
        </div>
        
        <div style="background: #0f0f0f; padding: 20px; border-radius: 8px; text-align: center;">
          <div style="color: ${complexFiles > 10 ? '#ef4444' : '#f59e0b'}; font-size: 28px; font-weight: bold; margin-bottom: 8px;">
            ${complexFiles}
          </div>
          <div style="color: #64748b; font-size: 12px;">Complex Files (>20)</div>
        </div>
        
        <div style="background: #0f0f0f; padding: 20px; border-radius: 8px; text-align: center;">
          <div style="color: ${disconnected > 10 ? '#ef4444' : '#f59e0b'}; font-size: 28px; font-weight: bold; margin-bottom: 8px;">
            ${disconnected}
          </div>
          <div style="color: #64748b; font-size: 12px;">No Exports</div>
        </div>
      </div>
    </div>
  `;
}

function renderLargestFiles(analysis) {
  const topFiles = analysis.bySize.slice(0, 10);
  
  return `
    <div style="
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    ">
      <h3 style="color: #ef4444; margin: 0 0 16px 0;">🔴 Largest Files (Split These!)</h3>
      
      <div style="display: grid; gap: 8px;">
        ${topFiles.map(file => {
          const color = file.loc > 1000 ? '#ef4444' : file.loc > 500 ? '#f59e0b' : '#10b981';
          return `
            <div style="
              background: #0f0f0f;
              padding: 12px;
              border-radius: 8px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-left: 3px solid ${color};
            ">
              <div>
                <div style="color: #f8fafc; font-size: 14px;">${file.name}</div>
                <div style="color: #64748b; font-size: 11px; font-family: monospace;">
                  ${file.path}
                </div>
              </div>
              <div style="display: flex; gap: 16px; align-items: center;">
                <div style="text-align: center;">
                  <div style="color: ${color}; font-size: 18px; font-weight: bold;">${file.loc}</div>
                  <div style="color: #64748b; font-size: 10px;">LOC</div>
                </div>
                <div style="text-align: center;">
                  <div style="color: #94a3b8; font-size: 14px;">${file.functions}</div>
                  <div style="color: #64748b; font-size: 10px;">funcs</div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderMostComplexFiles(analysis) {
  const topComplex = analysis.byComplexity.slice(0, 5);
  
  return `
    <div style="
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    ">
      <h3 style="color: #f59e0b; margin: 0 0 16px 0;">⚠️ Most Complex (Refactor These!)</h3>
      
      <div style="display: grid; gap: 8px;">
        ${topComplex.map(file => `
          <div style="
            background: #0f0f0f;
            padding: 12px;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          ">
            <div style="color: #f8fafc;">${file.name}</div>
            <div style="
              background: #f59e0b20;
              color: #f59e0b;
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 12px;
            ">
              Complexity: ${file.complexity}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderDisconnectedFiles(analysis) {
  if (analysis.noExports.length === 0) return '';
  
  return `
    <div style="
      background: #1a1a1a;
      border: 1px solid #ef4444;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    ">
      <h3 style="color: #ef4444; margin: 0 0 16px 0;">
        🔌 Disconnected Files (${analysis.noExports.length})
      </h3>
      <p style="color: #94a3b8; margin-bottom: 16px; font-size: 14px;">
        These files have no exports - might be dead code or missing exports
      </p>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px;">
        ${analysis.noExports.slice(0, 20).map(file => `
          <div style="
            background: #ef444410;
            padding: 8px;
            border-radius: 6px;
            font-size: 12px;
            color: #f8fafc;
            font-family: monospace;
          ">
            ${file.name}
          </div>
        `).join('')}
      </div>
      
      ${analysis.noExports.length > 20 ? `
        <div style="text-align: center; color: #64748b; margin-top: 12px; font-size: 12px;">
          ... and ${analysis.noExports.length - 20} more
        </div>
      ` : ''}
    </div>
  `;
}

function renderFileConnections(analysis) {
  // Find most connected files (high imports + exports)
  const connected = analysis.files
    .map(f => ({ ...f, connections: f.imports + f.exports }))
    .sort((a, b) => b.connections - a.connections)
    .slice(0, 5);
  
  return `
    <div style="
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 20px;
    ">
      <h3 style="color: #10b981; margin: 0 0 16px 0;">🌐 Most Connected Files</h3>
      
      <div style="display: grid; gap: 8px;">
        ${connected.map(file => `
          <div style="
            background: #0f0f0f;
            padding: 12px;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          ">
            <div style="color: #f8fafc;">${file.name}</div>
            <div style="display: flex; gap: 12px;">
              <span style="color: #3b82f6; font-size: 12px;">
                ↓ ${file.imports} imports
              </span>
              <span style="color: #10b981; font-size: 12px;">
                ↑ ${file.exports} exports
              </span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}