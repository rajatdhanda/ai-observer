/**
 * Dashboard Functions - Modular Version
 * This file loads all the split renderer modules
 */

// Note: The individual renderer files will be loaded from HTML directly
// This file contains the remaining functions that haven't been modularized yet

(function() {
  'use strict';

  // Validation View Functions
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
          
          ${window.renderValidationSummary(contractData, nineRulesData)}
          ${window.renderContractViolations(contractData)}
          ${window.renderNineRulesViolations(nineRulesData)}
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

  // Boundaries View Functions  
  window.loadBoundariesView = async function() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
      <div style="padding: 20px;">
        <div style="text-align: center; color: #9ca3af; margin: 40px 0;">
          <div style="font-size: 20px; margin-bottom: 16px;">⟳</div>
          <div>Loading boundary validation...</div>
        </div>
      </div>
    `;
    
    try {
      const response = await fetch('/api/boundaries');
      const data = await response.json();
      
      const critical = data.boundaries?.filter(b => !b.hasValidation) || [];
      
      mainContent.innerHTML = `
        <div style="padding: 20px;">
          <div style="
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 24px;
            color: white;
          ">
            <h1 style="margin: 0 0 8px 0; display: flex; align-items: center; gap: 12px;">
              🛡️ Boundary Validation
            </h1>
            <p style="margin: 0; opacity: 0.9; font-size: 14px;">
              Input validation at system boundaries
            </p>
          </div>
          
          ${window.renderBoundariesSummary(data)}
          ${window.renderCriticalBoundaries(critical)}
          ${window.renderBoundariesByType(data.boundaries)}
        </div>
      `;
    } catch (error) {
      mainContent.innerHTML = `
        <div style="text-align: center; color: #ef4444; margin: 40px 0;">
          <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
          <h2>Error Loading Boundaries</h2>
          <p style="color: #64748b;">Please check your connection and try again.</p>
        </div>
      `;
    }
  };

  window.renderBoundariesSummary = function(data) {
    const coverage = data.coverage || 0;
    const coverageColor = coverage >= 80 ? '#10b981' : coverage >= 50 ? '#f59e0b' : '#ef4444';
    
    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
      ">
        <h3 style="color: #f8fafc; margin: 0 0 20px 0;">📊 Validation Coverage</h3>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
          <div style="text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: ${coverageColor};">${coverage}%</div>
            <div style="color: #64748b; font-size: 14px;">Overall Coverage</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #3b82f6;">${data.boundaries?.length || 0}</div>
            <div style="color: #64748b; font-size: 14px;">Total Boundaries</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #10b981;">${data.boundaries?.filter(b => b.hasValidation).length || 0}</div>
            <div style="color: #64748b; font-size: 14px;">Validated</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #ef4444;">${data.boundaries?.filter(b => !b.hasValidation).length || 0}</div>
            <div style="color: #64748b; font-size: 14px;">Unvalidated</div>
          </div>
        </div>
      </div>
    `;
  };

  window.renderCriticalBoundaries = function(critical) {
    if (!critical || critical.length === 0) return '';
    
    return `
      <div style="
        background: #ef444410;
        border: 1px solid #ef4444;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
      ">
        <h3 style="color: #ef4444; margin: 0 0 16px 0;">⚠️ Critical: Unvalidated Boundaries</h3>
        
        <div style="display: grid; gap: 12px;">
          ${critical.map(boundary => `
            <div style="
              background: #0f0f0f;
              padding: 16px;
              border-radius: 8px;
              border-left: 3px solid #ef4444;
            ">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="color: #f8fafc; font-weight: 500;">${boundary.file}</div>
                  <div style="color: #94a3b8; font-size: 14px; margin-top: 4px;">
                    ${boundary.boundary} - ${boundary.function}
                  </div>
                </div>
                <div style="
                  background: #ef444420;
                  color: #ef4444;
                  padding: 4px 12px;
                  border-radius: 16px;
                  font-size: 12px;
                ">
                  No Validation
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };

  window.renderBoundariesByType = function(boundaries) {
    if (!boundaries || boundaries.length === 0) return '';
    
    const byType = {};
    boundaries.forEach(b => {
      if (!byType[b.boundary]) byType[b.boundary] = [];
      byType[b.boundary].push(b);
    });
    
    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 20px;
      ">
        <h3 style="color: #f8fafc; margin: 0 0 20px 0;">🔍 Boundaries by Type</h3>
        
        ${Object.entries(byType).map(([type, items]) => {
          const validated = items.filter(i => i.hasValidation).length;
          const percentage = Math.round((validated / items.length) * 100);
          const color = percentage >= 80 ? '#10b981' : percentage >= 50 ? '#f59e0b' : '#ef4444';
          
          return `
            <details style="margin-bottom: 16px;">
              <summary style="
                cursor: pointer;
                padding: 16px;
                background: #0f0f0f;
                border-radius: 8px;
                display: flex;
                justify-content: space-between;
                align-items: center;
              ">
                <div style="color: #f8fafc; font-weight: 500;">
                  ${type} (${items.length})
                </div>
                <div style="display: flex; align-items: center; gap: 16px;">
                  <div style="
                    background: ${color}20;
                    color: ${color};
                    padding: 4px 12px;
                    border-radius: 16px;
                    font-size: 12px;
                  ">
                    ${percentage}% validated
                  </div>
                </div>
              </summary>
              
              <div style="padding: 16px;">
                <div style="display: grid; gap: 8px;">
                  ${items.map(item => `
                    <div style="
                      background: #0a0a0a;
                      padding: 12px;
                      border-radius: 6px;
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                    ">
                      <div>
                        <div style="color: #94a3b8; font-size: 13px;">
                          ${item.function}
                        </div>
                        <div style="color: #64748b; font-size: 11px; margin-top: 2px;">
                          ${item.file}
                        </div>
                      </div>
                      ${item.hasValidation ? `
                        <span style="color: #10b981; font-size: 12px;">✓ Validated</span>
                      ` : `
                        <span style="color: #ef4444; font-size: 12px;">⚠️ No validation</span>
                      `}
                    </div>
                  `).join('')}
                </div>
              </div>
            </details>
          `;
        }).join('')}
      </div>
    `;
  };

  // Analytics View Functions
  window.loadAnalyticsView = async function() {
    const mainContent = document.getElementById('mainContent');
    
    mainContent.innerHTML = `
      <div style="padding: 20px;">
        <div style="text-align: center; color: #9ca3af; margin: 40px 0;">
          <div style="font-size: 20px; margin-bottom: 16px;">⟳</div>
          <div>Loading analytics...</div>
        </div>
      </div>
    `;
    
    try {
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
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 24px;
            color: white;
          ">
            <h1 style="margin: 0 0 8px 0;">📈 Analytics Dashboard</h1>
            <p style="margin: 0; opacity: 0.9;">Comprehensive codebase health metrics and insights</p>
          </div>
          
          ${window.renderMetricsOverview(architectureData, contractData, nineRulesData)}
          ${window.renderHealthTrends(architectureData, contractData, nineRulesData)}
          ${window.renderCodeQualityBreakdown(nineRulesData)}
          ${window.renderEntityDistribution(architectureData)}
        </div>
      `;
    } catch (error) {
      mainContent.innerHTML = `
        <div style="text-align: center; color: #ef4444; margin: 40px 0;">
          <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
          <h2>Error Loading Analytics</h2>
          <p style="color: #64748b;">Failed to load analytics data: ${error.message}</p>
        </div>
      `;
    }
  };

  window.renderMetricsOverview = function(architectureData, contractData, nineRulesData) {
    const healthScore = architectureData.healthScore || 0;
    const contractScore = contractData.score || 0;
    const qualityScore = nineRulesData.overallScore || 0;
    const overallScore = Math.round((healthScore + contractScore + qualityScore) / 3);
    
    const config = window.HealthScoringConfig || { thresholds: { healthy: 70, needsAttention: 40 }, colors: { healthy: '#10b981', warning: '#f59e0b', critical: '#ef4444' } };
    const scoreColor = overallScore >= config.thresholds.healthy ? config.colors.healthy : 
                      overallScore >= config.thresholds.needsAttention ? config.colors.warning : config.colors.critical;
    
    const contractTrend = contractScore > 70 ? '📈' : contractScore > 40 ? '➡️' : '📉';
    const qualityTrend = qualityScore > 70 ? '📈' : qualityScore > 40 ? '➡️' : '📉';
    const healthTrend = healthScore > 70 ? '📈' : healthScore > 40 ? '➡️' : '📉';
    
    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 24px;
      ">
        <h2 style="color: #f8fafc; margin: 0 0 20px 0;">🎯 Key Metrics Overview</h2>
        
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
                font-size: 16px;
                font-weight: bold;
                color: #3b82f6;
              ">
                ${contractScore}
              </div>
              <div>
                <div style="color: #f8fafc; font-size: 14px;">${contractData.violations?.length || 0} violations</div>
                <div style="color: #64748b; font-size: 12px;">${contractData.totalChecked || 0} entities checked</div>
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
                font-size: 16px;
                font-weight: bold;
                color: #10b981;
              ">
                ${qualityScore}
              </div>
              <div>
                <div style="color: #f8fafc; font-size: 14px;">${nineRulesData.passedRules || 0}/${nineRulesData.totalRules || 9} rules</div>
                <div style="color: #64748b; font-size: 12px;">${nineRulesData.criticalIssues || 0} critical issues</div>
              </div>
            </div>
          </div>
          
          <div style="background: #0f0f0f; padding: 16px; border-radius: 8px;">
            <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 12px;">
              <h3 style="color: #f59e0b; margin: 0; font-size: 16px;">System Health</h3>
              <span style="font-size: 20px;">${healthTrend}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: #f59e0b20;
                border: 2px solid #f59e0b;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                font-weight: bold;
                color: #f59e0b;
              ">
                ${healthScore}
              </div>
              <div>
                <div style="color: #f8fafc; font-size: 14px;">${architectureData.issueCount || 0} issues</div>
                <div style="color: #64748b; font-size: 12px;">${architectureData.componentCount || 0} components</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  window.renderHealthTrends = function(architectureData, contractData, nineRulesData) {
    const healthScore = architectureData.healthScore || 0;
    const contractScore = contractData.score || 0;
    const qualityScore = nineRulesData.overallScore || 0;
    
    const config = window.HealthScoringConfig || { thresholds: { healthy: 70, needsAttention: 40 } };
    
    window.getHealthStatus = function(score) {
      if (score >= config.thresholds.healthy) return { text: 'Healthy', color: '#10b981', emoji: '🟢' };
      if (score >= config.thresholds.needsAttention) return { text: 'Needs Attention', color: '#f59e0b', emoji: '🟡' };
      return { text: 'Critical', color: '#ef4444', emoji: '🔴' };
    };
    
    const healthStatus = window.getHealthStatus(healthScore);
    const contractStatus = window.getHealthStatus(contractScore);
    const qualityStatus = window.getHealthStatus(qualityScore);
    
    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 24px;
      ">
        <h2 style="color: #f8fafc; margin: 0 0 20px 0;">📊 Health Status</h2>
        
        <div style="display: grid; grid-template-columns: 1fr; gap: 16px;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="width: 120px; color: #94a3b8; font-size: 14px;">Architecture</div>
            <div style="flex: 1; background: #0f0f0f; border-radius: 8px; overflow: hidden; height: 24px; position: relative;">
              <div style="
                width: ${healthScore}%;
                height: 100%;
                background: ${healthStatus.color};
                transition: width 0.5s ease;
              "></div>
              <div style="
                position: absolute;
                left: 12px;
                top: 50%;
                transform: translateY(-50%);
                color: white;
                font-size: 12px;
                font-weight: 500;
              ">
                ${healthScore}%
              </div>
            </div>
            <div style="width: 120px; text-align: right;">
              <span style="color: ${healthStatus.color};">${healthStatus.emoji} ${healthStatus.text}</span>
            </div>
          </div>
          
          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="width: 120px; color: #94a3b8; font-size: 14px;">Contracts</div>
            <div style="flex: 1; background: #0f0f0f; border-radius: 8px; overflow: hidden; height: 24px; position: relative;">
              <div style="
                width: ${contractScore}%;
                height: 100%;
                background: ${contractStatus.color};
                transition: width 0.5s ease;
              "></div>
              <div style="
                position: absolute;
                left: 12px;
                top: 50%;
                transform: translateY(-50%);
                color: white;
                font-size: 12px;
                font-weight: 500;
              ">
                ${contractScore}%
              </div>
            </div>
            <div style="width: 120px; text-align: right;">
              <span style="color: ${contractStatus.color};">${contractStatus.emoji} ${contractStatus.text}</span>
            </div>
          </div>
          
          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="width: 120px; color: #94a3b8; font-size: 14px;">Code Quality</div>
            <div style="flex: 1; background: #0f0f0f; border-radius: 8px; overflow: hidden; height: 24px; position: relative;">
              <div style="
                width: ${qualityScore}%;
                height: 100%;
                background: ${qualityStatus.color};
                transition: width 0.5s ease;
              "></div>
              <div style="
                position: absolute;
                left: 12px;
                top: 50%;
                transform: translateY(-50%);
                color: white;
                font-size: 12px;
                font-weight: 500;
              ">
                ${qualityScore}%
              </div>
            </div>
            <div style="width: 120px; text-align: right;">
              <span style="color: ${qualityStatus.color};">${qualityStatus.emoji} ${qualityStatus.text}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  window.renderCodeQualityBreakdown = function(nineRulesData) {
    const results = nineRulesData.results || [];
    
    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 24px;
      ">
        <h2 style="color: #f8fafc; margin: 0 0 20px 0;">🎯 Code Quality Breakdown</h2>
        
        <div style="display: grid; grid-template-columns: 1fr; gap: 12px;">
          ${results.map((rule, index) => {
            const passed = rule.status === 'pass';
            const color = passed ? '#10b981' : '#ef4444';
            const percentage = rule.score || 0;
            
            return `
              <div style="background: #0f0f0f; padding: 12px 16px; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: ${color}; font-size: 14px;">
                      ${passed ? '✅' : '❌'}
                    </span>
                    <span style="color: #f8fafc; font-size: 14px;">
                      Rule ${index + 1}: ${rule.rule}
                    </span>
                  </div>
                  <span style="
                    background: ${color}20;
                    color: ${color};
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                  ">
                    ${percentage}%
                  </span>
                </div>
                
                <div style="background: #0a0a0a; height: 6px; border-radius: 3px; overflow: hidden;">
                  <div style="
                    width: ${percentage}%;
                    height: 100%;
                    background: ${color};
                    transition: width 0.3s ease;
                  "></div>
                </div>
                
                ${rule.issues && rule.issues.length > 0 ? `
                  <div style="color: #ef4444; font-size: 11px; margin-top: 6px;">
                    ${rule.issues.length} violation${rule.issues.length > 1 ? 's' : ''} found
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  };

  window.renderEntityDistribution = function(architectureData) {
    const entities = {
      'Tables': architectureData.tables?.length || 0,
      'Hooks': architectureData.hooks?.length || 0,
      'Components': architectureData.components?.length || 0,
      'Pages': architectureData.pages?.length || 0,
      'APIs': architectureData.apis?.length || 0
    };
    
    const total = Object.values(entities).reduce((sum, val) => sum + val, 0);
    
    const colors = {
      'Tables': '#ef4444',
      'Hooks': '#3b82f6',
      'Components': '#8b5cf6',
      'Pages': '#10b981',
      'APIs': '#f59e0b'
    };
    
    return `
      <div style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 24px;
      ">
        <h2 style="color: #f8fafc; margin: 0 0 20px 0;">📦 Entity Distribution</h2>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px;">
          ${Object.entries(entities).map(([name, count]) => {
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
            const color = colors[name];
            
            return `
              <div style="
                background: #0f0f0f;
                padding: 16px;
                border-radius: 8px;
                text-align: center;
                border-top: 3px solid ${color};
              ">
                <div style="
                  width: 60px;
                  height: 60px;
                  border-radius: 50%;
                  background: ${color}20;
                  border: 2px solid ${color};
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  margin: 0 auto 12px auto;
                ">
                  <div style="
                    font-size: 18px;
                    font-weight: bold;
                    color: ${color};
                  ">
                    ${count}
                  </div>
                </div>
                <div style="color: #f8fafc; font-size: 14px; margin-bottom: 4px;">
                  ${name}
                </div>
                <div style="color: #64748b; font-size: 12px;">
                  ${percentage}% of total
                </div>
              </div>
            `;
          }).join('')}
        </div>
        
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #333;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="color: #94a3b8; font-size: 14px;">
              Total Entities
            </div>
            <div style="color: #f8fafc; font-size: 20px; font-weight: bold;">
              ${total}
            </div>
          </div>
        </div>
      </div>
    `;
  };

})();