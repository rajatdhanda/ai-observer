/**
 * Architecture View Renderer
 * Handles rendering of the Architecture tab
 */

(function() {
  'use strict';

  window.loadArchitectureView = async function() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
      <div style="padding: 20px;">
        <div style="text-align: center; color: #9ca3af; margin: 40px 0;">
          <div style="font-size: 20px; margin-bottom: 16px;">⟳</div>
          <div>Loading architecture analysis...</div>
        </div>
      </div>
    `;
    
    try {
      // Get architecture data from existing endpoint
      const response = await fetch('/api/analysis');
      const data = await response.json();
      
      mainContent.innerHTML = `
        <div style="padding: 20px;">
          <div style="
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 20px;
            color: white;
          ">
            <h1 style="margin: 0 0 8px 0;">🏗️ Architecture Overview</h1>
            <p style="margin: 0; opacity: 0.9;">System relationships and component dependencies</p>
          </div>
          
          ${renderArchitectureSummary(data)}
          ${renderHealthOverview(data)}
          ${renderEntityCounts(data)}
          ${renderRelationshipMap(data)}
          ${renderEntityList('Hooks', data.hooks || [], 'hook', '#3b82f6')}
          ${renderEntityList('Components', data.components || [], 'component', '#8b5cf6')}
          ${renderEntityList('Pages', data.pages || [], 'page', '#10b981')}
          ${renderEntityList('APIs', data.apis || [], 'api', '#f59e0b')}
        </div>
      `;
    } catch (error) {
      mainContent.innerHTML = `
        <div style="text-align: center; color: #ef4444; margin: 40px 0;">
          <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
          <h2>Error Loading Architecture</h2>
          <p style="color: #64748b;">Please check your connection and try again.</p>
        </div>
      `;
    }
  };

  window.renderArchitectureSummary = function(data) {
    const { healthScore = 0, issueCount = 0, componentCount = 0 } = data;
    const scoreColor = healthScore >= 70 ? '#10b981' : healthScore >= 40 ? '#f59e0b' : '#ef4444';
    
    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 24px;
      ">
        <h3 style="color: #f8fafc; margin: 0 0 16px 0;">📊 System Overview</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
          <div style="text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: ${scoreColor};">${healthScore}%</div>
            <div style="color: #64748b; font-size: 14px;">Health Score</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #f59e0b;">${issueCount}</div>
            <div style="color: #64748b; font-size: 14px;">Issues Found</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #3b82f6;">${componentCount}</div>
            <div style="color: #64748b; font-size: 14px;">Components</div>
          </div>
        </div>
      </div>
    `;
  };

  window.renderEntityCounts = function(data) {
    const counts = {
      Tables: data.tables?.length || 0,
      Hooks: data.hooks?.length || 0,
      Components: data.components?.length || 0,
      Pages: data.pages?.length || 0,
      APIs: data.apis?.length || 0
    };
    
    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 24px;
      ">
        <h3 style="color: #f8fafc; margin: 0 0 16px 0;">🔗 Entity Overview</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px;">
          ${Object.entries(counts).map(([name, count]) => `
            <div style="
              background: #0f0f0f;
              padding: 16px;
              border-radius: 8px;
              text-align: center;
            ">
              <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${count}</div>
              <div style="color: #64748b; font-size: 14px;">${name}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };

  window.renderEntityList = function(title, entities, type, color) {
    if (!entities || entities.length === 0) return '';
    
    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 24px;
      ">
        <h3 style="color: #f8fafc; margin: 0 0 16px 0;">${title}</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px;">
          ${entities.map(entity => `
            <div style="
              background: #0f0f0f;
              padding: 12px 16px;
              border-radius: 8px;
              border-left: 3px solid ${color};
              cursor: pointer;
              transition: all 0.2s;
            " 
            onmouseover="this.style.background='#1a1a1a'"
            onmouseout="this.style.background='#0f0f0f'"
            onclick="selectItem('${entity.name || entity}', '${type}')">
              <div style="color: #f8fafc; font-weight: 500;">
                ${entity.name || entity}
              </div>
              ${entity.file ? `
                <div style="color: #64748b; font-size: 12px; margin-top: 4px;">
                  ${entity.file}
                </div>
              ` : ''}
              ${entity.errorCount !== undefined ? `
                <div style="display: flex; gap: 8px; margin-top: 8px;">
                  ${entity.errorCount > 0 ? `
                    <span style="color: #ef4444; font-size: 12px;">
                      ⚫ ${entity.errorCount} errors
                    </span>
                  ` : ''}
                  ${entity.warningCount > 0 ? `
                    <span style="color: #f59e0b; font-size: 12px;">
                      ⚫ ${entity.warningCount} warnings
                    </span>
                  ` : ''}
                  ${entity.errorCount === 0 && entity.warningCount === 0 ? `
                    <span style="color: #10b981; font-size: 12px;">
                      ✓ Clean
                    </span>
                  ` : ''}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };

  window.renderRelationshipMap = function(data) {
    if (!data.relationships || data.relationships.length === 0) return '';
    
    // Group relationships by source
    const relationshipsBySource = {};
    data.relationships.forEach(rel => {
      if (!relationshipsBySource[rel.from]) {
        relationshipsBySource[rel.from] = [];
      }
      relationshipsBySource[rel.from].push(rel);
    });
    
    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 24px;
      ">
        <h3 style="color: #f8fafc; margin: 0 0 16px 0;">🔄 Relationships</h3>
        <div style="max-height: 400px; overflow-y: auto;">
          ${Object.entries(relationshipsBySource).map(([source, rels]) => `
            <div style="margin-bottom: 16px;">
              <div style="color: #3b82f6; font-weight: 500; margin-bottom: 8px;">
                ${source}
              </div>
              <div style="padding-left: 20px;">
                ${rels.map(rel => `
                  <div style="
                    color: #64748b;
                    padding: 4px 0;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                  ">
                    <span style="color: #f59e0b;">→</span>
                    <span>${rel.type}</span>
                    <span style="color: #f8fafc;">${rel.to}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };

  window.renderHealthOverview = function(data) {
    const scoreColor = data.healthScore >= 70 ? '#10b981' : 
                      data.healthScore >= 40 ? '#f59e0b' : '#ef4444';
    
    const scoreText = data.healthScore >= 70 ? 'Healthy' : 
                     data.healthScore >= 40 ? 'Needs Attention' : 'Critical';
    
    return `
      <div style="
        background: linear-gradient(135deg, ${scoreColor}20 0%, ${scoreColor}10 100%);
        border: 2px solid ${scoreColor};
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 24px;
      ">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <h3 style="color: #f8fafc; margin: 0 0 8px 0;">System Health</h3>
            <p style="color: #94a3b8; margin: 0; font-size: 14px;">
              Overall codebase quality and maintainability score
            </p>
          </div>
          <div style="text-align: center;">
            <div style="
              width: 80px;
              height: 80px;
              border-radius: 50%;
              background: ${scoreColor}30;
              border: 3px solid ${scoreColor};
              display: flex;
              align-items: center;
              justify-content: center;
              flex-direction: column;
            ">
              <div style="font-size: 24px; font-weight: bold; color: ${scoreColor};">
                ${data.healthScore || 0}%
              </div>
              <div style="font-size: 10px; color: #64748b;">${scoreText}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  };

})();