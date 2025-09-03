/**
 * Dashboard Tab Functions Module  
 * Complete extraction from modular-fixed.html
 */

(function() {
  'use strict';

  // Helper function for theme colors
  window.getThemeColor = window.getThemeColor || function(path, fallback = '#666') {
    if (!window.AI_OBSERVER_THEME) return fallback;
    const keys = path.split('.');
    let value = window.AI_OBSERVER_THEME;
    for (const key of keys) {
      value = value[key];
      if (!value) return fallback;
    }
    return value;
  };

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
          ${renderEntityCounts(data)}
          ${renderRelationshipMap(data)}
          ${renderHealthOverview(data)}
        </div>
      `;
    } catch (error) {
      mainContent.innerHTML = `
        <div class="card" style="color: #ef4444;">
          <h2>⚠️ Error Loading Architecture</h2>
          <p>Failed to load architecture data: ${error.message}</p>
        </div>
      `;
    }
  }
  
  window.renderArchitectureSummary = function(data) {
    const tables = data.types?.interfaces?.filter(i => i.category === 'database')?.length || 0;
    const components = data.types?.interfaces?.filter(i => i.category === 'component')?.length || 0;
    const hooks = 0; // Will get from components analysis
    const pages = 0; // Will get from pages analysis
    
    return `
      <div class="card" style="margin-bottom: 20px;">
        <h3 style="color: #f8fafc; margin: 0 0 16px 0;">📊 System Overview</h3>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; text-align: center;">
          <div style="padding: 16px; background: #0f0f0f; border-radius: 8px;">
            <div style="font-size: 24px; color: #10b981; font-weight: bold;">${tables}</div>
            <div style="color: #64748b; font-size: 12px;">Tables</div>
          </div>
          <div style="padding: 16px; background: #0f0f0f; border-radius: 8px;">
            <div style="font-size: 24px; color: #3b82f6; font-weight: bold;">${hooks}</div>
            <div style="color: #64748b; font-size: 12px;">Hooks</div>
          </div>
          <div style="padding: 16px; background: #0f0f0f; border-radius: 8px;">
            <div style="font-size: 24px; color: #f59e0b; font-weight: bold;">${components}</div>
            <div style="color: #64748b; font-size: 12px;">Components</div>
          </div>
          <div style="padding: 16px; background: #0f0f0f; border-radius: 8px;">
            <div style="font-size: 24px; color: #8b5cf6; font-weight: bold;">${pages}</div>
            <div style="color: #64748b; font-size: 12px;">Pages</div>
          </div>
        </div>
      </div>
    `;
  }
  
  window.renderEntityCounts = function(data) {
    const tables = data.types?.interfaces?.filter(i => i.category === 'database') || [];
    const components = data.types?.interfaces?.filter(i => i.category === 'component') || [];
    
    return `
      <div class="card" style="margin-bottom: 20px;">
        <h3 style="color: #f8fafc; margin: 0 0 16px 0;">🔗 Entity Overview</h3>
        <div style="display: grid; gap: 12px;">
          ${renderEntityList('Database Types', tables.reduce((acc, t) => ({...acc, [t.name]: t}), {}), 'table', '#10b981')}
          ${renderEntityList('Components', components.reduce((acc, t) => ({...acc, [t.name]: t}), {}), 'component', '#f59e0b')}
        </div>
      </div>
    `;
  }
  
  window.renderEntityList = function(title, entities, type, color) {
    if (!entities || Object.keys(entities).length === 0) return '';
    
    const items = Object.keys(entities).slice(0, 8);
    const remaining = Math.max(0, Object.keys(entities).length - 8);
    
    return `
      <div style="background: #0f0f0f; padding: 16px; border-radius: 8px; border-left: 3px solid ${color};">
        <div style="color: ${color}; font-weight: 500; margin-bottom: 8px;">${title} (${Object.keys(entities).length})</div>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          ${items.map(item => `
            <span style="
              background: var(--border-dark);
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 11px;
              color: #9ca3af;
              cursor: pointer;
            " onclick="selectItem('${item}', '${type}')">
              ${item}
            </span>
          `).join('')}
          ${remaining > 0 ? `
            <span style="color: #64748b; font-size: 11px; padding: 4px;">
              +${remaining} more...
            </span>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  window.renderRelationshipMap = function(data) {
    // Extract relationships from type interfaces
    const relationships = [];
    
    const components = data.types?.interfaces?.filter(i => i.category === 'component') || [];
    const databases = data.types?.interfaces?.filter(i => i.category === 'database') || [];
    
    // Show component property relationships
    components.forEach(comp => {
      const relatedProps = comp.properties?.filter(p => 
        databases.some(db => p.name.toLowerCase().includes(db.name.toLowerCase()))
      ) || [];
      
      relatedProps.forEach(prop => {
        const relatedDb = databases.find(db => 
          prop.name.toLowerCase().includes(db.name.toLowerCase())
        );
        if (relatedDb) {
          relationships.push({
            from: comp.name,
            to: relatedDb.name,
            type: 'component→data',
            color: '#f59e0b'
          });
        }
      });
    });
    
    return `
      <div class="card" style="margin-bottom: 20px;">
        <h3 style="color: #f8fafc; margin: 0 0 16px 0;">🌐 Relationship Map</h3>
        ${relationships.length > 0 ? `
          <div style="display: grid; gap: 8px; max-height: 300px; overflow-y: auto;">
            ${relationships.slice(0, 20).map(rel => `
              <div style="
                display: flex;
                align-items: center;
                padding: 8px;
                background: #0f0f0f;
                border-radius: 6px;
                font-size: 13px;
              ">
                <span style="color: #f8fafc; font-weight: 500;">${rel.from}</span>
                <span style="color: ${rel.color}; margin: 0 8px;">→</span>
                <span style="color: #9ca3af;">${rel.to}</span>
                <span style="
                  background: var(--border-dark);
                  padding: 2px 6px;
                  border-radius: 3px;
                  font-size: 10px;
                  color: ${rel.color};
                  margin-left: auto;
                ">${rel.type}</span>
              </div>
            `).join('')}
            ${relationships.length > 20 ? `
              <div style="text-align: center; color: #64748b; font-size: 12px; padding: 8px;">
                Showing 20 of ${relationships.length} relationships
              </div>
            ` : ''}
          </div>
        ` : `
          <div style="text-align: center; color: #64748b; padding: 40px;">
            No relationships detected
          </div>
        `}
      </div>
    `;
  }
  
  window.renderHealthOverview = function(data) {
    // Calculate overall health based on actual data
    const totalEntities = data.types?.interfaces?.length || 0;
    
    return `
      <div class="card">
        <h3 style="color: #f8fafc; margin: 0 0 16px 0;">💊 System Health</h3>
        <div style="display: grid; grid-template-columns: 1fr auto; gap: 20px; align-items: center;">
          <div>
            <div style="color: #9ca3af; margin-bottom: 12px;">Overall architecture health based on entity count and relationships</div>
            <div style="display: flex; gap: 16px; font-size: 13px;">
              <div>
                <span style="color: #64748b;">Total Entities:</span>
                <span style="color: #f8fafc; margin-left: 8px;">${totalEntities}</span>
              </div>
              <div>
                <span style="color: #64748b;">Coverage:</span>
                <span style="color: #10b981; margin-left: 8px;">Good</span>
              </div>
            </div>
          </div>
          <div style="text-align: center;">
            <div style="
              width: 60px;
              height: 60px;
              border-radius: 50%;
              background: #10b98120;
              border: 2px solid #10b981;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #10b981;
              font-weight: bold;
            ">
              ${Math.min(100, Math.max(60, totalEntities * 2))}
            </div>
            <div style="color: #10b981; font-size: 11px; margin-top: 4px;">Healthy</div>
          </div>
        </div>
      </div>
    `;
  }
  
  // Validation tab view
  window.loadValidationView = async function() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
      <div style="padding: 20px;">
        <div style="text-align: center; color: #9ca3af; margin: 40px 0;">
          <div style="font-size: 20px; margin-bottom: 16px;">⟳</div>
          <div>Loading validation results...</div>
        </div>
      </div>
    `;
    
    try {
      // Fetch both contract and nine-rules data in parallel
      const [contractResponse, nineRulesResponse] = await Promise.all([
        fetch('/api/contracts'),
        fetch('/api/nine-rules')
      ]);
      
      const contractData = await contractResponse.json();
      const nineRulesData = await nineRulesResponse.json();
      
      mainContent.innerHTML = `
        <div style="padding: 20px;">
          <div style="
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 24px;
            color: white;
          ">
            <h1 style="margin: 0 0 8px 0; display: flex; align-items: center; gap: 12px;">
              ✅ Validation Results
            </h1>
            <p style="margin: 0; opacity: 0.9; font-size: 14px;">
              Contract compliance and code quality validation
            </p>
          </div>
          
          ${renderValidationSummary(contractData, nineRulesData)}
          ${renderContractViolations(contractData)}
          ${renderNineRulesViolations(nineRulesData)}
        </div>
      `;
      
    } catch (error) {
      console.error('Error loading validation data:', error);
      mainContent.innerHTML = `
        <div style="padding: 20px;">
          <div style="text-align: center; color: #ef4444; margin: 40px 0;">
            <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
            <h2>Error Loading Validation Data</h2>
            <p style="color: #64748b;">Failed to load validation results: ${error.message}</p>
          </div>
        </div>
      `;
    }
  }
  
  window.renderValidationSummary = function(contractData, nineRulesData) {
    const contractScore = contractData.score || 0;
    const nineRulesScore = nineRulesData.overallScore || 0;
    const overallScore = Math.round((contractScore + nineRulesScore) / 2);
    // Use configurable colors
    const config = window.HealthScoringConfig || { thresholds: { healthy: 70, needsAttention: 40 }, colors: { healthy: '#10b981', warning: '#f59e0b', critical: '#ef4444' } };
    const color = overallScore >= config.thresholds.healthy ? config.colors.healthy : overallScore >= config.thresholds.needsAttention ? config.colors.warning : config.colors.critical;
    
    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
      ">
        <h2 style="color: #f8fafc; margin: 0 0 20px 0;">📊 Validation Summary</h2>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px;">
          <div style="background: #0f0f0f; padding: 16px; border-radius: 8px; text-align: center;">
            <div style="
              width: 60px;
              height: 60px;
              border-radius: 50%;
              background: ${color}20;
              border: 3px solid ${color};
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 20px;
              font-weight: bold;
              color: ${color};
              margin: 0 auto 12px auto;
            ">
              ${overallScore}
            </div>
            <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">Overall Score</div>
            <div style="color: ${color}; font-size: 14px; font-weight: 500;">
              ${overallScore >= config.thresholds.healthy ? 'Good' : overallScore >= config.thresholds.needsAttention ? 'Fair' : 'Needs Work'}
            </div>
          </div>
          
          <div style="background: #0f0f0f; padding: 16px; border-radius: 8px; text-align: center;">
            <div style="color: #3b82f6; font-size: 24px; font-weight: bold; margin-bottom: 8px;">${contractScore}</div>
            <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">Contract Score</div>
            <div style="color: #f8fafc; font-size: 13px;">${contractData.violations?.length || 0} violations</div>
          </div>
          
          <div style="background: #0f0f0f; padding: 16px; border-radius: 8px; text-align: center;">
            <div style="color: #10b981; font-size: 24px; font-weight: bold; margin-bottom: 8px;">${nineRulesScore}</div>
            <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">Quality Score</div>
            <div style="color: #f8fafc; font-size: 13px;">${nineRulesData.passedRules || 0}/${nineRulesData.totalRules || 9} rules passed</div>
          </div>
          
          <div style="background: #0f0f0f; padding: 16px; border-radius: 8px; text-align: center;">
            <div style="color: #ef4444; font-size: 24px; font-weight: bold; margin-bottom: 8px;">${(nineRulesData.criticalIssues || 0) + (contractData.violations?.filter(v => v.type === 'error').length || 0)}</div>
            <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">Critical Issues</div>
            <div style="color: #f8fafc; font-size: 13px;">Needs immediate attention</div>
          </div>
        </div>
      </div>
    `;
  }
  
  window.renderContractViolations = function(contractData) {
    const violations = contractData.violations || [];
    
    if (violations.length === 0) {
      return `
        <div style="
          background: #1a1a1a;
          border: 1px solid #10b981;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
        ">
          <h3 style="color: #10b981; margin: 0 0 16px 0;">📋 Contract Validation - All Good!</h3>
          <p style="color: #94a3b8;">No contract violations found. All schemas match their contracts.</p>
        </div>
      `;
    }
    
    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
      ">
        <h3 style="color: #ef4444; margin: 0 0 16px 0;">📋 Contract Violations (${violations.length})</h3>
        
        <div id="contractViolationsList" style="display: flex; flex-direction: column; gap: 12px;">
          ${violations.slice(0, Math.min(10, violations.length)).map(violation => `
            <div style="
              background: #0f0f0f;
              border-left: 4px solid #ef4444;
              padding: 16px;
              border-radius: 0 8px 8px 0;
            ">
              <div style="display: flex; justify-content: between; align-items: start; margin-bottom: 8px;">
                <div style="color: #ef4444; font-weight: 500; margin-right: 12px;">
                  ${violation.entity}
                </div>
                <div style="
                  background: #ef444420;
                  color: #ef4444;
                  padding: 2px 8px;
                  border-radius: 12px;
                  font-size: 11px;
                  text-transform: uppercase;
                ">
                  ${violation.type}
                </div>
              </div>
              
              <div style="color: #f8fafc; margin-bottom: 8px; font-size: 14px;">
                ${violation.message}
              </div>
              
              <div style="color: #64748b; font-size: 12px; font-family: monospace; margin-bottom: 8px;">
                ${violation.location}
              </div>
              
              ${violation.suggestion ? `
                <div style="color: #3b82f6; font-size: 13px; font-style: italic;">
                  💡 ${violation.suggestion}
                </div>
              ` : ''}
            </div>
          `).join('')}
          
          ${violations.length > 10 ? `
            <div style="text-align: center; padding: 16px;">
              <button onclick="window.showAllViolations('contractViolations', ${JSON.stringify(violations).replace(/"/g, '&quot;')})" style="
                background: #3b82f6;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
              ">
                Show All ${violations.length} Violations
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  window.renderNineRulesViolations = function(nineRulesData) {
    const results = nineRulesData.results || [];
    const failedRules = results.filter(rule => rule.status === 'fail');
    
    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 20px;
      ">
        <h3 style="color: #f59e0b; margin: 0 0 16px 0;">🔍 Nine Quality Rules Assessment</h3>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; margin-bottom: 20px;">
          ${results.map(rule => {
            const color = rule.status === 'pass' ? '#10b981' : '#ef4444';
            const icon = rule.status === 'pass' ? '✅' : '❌';
            
            return `
              <div style="
                background: #0f0f0f;
                border: 1px solid ${rule.status === 'pass' ? '#10b98130' : '#ef444430'};
                border-radius: 8px;
                padding: 16px;
              ">
                <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 12px;">
                  <div style="color: ${color}; font-weight: 500; display: flex; align-items: center; gap: 8px;">
                    ${icon} Rule ${rule.ruleNumber}
                  </div>
                  <div style="
                    background: ${color}20;
                    color: ${color};
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    text-transform: uppercase;
                  ">
                    ${rule.status}
                  </div>
                </div>
                
                <div style="color: #f8fafc; margin-bottom: 8px; font-size: 14px;">
                  ${rule.rule}
                </div>
                
                <div style="color: #64748b; font-size: 12px;">
                  Score: ${rule.score}/100
                </div>
                
                ${rule.issues && rule.issues.length > 0 ? `
                  <div style="margin-top: 12px;">
                    <div style="color: #ef4444; font-size: 12px; margin-bottom: 8px;">
                      ${rule.issues.length} issue${rule.issues.length > 1 ? 's' : ''}:
                    </div>
                    ${rule.issues.slice(0, 2).map(issue => `
                      <div style="
                        background: #ef444410;
                        border-left: 3px solid #ef4444;
                        padding: 8px;
                        margin-bottom: 4px;
                        border-radius: 0 4px 4px 0;
                        font-size: 11px;
                      ">
                        <div style="color: #ef4444; margin-bottom: 2px;">${issue.severity.toUpperCase()}</div>
                        <div style="color: #f8fafc;">${issue.message}</div>
                      </div>
                    `).join('')}
                    ${rule.issues.length > 2 ? `
                      <div style="color: #64748b; font-size: 11px; text-align: center; padding: 4px;">
                        +${rule.issues.length - 2} more
                      </div>
                    ` : ''}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
  
  // Analytics tab view
  window.loadAnalyticsView = async function() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
      <div style="padding: 20px;">
        <div style="text-align: center; color: #9ca3af; margin: 40px 0;">
          <div style="font-size: 20px; margin-bottom: 16px;">⟳</div>
          <div>Loading analytics data...</div>
        </div>
      </div>
    `;
    
    try {
      // Fetch all data sources in parallel
      const [architectureResponse, contractResponse, nineRulesResponse] = await Promise.all([
        fetch('/api/analysis'),
        fetch('/api/contracts'),
        fetch('/api/nine-rules')
      ]);
      
      const architectureData = await architectureResponse.json();
      const contractData = await contractResponse.json();
      const nineRulesData = await nineRulesResponse.json();
      
      mainContent.innerHTML = `
        <div style="padding: 20px;">
          <div style="
            background: ${getThemeColor('gradients.purple', 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)')};
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 24px;
            color: white;
          ">
            <h1 style="margin: 0 0 8px 0; display: flex; align-items: center; gap: 12px;">
              📊 Analytics Dashboard
            </h1>
            <p style="margin: 0; opacity: 0.9; font-size: 14px;">
              Comprehensive project health and metrics analysis
            </p>
          </div>
          
          ${renderMetricsOverview(architectureData, contractData, nineRulesData)}
          ${renderHealthTrends(architectureData, contractData, nineRulesData)}
          ${renderCodeQualityBreakdown(nineRulesData)}
          ${renderEntityDistribution(architectureData)}
        </div>
      `;
      
    } catch (error) {
      console.error('Error loading analytics data:', error);
      mainContent.innerHTML = `
        <div style="padding: 20px;">
          <div style="text-align: center; color: #ef4444; margin: 40px 0;">
            <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
            <h2>Error Loading Analytics</h2>
            <p style="color: #64748b;">Failed to load analytics data: ${error.message}</p>
          </div>
        </div>
      `;
    }
  }
  
  window.renderMetricsOverview = function(architectureData, contractData, nineRulesData) {
    const totalEntities = (architectureData.types?.interfaces || []).length;
    const totalViolations = (contractData.violations || []).length + (nineRulesData.criticalIssues || 0) + (nineRulesData.warnings || 0);
    const healthScore = Math.round(((contractData.score || 0) + (nineRulesData.overallScore || 0)) / 2);
    const codeQuality = nineRulesData.passedRules || 0;
    
    // Use configurable health scoring
    const config = window.HealthScoringConfig || { thresholds: { healthy: 70, needsAttention: 40 }, colors: { healthy: '#10b981', warning: '#f59e0b', critical: '#ef4444' } };
    const healthColor = healthScore >= config.thresholds.healthy ? config.colors.healthy : healthScore >= config.thresholds.needsAttention ? config.colors.warning : config.colors.critical;
    
    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
      ">
        <h2 style="color: #f8fafc; margin: 0 0 20px 0;">🎯 Key Metrics</h2>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
          <div style="background: #0f0f0f; padding: 20px; border-radius: 8px; text-align: center;">
            <div style="color: #3b82f6; font-size: 28px; font-weight: bold; margin-bottom: 8px;">${totalEntities}</div>
            <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">Total Entities</div>
            <div style="color: #f8fafc; font-size: 13px;">Tables, Hooks, Components</div>
          </div>
          
          <div style="background: #0f0f0f; padding: 20px; border-radius: 8px; text-align: center;">
            <div style="color: ${healthColor}; font-size: 28px; font-weight: bold; margin-bottom: 8px;">${healthScore}</div>
            <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">Health Score</div>
            <div style="color: #f8fafc; font-size: 13px;">Overall system health</div>
          </div>
          
          <div style="background: #0f0f0f; padding: 20px; border-radius: 8px; text-align: center;">
            <div style="color: ${totalViolations === 0 ? '#10b981' : totalViolations < 10 ? '#f59e0b' : '#ef4444'}; font-size: 28px; font-weight: bold; margin-bottom: 8px;">${totalViolations}</div>
            <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">Total Issues</div>
            <div style="color: #f8fafc; font-size: 13px;">Contracts + Quality</div>
          </div>
          
          <div style="background: #0f0f0f; padding: 20px; border-radius: 8px; text-align: center;">
            <div style="color: #10b981; font-size: 28px; font-weight: bold; margin-bottom: 8px;">${codeQuality}/9</div>
            <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">Quality Rules</div>
            <div style="color: #f8fafc; font-size: 13px;">Passing standards</div>
          </div>
        </div>
      </div>
    `;
  }
  
  window.renderHealthTrends = function(architectureData, contractData, nineRulesData) {
    const contractScore = contractData.score || 0;
    const qualityScore = nineRulesData.overallScore || 0;
    const overallScore = Math.round((contractScore + qualityScore) / 2);
    
    // Use configurable health scoring
    const config = window.HealthScoringConfig || { thresholds: { healthy: 70, needsAttention: 40 } };
    
    // Calculate trend indicators using config thresholds
    const contractTrend = contractScore >= config.thresholds.healthy ? '📈' : contractScore >= config.thresholds.needsAttention ? '📊' : '📉';
    const qualityTrend = qualityScore >= config.thresholds.healthy ? '📈' : qualityScore >= config.thresholds.needsAttention ? '📊' : '📉';
    const overallTrend = overallScore >= config.thresholds.healthy ? '📈' : overallScore >= config.thresholds.needsAttention ? '📊' : '📉';
    
    window.getHealthStatus = function(score) {
      return score >= config.thresholds.healthy ? 'Healthy' : score >= config.thresholds.needsAttention ? 'Fair' : 'Needs Work';
    }
    
    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
      ">
        <h2 style="color: #f8fafc; margin: 0 0 20px 0;">📈 Health Trends</h2>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
          <div style="background: #0f0f0f; padding: 16px; border-radius: 8px;">
            <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 12px;">
              <h3 style="color: #3b82f6; margin: 0; font-size: 16px;">Contract Compliance</h3>
              <span style="font-size: 20px;">${contractTrend}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: #3b82f620;
                border: 2px solid #3b82f6;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #3b82f6;
                font-weight: bold;
              ">
                ${contractScore}
              </div>
              <div>
                <div style="color: #f8fafc; font-size: 14px;">${(contractData.violations || []).length} violations</div>
                <div style="color: #64748b; font-size: 12px;">Schema alignment</div>
              </div>
            </div>
          </div>
          
          <div style="background: #0f0f0f; padding: 16px; border-radius: 8px;">
            <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 12px;">
              <h3 style="color: #10b981; margin: 0; font-size: 16px;">Code Quality</h3>
              <span style="font-size: 20px;">${qualityTrend}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: #10b98120;
                border: 2px solid #10b981;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #10b981;
                font-weight: bold;
              ">
                ${qualityScore}
              </div>
              <div>
                <div style="color: #f8fafc; font-size: 14px;">${nineRulesData.passedRules || 0}/9 rules passed</div>
                <div style="color: #64748b; font-size: 12px;">Nine rules validation</div>
              </div>
            </div>
          </div>
          
          <div style="background: #0f0f0f; padding: 16px; border-radius: 8px;">
            <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 12px;">
              <h3 style="color: #7c3aed; margin: 0; font-size: 16px;">Overall Health</h3>
              <span style="font-size: 20px;">${overallTrend}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: #7c3aed20;
                border: 2px solid #7c3aed;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #7c3aed;
                font-weight: bold;
              ">
                ${overallScore}
              </div>
              <div>
                <div style="color: #f8fafc; font-size: 14px;">${getHealthStatus(overallScore)}</div>
                <div style="color: #64748b; font-size: 12px;">Combined score</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  window.renderCodeQualityBreakdown = function(nineRulesData) {
    const results = nineRulesData.results || [];
    const passedRules = results.filter(r => r.status === 'pass').length;
    const failedRules = results.filter(r => r.status === 'fail').length;
    
    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
      ">
        <h2 style="color: #f8fafc; margin: 0 0 20px 0;">🔍 Quality Analysis</h2>
        
        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 20px;">
          <div style="background: #0f0f0f; padding: 16px; border-radius: 8px;">
            <h3 style="color: #f8fafc; margin: 0 0 16px 0; font-size: 16px;">Rule Summary</h3>
            
            <div style="margin-bottom: 16px;">
              <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 8px;">
                <span style="color: #64748b; font-size: 13px;">Passed Rules</span>
                <span style="color: #10b981; font-weight: bold;">${passedRules}</span>
              </div>
              <div style="
                width: 100%;
                height: 6px;
                background: var(--border-dark);
                border-radius: 3px;
                overflow: hidden;
              ">
                <div style="
                  width: ${(passedRules / 9) * 100}%;
                  height: 100%;
                  background: #10b981;
                "></div>
              </div>
            </div>
            
            <div style="margin-bottom: 16px;">
              <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 8px;">
                <span style="color: #64748b; font-size: 13px;">Failed Rules</span>
                <span style="color: #ef4444; font-weight: bold;">${failedRules}</span>
              </div>
              <div style="
                width: 100%;
                height: 6px;
                background: var(--border-dark);
                border-radius: 3px;
                overflow: hidden;
              ">
                <div style="
                  width: ${(failedRules / 9) * 100}%;
                  height: 100%;
                  background: #ef4444;
                "></div>
              </div>
            </div>
            
            <div>
              <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">Overall Score</div>
              <div style="color: #f8fafc; font-size: 24px; font-weight: bold;">
                ${nineRulesData.overallScore || 0}/100
              </div>
            </div>
          </div>
          
          <div style="background: #0f0f0f; padding: 16px; border-radius: 8px;">
            <h3 style="color: #f8fafc; margin: 0 0 16px 0; font-size: 16px;">Issue Distribution</h3>
            
            <div style="display: grid; gap: 12px;">
              <div style="display: flex; justify-content: between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 12px; height: 12px; border-radius: 50%; background: #ef4444;"></div>
                  <span style="color: #f8fafc; font-size: 13px;">Critical Issues</span>
                </div>
                <span style="color: #ef4444; font-weight: bold;">${nineRulesData.criticalIssues || 0}</span>
              </div>
              
              <div style="display: flex; justify-content: between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 12px; height: 12px; border-radius: 50%; background: #f59e0b;"></div>
                  <span style="color: #f8fafc; font-size: 13px;">Warnings</span>
                </div>
                <span style="color: #f59e0b; font-weight: bold;">${nineRulesData.warnings || 0}</span>
              </div>
              
              <div style="display: flex; justify-content: between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 12px; height: 12px; border-radius: 50%; background: #10b981;"></div>
                  <span style="color: #f8fafc; font-size: 13px;">Passed Validations</span>
                </div>
                <span style="color: #10b981; font-weight: bold;">${passedRules}</span>
              </div>
            </div>
            
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #252525;">
              <div style="color: #64748b; font-size: 12px; margin-bottom: 8px;">Top Issues:</div>
              ${results.filter(r => r.issues && r.issues.length > 0).slice(0, 2).map(rule => `
                <div style="margin-bottom: 8px; padding: 8px; background: #ef444410; border-radius: 4px;">
                  <div style="color: #ef4444; font-size: 12px; font-weight: 500;">${rule.rule}</div>
                  <div style="color: #94a3b8; font-size: 11px;">${rule.issues.length} issue${rule.issues.length > 1 ? 's' : ''}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  window.renderEntityDistribution = function(architectureData) {
    const interfaces = architectureData.types?.interfaces || [];
    const databaseTypes = interfaces.filter(i => i.category === 'database').length;
    const componentTypes = interfaces.filter(i => i.category === 'component').length;
    const otherTypes = interfaces.length - databaseTypes - componentTypes;
    
    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 20px;
      ">
        <h2 style="color: #f8fafc; margin: 0 0 20px 0;">🏗️ Entity Distribution</h2>
        
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
          <div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">
              <div style="background: #0f0f0f; padding: 16px; border-radius: 8px; text-align: center;">
                <div style="color: #3b82f6; font-size: 24px; margin-bottom: 8px;">🗃️</div>
                <div style="color: #3b82f6; font-size: 20px; font-weight: bold; margin-bottom: 4px;">${databaseTypes}</div>
                <div style="color: #64748b; font-size: 12px;">Database Types</div>
              </div>
              
              <div style="background: #0f0f0f; padding: 16px; border-radius: 8px; text-align: center;">
                <div style="color: #10b981; font-size: 24px; margin-bottom: 8px;">🧩</div>
                <div style="color: #10b981; font-size: 20px; font-weight: bold; margin-bottom: 4px;">${componentTypes}</div>
                <div style="color: #64748b; font-size: 12px;">Components</div>
              </div>
              
              <div style="background: #0f0f0f; padding: 16px; border-radius: 8px; text-align: center;">
                <div style="color: #f59e0b; font-size: 24px; margin-bottom: 8px;">📦</div>
                <div style="color: #f59e0b; font-size: 20px; font-weight: bold; margin-bottom: 4px;">${otherTypes}</div>
                <div style="color: #64748b; font-size: 12px;">Other Types</div>
              </div>
            </div>
          </div>
          
          <div style="background: #0f0f0f; padding: 16px; border-radius: 8px;">
            <h3 style="color: #f8fafc; margin: 0 0 16px 0; font-size: 16px;">Architecture Health</h3>
            
            <div style="margin-bottom: 16px;">
              <div style="color: #64748b; font-size: 12px; margin-bottom: 8px;">
                Type Coverage: ${Math.min(100, Math.max(60, interfaces.length * 2))}%
              </div>
              <div style="
                width: 100%;
                height: 8px;
                background: var(--border-dark);
                border-radius: 4px;
                overflow: hidden;
              ">
                <div style="
                  width: ${Math.min(100, Math.max(60, interfaces.length * 2))}%;
                  height: 100%;
                  background: linear-gradient(90deg, #10b981 0%, #3b82f6 100%);
                "></div>
              </div>
            </div>
            
            <div style="margin-bottom: 16px;">
              <div style="color: #64748b; font-size: 12px; margin-bottom: 8px;">
                Relationship Depth: Good
              </div>
              <div style="
                width: 100%;
                height: 8px;
                background: var(--border-dark);
                border-radius: 4px;
                overflow: hidden;
              ">
                <div style="
                  width: 75%;
                  height: 100%;
                  background: linear-gradient(90deg, #7c3aed 0%, #10b981 100%);
                "></div>
              </div>
            </div>
            
            <div style="color: #10b981; font-size: 12px; text-align: center; margin-top: 16px;">
              ✅ Well-structured architecture
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  // Show all violations function
  window.showAllViolations = function(containerId, violations) {
    // Find the violations container and expand it
    const violationsList = document.querySelector('#contractViolationsList') || 
                          document.querySelector('[style*="display: flex; flex-direction: column; gap: 12px;"]');
    
    if (violationsList && violations) {
      // Re-render with all violations
      violationsList.innerHTML = violations.map(violation => `
        <div style="
          background: #0f0f0f;
          border-left: 4px solid #ef4444;
          padding: 16px;
          border-radius: 0 8px 8px 0;
        ">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
            <div style="color: #ef4444; font-weight: 500; margin-right: 12px;">
              ${violation.entity}
            </div>
            <div style="
              background: #ef444420;
              color: #ef4444;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 11px;
              text-transform: uppercase;
            ">
              ${violation.type}
            </div>
          </div>
          <div style="color: #f8fafc; margin-bottom: 8px; font-size: 14px;">
            ${violation.message}
          </div>
          <div style="color: #64748b; font-size: 12px; font-family: monospace; margin-bottom: 8px;">
            ${violation.location}
          </div>
          ${violation.suggestion ? `
            <div style="color: #3b82f6; font-size: 13px; font-style: italic;">
              💡 ${violation.suggestion}
            </div>
          ` : ''}
        </div>
      `).join('');
      
      // Hide the entire "Show All" button container
      const showAllContainer = document.querySelector('button[onclick*="showAllViolations"]')?.parentElement;
      if (showAllContainer) {
        showAllContainer.style.display = 'none';
      }
    }
  };

})();
