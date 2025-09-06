// Refactoring Impact Analysis View Component
class RefactoringAnalysisView {
  constructor(containerId) {
    this.containerId = containerId;
  }

  async render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    container.innerHTML = `
      <div style="padding: 20px;">
        <!-- Header -->
        <div style="margin-bottom: 32px;">
          <h2 style="color: #f8fafc; margin: 0 0 8px 0; display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 32px;">🔧</span>
            Refactoring Impact Analysis
          </h2>
          <p style="color: #94a3b8; margin: 0;">
            Analyze codebase impact before making changes. See exactly what files will be affected, 
            risk levels, and get step-by-step execution plans for safe refactoring.
          </p>
        </div>

        <!-- Control Panel -->
        <div style="background: #1a1a1a; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #333;">
          <h3 style="color: #f8fafc; margin: 0 0 16px 0;">Refactoring Controls</h3>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div>
              <label style="color: #94a3b8; font-size: 14px; display: block; margin-bottom: 8px;">From (current name):</label>
              <input id="fromField" type="text" placeholder="e.g. meal_type" style="
                width: 100%; padding: 8px 12px; background: #2d2d2d; border: 1px solid #444;
                border-radius: 6px; color: #f8fafc; font-size: 14px;
              " />
            </div>
            <div>
              <label style="color: #94a3b8; font-size: 14px; display: block; margin-bottom: 8px;">To (new name):</label>
              <input id="toField" type="text" placeholder="e.g. type" style="
                width: 100%; padding: 8px 12px; background: #2d2d2d; border: 1px solid #444;
                border-radius: 6px; color: #f8fafc; font-size: 14px;
              " />
            </div>
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="color: #94a3b8; font-size: 14px; display: block; margin-bottom: 8px;">Entity (optional):</label>
            <input id="entityField" type="text" placeholder="e.g. MealRecord" style="
              width: 100%; padding: 8px 12px; background: #2d2d2d; border: 1px solid #444;
              border-radius: 6px; color: #f8fafc; font-size: 14px;
            " />
          </div>
          
          <button id="runRefactoringBtn" onclick="runCustomRefactoringAnalysis()" style="
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            color: white; border: none; padding: 12px 24px;
            border-radius: 8px; cursor: pointer; font-size: 14px;
            font-weight: 600; transition: transform 0.2s; width: 100%;
          " onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
            🔧 Analyze Refactoring Impact
          </button>
        </div>

        <!-- Results Container -->
        <div id="refactoringResults">
          <div style="background: #0f0f0f; border-radius: 8px; padding: 40px; text-align: center; border: 1px solid #333;">
            <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
            <h3 style="color: #f8fafc; margin: 0 0 8px 0;">Ready to Analyze</h3>
            <p style="color: #94a3b8; margin: 0;">
              Click "Analyze Impact" to see refactoring suggestions for current violations
            </p>
          </div>
        </div>

        <!-- Test Section -->
        <div style="margin-top: 32px; padding: 20px; background: #0a0a0a; border-radius: 8px; border: 1px solid #333;">
          <h4 style="color: #f8fafc; margin: 0 0 12px 0;">🧪 Test the System</h4>
          <p style="color: #94a3b8; margin: 0 0 16px 0; font-size: 14px;">
            Want to see the refactoring analysis in action? Add a test violation:
          </p>
          <div style="display: flex; gap: 12px; align-items: center;">
            <button onclick="addTestViolation()" style="
              background: #374151; color: #f8fafc; border: 1px solid #6b7280;
              padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px;
            ">
              Add Test Violation
            </button>
            <button onclick="removeTestViolation()" style="
              background: #1f2937; color: #94a3b8; border: 1px solid #4b5563;
              padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px;
            ">
              Remove Test Violation
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

// Analysis Functions
async function runFullRefactoringAnalysis() {
  const btn = document.getElementById('runRefactoringBtn');
  const resultsDiv = document.getElementById('refactoringResults');
  
  if (!btn || !resultsDiv) return;
  
  // Show loading state
  btn.disabled = true;
  btn.innerHTML = '⏳ Analyzing...';
  resultsDiv.innerHTML = `
    <div style="background: #0f0f0f; border-radius: 8px; padding: 40px; text-align: center; border: 1px solid #333;">
      <div style="font-size: 48px; margin-bottom: 16px;">⏳</div>
      <h3 style="color: #f8fafc; margin: 0 0 8px 0;">Analyzing Codebase</h3>
      <p style="color: #94a3b8; margin: 0;">
        Scanning for contract violations and calculating impact...
      </p>
    </div>
  `;
  
  try {
    const response = await fetch('/api/refactoring-analysis');
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    resultsDiv.innerHTML = renderRefactoringResults(data);
  } catch (error) {
    console.error('Refactoring analysis failed:', error);
    resultsDiv.innerHTML = `
      <div style="background: #1a0a0a; border-radius: 8px; padding: 40px; text-align: center; border: 1px solid #ef4444;">
        <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
        <h3 style="color: #ef4444; margin: 0 0 8px 0;">Analysis Failed</h3>
        <p style="color: #94a3b8; margin: 0;">
          ${error.message}
        </p>
      </div>
    `;
  } finally {
    // Reset button
    btn.disabled = false;
    btn.innerHTML = '🔧 Analyze Impact';
  }
}

function renderRefactoringResults(data) {
  if (!data.suggestions || data.suggestions.length === 0) {
    return `
      <div style="background: #0a1a0a; border-radius: 8px; padding: 40px; text-align: center; border: 1px solid #10b981;">
        <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
        <h3 style="color: #10b981; margin: 0 0 8px 0;">No Refactoring Needed</h3>
        <p style="color: #94a3b8; margin: 0;">
          All contract violations appear to be resolved! Your codebase is in good shape.
        </p>
        <div style="margin-top: 16px; padding: 12px; background: #064e3b; border-radius: 6px;">
          <p style="color: #6ee7b7; margin: 0; font-size: 14px;">
            💡 Try adding a test violation to see the refactoring analysis in action
          </p>
        </div>
      </div>
    `;
  }
  
  const { suggestions, totalImpact } = data;
  
  return `
    <!-- Success Header -->
    <div style="background: #0a1a0a; border-radius: 8px; padding: 24px; margin-bottom: 24px; border: 1px solid #f97316;">
      <div style="display: flex; align-items: center; gap: 16px;">
        <div style="font-size: 48px;">🔧</div>
        <div>
          <h3 style="color: #f97316; margin: 0 0 4px 0;">Impact Analysis Complete</h3>
          <p style="color: #94a3b8; margin: 0;">Found ${suggestions.length} refactoring pattern(s) affecting ${totalImpact.totalFiles} file(s)</p>
        </div>
      </div>
    </div>

    <!-- Impact Summary -->
    <div style="background: #0f0f0f; border-radius: 8px; padding: 20px; margin-bottom: 24px; border: 1px solid #333;">
      <h4 style="color: #f8fafc; margin: 0 0 16px 0;">📊 Overall Impact Summary</h4>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
        <div style="background: #1a1a1a; padding: 16px; border-radius: 8px; text-align: center;">
          <div style="color: #f97316; font-size: 24px; font-weight: bold;">${totalImpact.patterns}</div>
          <div style="color: #94a3b8; font-size: 12px; margin-top: 4px;">Refactoring Patterns</div>
        </div>
        <div style="background: #1a1a1a; padding: 16px; border-radius: 8px; text-align: center;">
          <div style="color: #3b82f6; font-size: 24px; font-weight: bold;">${totalImpact.totalFiles}</div>
          <div style="color: #94a3b8; font-size: 12px; margin-top: 4px;">Files Affected</div>
        </div>
        <div style="background: #1a1a1a; padding: 16px; border-radius: 8px; text-align: center;">
          <div style="color: #8b5cf6; font-size: 24px; font-weight: bold;">${totalImpact.totalReferences}</div>
          <div style="color: #94a3b8; font-size: 12px; margin-top: 4px;">Total References</div>
        </div>
        <div style="background: #1a1a1a; padding: 16px; border-radius: 8px; text-align: center;">
          <div style="color: ${totalImpact.highRiskChanges > 0 ? '#ef4444' : '#10b981'}; font-size: 24px; font-weight: bold;">${totalImpact.highRiskChanges}</div>
          <div style="color: #94a3b8; font-size: 12px; margin-top: 4px;">High Risk Changes</div>
        </div>
      </div>
    </div>

    <!-- Refactoring Suggestions -->
    <div>
      <h4 style="color: #f8fafc; margin: 0 0 16px 0;">🔧 Refactoring Suggestions</h4>
      ${suggestions.map(suggestion => renderRefactoringSuggestion(suggestion)).join('')}
    </div>
  `;
}

function renderRefactoringSuggestion(suggestion) {
  const riskColor = {
    'LOW': '#10b981',
    'MEDIUM': '#f59e0b', 
    'HIGH': '#ef4444'
  }[suggestion.riskLevel];
  
  const suggestingId = suggestion.pattern.replace(/[^a-zA-Z0-9]/g, '');
  
  return `
    <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
            <span style="background: ${riskColor}; color: white; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: bold;">
              ${suggestion.riskLevel} RISK
            </span>
            <span style="color: #64748b; font-size: 12px;">
              ${suggestion.estimatedMinutes} min estimated
            </span>
          </div>
          <h5 style="color: #f8fafc; margin: 0; font-size: 16px;">
            ${suggestion.pattern} (${suggestion.entity})
          </h5>
          <div style="color: #94a3b8; font-size: 14px; margin-top: 6px;">
            ${suggestion.totalFiles} files affected • ${suggestion.totalReferences} references to change
          </div>
        </div>
        <button onclick="toggleRefactoringDetails('${suggestingId}')" 
                style="background: #333; color: #f8fafc; border: none; padding: 8px 16px; 
                       border-radius: 6px; cursor: pointer; font-size: 12px;">
          View Details
        </button>
      </div>
      
      <div id="details-${suggestingId}" style="display: none;">
        <!-- Execution Plan -->
        <div style="margin-bottom: 20px;">
          <h6 style="color: #f8fafc; margin: 0 0 12px 0; font-size: 14px; display: flex; align-items: center; gap: 8px;">
            🔄 Execution Plan
          </h6>
          ${suggestion.executionSteps.map((step, idx) => `
            <div style="background: #0f0f0f; padding: 12px; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid ${riskColor};">
              <div style="color: #f8fafc; font-size: 13px; font-weight: 600; margin-bottom: 4px;">
                Step ${step.step}: ${step.description}
              </div>
              <div style="color: #94a3b8; font-size: 11px;">
                Files: ${step.files.join(', ')} • ${step.automated ? '🤖 Automated' : '👤 Manual Review Required'}
              </div>
            </div>
          `).join('')}
        </div>
        
        <!-- Affected Files -->
        <div>
          <h6 style="color: #f8fafc; margin: 0 0 12px 0; font-size: 14px; display: flex; align-items: center; gap: 8px;">
            📁 Affected Files (${suggestion.affectedFiles.length})
          </h6>
          ${suggestion.affectedFiles.slice(0, 8).map(file => `
            <div style="background: #0f0f0f; padding: 10px; border-radius: 6px; margin-bottom: 6px; display: flex; justify-content: between; align-items: center;">
              <div style="flex: 1;">
                <span style="color: #3b82f6; font-family: monospace; font-size: 12px;">${file.path}</span>
                <div style="color: #94a3b8; font-size: 11px; margin-top: 2px;">
                  ${file.references} references • ${file.type} file • ${file.riskLevel} risk
                </div>
              </div>
            </div>
          `).join('')}
          ${suggestion.affectedFiles.length > 8 ? `
            <div style="color: #64748b; font-size: 12px; text-align: center; margin-top: 8px; font-style: italic;">
              ... and ${suggestion.affectedFiles.length - 8} more files
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

function toggleRefactoringDetails(suggestionId) {
  const detailsDiv = document.getElementById(`details-${suggestionId}`);
  
  if (detailsDiv) {
    detailsDiv.style.display = detailsDiv.style.display === 'none' ? 'block' : 'none';
  }
}

// Test functions
async function addTestViolation() {
  try {
    const response = await fetch('/api/test-violation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add' })
    });
    
    if (response.ok) {
      alert('✅ Test violation added! Click "Analyze Impact" to see the refactoring analysis.');
    } else {
      alert('Failed to add test violation. You can manually add {"meal_type": "breakfast"} to golden.examples.json');
    }
  } catch (error) {
    alert('Failed to add test violation. You can manually add {"meal_type": "breakfast"} to golden.examples.json');
  }
}

async function removeTestViolation() {
  alert('To remove test violations, you can manually edit the golden.examples.json file or run the actual fixes.');
}

async function runCustomRefactoringAnalysis() {
  const btn = document.getElementById('runRefactoringBtn');
  const resultsDiv = document.getElementById('refactoringResults');
  const fromField = document.getElementById('fromField');
  const toField = document.getElementById('toField');
  const entityField = document.getElementById('entityField');
  
  if (!btn || !resultsDiv) return;
  
  const fromValue = fromField?.value?.trim();
  const toValue = toField?.value?.trim();
  const entityValue = entityField?.value?.trim() || 'CustomEntity';
  
  if (!fromValue || !toValue) {
    alert('Please enter both "From" and "To" values');
    return;
  }
  
  btn.disabled = true;
  btn.innerHTML = '⏳ Analyzing...';
  resultsDiv.innerHTML = `
    <div style="background: #0f0f0f; border-radius: 8px; padding: 40px; text-align: center; border: 1px solid #333;">
      <div style="font-size: 48px; margin-bottom: 16px;">⏳</div>
      <h3 style="color: #f8fafc; margin: 0 0 8px 0;">Analyzing Refactoring</h3>
      <p style="color: #94a3b8; margin: 0;">
        Analyzing impact of renaming "${fromValue}" to "${toValue}"...
      </p>
    </div>
  `;
  
  try {
    const customViolations = [{
      property: fromValue,
      expected: toValue,
      entity: entityValue,
      file: 'user-input',
      line: 1
    }];
    
    const response = await fetch('/api/custom-refactoring-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ violations: customViolations })
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    
    resultsDiv.innerHTML = renderRefactoringResults(data);
  } catch (error) {
    resultsDiv.innerHTML = `
      <div style="background: #2d1b1b; border-radius: 8px; padding: 40px; text-align: center; border: 1px solid #cc3333;">
        <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
        <h3 style="color: #ff6b6b; margin: 0 0 8px 0;">Analysis Failed</h3>
        <p style="color: #94a3b8; margin: 0;">${error.message}</p>
      </div>
    `;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🔧 Analyze Refactoring Impact';
  }
}

// Export for use
window.RefactoringAnalysisView = RefactoringAnalysisView;
window.runFullRefactoringAnalysis = runFullRefactoringAnalysis;
window.runCustomRefactoringAnalysis = runCustomRefactoringAnalysis;
window.toggleRefactoringDetails = toggleRefactoringDetails;
window.addTestViolation = addTestViolation;
window.removeTestViolation = removeTestViolation;