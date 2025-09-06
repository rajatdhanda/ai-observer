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

        <!-- CRITICAL ACTION BUTTON - VISIBLE TEST -->
        <button id="runRefactoringBtn" onclick="runAdvancedRefactoringAnalysis()" style="
          background: #ff0000 !important; /* BRIGHT RED FOR VISIBILITY */
          color: white !important; border: none !important; 
          padding: 20px 30px !important; font-size: 18px !important;
          font-weight: bold !important; width: 100% !important;
          margin: 20px 0 !important; display: block !important;
          border-radius: 8px !important; cursor: pointer !important;
          z-index: 9999 !important; position: relative !important;
        ">
          🔧 ANALYZE REFACTORING IMPACT - CLICK ME!!!
        </button>

        <!-- Control Panel -->
        <div style="background: #1a1a1a; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #333;">
          <h3 style="color: #f8fafc; margin: 0 0 16px 0;">Real Refactoring Scenarios (80% Coverage)</h3>
          
          <!-- Refactoring Type Selection -->
          <div style="margin-bottom: 20px;">
            <label style="color: #94a3b8; font-size: 14px; display: block; margin-bottom: 8px;">Refactoring Type:</label>
            <select id="refactoringType" onchange="updateRefactoringFields()" style="
              width: 100%; padding: 8px 12px; background: #2d2d2d; border: 1px solid #444;
              border-radius: 6px; color: #f8fafc; font-size: 14px;
            ">
              <option value="rename">🏷️ Rename Property (e.g. meal_type → type)</option>
              <option value="add_column">➕ Add New Column/Field</option>
              <option value="change_type">🔄 Change Data Type (string → number)</option>
              <option value="remove_field">❌ Remove Deprecated Field</option>
              <option value="restructure">🏗️ Restructure Object (nested → flat)</option>
            </select>
          </div>
          
          <!-- Dynamic Fields based on refactoring type -->
          <div id="refactoringFields">
            <!-- Rename fields (default) -->
            <div id="renameFields" style="display: block;">
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div>
                  <label style="color: #94a3b8; font-size: 14px; display: block; margin-bottom: 8px;">Entity/Table:</label>
                  <select id="renameEntityField" style="
                    width: 100%; padding: 8px 12px; background: #2d2d2d; border: 1px solid #444;
                    border-radius: 6px; color: #f8fafc; font-size: 14px;
                  " onchange="populateRenameFieldsDropdown()">
                    <option value="">Select entity</option>
                    <option value="Child">Child</option>
                    <option value="Lead">Lead</option>
                    <option value="User">User</option>
                    <option value="Enrollment">Enrollment</option>
                    <option value="Class">Class</option>
                    <option value="School">School</option>
                    <option value="Activity">Activity</option>
                    <option value="Observation">Observation</option>
                    <option value="ChildProfile">ChildProfile</option>
                    <option value="DailySnapshot">DailySnapshot</option>
                    <option value="MealRecord">MealRecord</option>
                    <option value="MediaAsset">MediaAsset</option>
                    <option value="BookSubscription">BookSubscription</option>
                  </select>
                </div>
                <div>
                  <label style="color: #94a3b8; font-size: 14px; display: block; margin-bottom: 8px;">From (current field):</label>
                  <select id="fromField" style="
                    width: 100%; padding: 8px 12px; background: #2d2d2d; border: 1px solid #444;
                    border-radius: 6px; color: #f8fafc; font-size: 14px;
                  " onchange="showFieldInfo()">
                    <option value="">Select field</option>
                  </select>
                  <div id="fieldInfo" style="margin-top: 8px; font-size: 12px; color: #64748b;"></div>
                </div>
                <div>
                  <label style="color: #94a3b8; font-size: 14px; display: block; margin-bottom: 8px;">To (new name):</label>
                  <input id="toField" type="text" placeholder="e.g. type" style="
                    width: 100%; padding: 8px 12px; background: #2d2d2d; border: 1px solid #444;
                    border-radius: 6px; color: #f8fafc; font-size: 14px;
                  " />
                </div>
              </div>
            </div>
            
            <!-- Add Column fields -->
            <div id="addColumnFields" style="display: none;">
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div>
                  <label style="color: #94a3b8; font-size: 14px; display: block; margin-bottom: 8px;">Entity/Table:</label>
                  <select id="addColumnEntityField" style="
                    width: 100%; padding: 8px 12px; background: #2d2d2d; border: 1px solid #444;
                    border-radius: 6px; color: #f8fafc; font-size: 14px;
                  " onchange="showExistingFields('addColumn')">
                    <option value="">Select entity</option>
                    <option value="Child">Child</option>
                    <option value="Lead">Lead</option>
                    <option value="User">User</option>
                    <option value="Enrollment">Enrollment</option>
                    <option value="Class">Class</option>
                    <option value="School">School</option>
                    <option value="Activity">Activity</option>
                    <option value="Observation">Observation</option>
                    <option value="ChildProfile">ChildProfile</option>
                    <option value="DailySnapshot">DailySnapshot</option>
                    <option value="MealRecord">MealRecord</option>
                    <option value="MediaAsset">MediaAsset</option>
                    <option value="BookSubscription">BookSubscription</option>
                  </select>
                </div>
                <div>
                  <label style="color: #94a3b8; font-size: 14px; display: block; margin-bottom: 8px;">New Field Name:</label>
                  <input id="newFieldName" type="text" placeholder="e.g. enrollment_date" style="
                    width: 100%; padding: 8px 12px; background: #2d2d2d; border: 1px solid #444;
                    border-radius: 6px; color: #f8fafc; font-size: 14px;
                  " />
                </div>
                <div>
                  <label style="color: #94a3b8; font-size: 14px; display: block; margin-bottom: 8px;">Data Type:</label>
                  <select id="newFieldType" style="
                    width: 100%; padding: 8px 12px; background: #2d2d2d; border: 1px solid #444;
                    border-radius: 6px; color: #f8fafc; font-size: 14px;
                  ">
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="date">Date</option>
                    <option value="array">Array</option>
                    <option value="object">Object</option>
                  </select>
                </div>
              </div>
              <div style="margin-bottom: 20px;">
                <label style="color: #94a3b8; font-size: 14px; display: block; margin-bottom: 8px;">Default Value (optional):</label>
                <input id="defaultValue" type="text" placeholder="e.g. null, '', 0, false" style="
                  width: 100%; padding: 8px 12px; background: #2d2d2d; border: 1px solid #444;
                  border-radius: 6px; color: #f8fafc; font-size: 14px;
                " />
              </div>
              <div id="addColumnExistingFields" style="margin-top: 15px; padding: 12px; background: #1a1a1a; border-radius: 6px; border: 1px solid #333; display: none;">
                <label style="color: #64748b; font-size: 13px; display: block; margin-bottom: 8px;">📋 Existing fields in this entity:</label>
                <div id="addColumnFieldsList" style="color: #94a3b8; font-size: 13px; font-family: monospace;"></div>
              </div>
            </div>
            
            <!-- Change Type fields -->
            <div id="changeTypeFields" style="display: none;">
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <div>
                  <label style="color: #94a3b8; font-size: 14px; display: block; margin-bottom: 8px;">Entity/Table:</label>
                  <select id="changeTypeEntityField" style="
                    width: 100%; padding: 8px 12px; background: #2d2d2d; border: 1px solid #444;
                    border-radius: 6px; color: #f8fafc; font-size: 14px;
                  ">
                    <option value="">Select entity</option>
                    <option value="Child">Child</option>
                    <option value="Lead">Lead</option>
                    <option value="User">User</option>
                    <option value="Enrollment">Enrollment</option>
                    <option value="Class">Class</option>
                    <option value="School">School</option>
                    <option value="Activity">Activity</option>
                    <option value="Observation">Observation</option>
                    <option value="ChildProfile">ChildProfile</option>
                    <option value="DailySnapshot">DailySnapshot</option>
                    <option value="MealRecord">MealRecord</option>
                    <option value="MediaAsset">MediaAsset</option>
                    <option value="BookSubscription">BookSubscription</option>
                  </select>
                </div>
                <div>
                  <label style="color: #94a3b8; font-size: 14px; display: block; margin-bottom: 8px;">Field Name:</label>
                  <input id="typeChangeField" type="text" placeholder="e.g. age" style="
                    width: 100%; padding: 8px 12px; background: #2d2d2d; border: 1px solid #444;
                    border-radius: 6px; color: #f8fafc; font-size: 14px;
                  " />
                </div>
                <div>
                  <label style="color: #94a3b8; font-size: 14px; display: block; margin-bottom: 8px;">From Type:</label>
                  <select id="fromType" style="
                    width: 100%; padding: 8px 12px; background: #2d2d2d; border: 1px solid #444;
                    border-radius: 6px; color: #f8fafc; font-size: 14px;
                  ">
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="date">Date</option>
                  </select>
                </div>
                <div>
                  <label style="color: #94a3b8; font-size: 14px; display: block; margin-bottom: 8px;">To Type:</label>
                  <select id="toType" style="
                    width: 100%; padding: 8px 12px; background: #2d2d2d; border: 1px solid #444;
                    border-radius: 6px; color: #f8fafc; font-size: 14px;
                  ">
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="date">Date</option>
                  </select>
                </div>
              </div>
            </div>
            
            <!-- Remove Field fields -->
            <div id="removeFieldFields" style="display: none;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div>
                  <label style="color: #94a3b8; font-size: 14px; display: block; margin-bottom: 8px;">Entity/Table:</label>
                  <select id="removeFieldEntityField" style="
                    width: 100%; padding: 8px 12px; background: #2d2d2d; border: 1px solid #444;
                    border-radius: 6px; color: #f8fafc; font-size: 14px;
                  ">
                    <option value="">Select entity</option>
                    <option value="Child">Child</option>
                    <option value="Lead">Lead</option>
                    <option value="User">User</option>
                    <option value="Enrollment">Enrollment</option>
                    <option value="Class">Class</option>
                    <option value="School">School</option>
                    <option value="Activity">Activity</option>
                    <option value="Observation">Observation</option>
                    <option value="ChildProfile">ChildProfile</option>
                    <option value="DailySnapshot">DailySnapshot</option>
                    <option value="MealRecord">MealRecord</option>
                    <option value="MediaAsset">MediaAsset</option>
                    <option value="BookSubscription">BookSubscription</option>
                  </select>
                </div>
                <div>
                <label style="color: #94a3b8; font-size: 14px; display: block; margin-bottom: 8px;">Field to Remove:</label>
                <input id="removeFieldName" type="text" placeholder="e.g. deprecated_status" style="
                  width: 100%; padding: 8px 12px; background: #2d2d2d; border: 1px solid #444;
                  border-radius: 6px; color: #f8fafc; font-size: 14px;
                " />
              </div>
              <div>
                <label style="color: #e11d48; font-size: 14px; display: block; margin-bottom: 8px;">⚠️ Migration Strategy:</label>
                <select id="migrationStrategy" style="
                  width: 100%; padding: 8px 12px; background: #2d2d2d; border: 1px solid #444;
                  border-radius: 6px; color: #f8fafc; font-size: 14px;
                ">
                  <option value="soft_delete">Soft Delete (mark as deprecated)</option>
                  <option value="data_migration">Migrate data to new field</option>
                  <option value="hard_delete">Hard Delete (⚠️ DATA LOSS)</option>
                </select>
              </div>
            </div>
            
            <!-- Restructure fields -->
            <div id="restructureFields" style="display: none;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div>
                  <label style="color: #94a3b8; font-size: 14px; display: block; margin-bottom: 8px;">Entity/Table:</label>
                  <select id="restructureEntityField" style="
                    width: 100%; padding: 8px 12px; background: #2d2d2d; border: 1px solid #444;
                    border-radius: 6px; color: #f8fafc; font-size: 14px;
                  ">
                    <option value="">Select entity</option>
                    <option value="Child">Child</option>
                    <option value="Lead">Lead</option>
                    <option value="User">User</option>
                    <option value="Enrollment">Enrollment</option>
                    <option value="Class">Class</option>
                    <option value="School">School</option>
                    <option value="Activity">Activity</option>
                    <option value="Observation">Observation</option>
                    <option value="ChildProfile">ChildProfile</option>
                    <option value="DailySnapshot">DailySnapshot</option>
                    <option value="MealRecord">MealRecord</option>
                    <option value="MediaAsset">MediaAsset</option>
                    <option value="BookSubscription">BookSubscription</option>
                  </select>
                </div>
                <div>
                <label style="color: #94a3b8; font-size: 14px; display: block; margin-bottom: 8px;">Object Path:</label>
                <input id="objectPath" type="text" placeholder="e.g. student.personal_info" style="
                  width: 100%; padding: 8px 12px; background: #2d2d2d; border: 1px solid #444;
                  border-radius: 6px; color: #f8fafc; font-size: 14px;
                " />
              </div>
              <div>
                <label style="color: #94a3b8; font-size: 14px; display: block; margin-bottom: 8px;">Restructure Type:</label>
                <select id="restructureType" style="
                  width: 100%; padding: 8px 12px; background: #2d2d2d; border: 1px solid #444;
                  border-radius: 6px; color: #f8fafc; font-size: 14px;
                ">
                  <option value="flatten">Flatten (nested → flat)</option>
                  <option value="nest">Nest (flat → nested)</option>
                  <option value="split">Split object</option>
                  <option value="merge">Merge objects</option>
                </select>
              </div>
            </div>
          </div>
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

// Dynamic field switching for refactoring types
function updateRefactoringFields() {
  const refactoringType = document.getElementById('refactoringType').value;
  
  // Hide all field groups
  document.getElementById('renameFields').style.display = 'none';
  document.getElementById('addColumnFields').style.display = 'none';
  document.getElementById('changeTypeFields').style.display = 'none';
  document.getElementById('removeFieldFields').style.display = 'none';
  document.getElementById('restructureFields').style.display = 'none';
  
  // Show the selected field group
  switch(refactoringType) {
    case 'rename':
      document.getElementById('renameFields').style.display = 'block';
      break;
    case 'add_column':
      document.getElementById('addColumnFields').style.display = 'block';
      break;
    case 'change_type':
      document.getElementById('changeTypeFields').style.display = 'block';
      break;
    case 'remove_field':
      document.getElementById('removeFieldFields').style.display = 'block';
      break;
    case 'restructure':
      document.getElementById('restructureFields').style.display = 'block';
      break;
  }
}

// Advanced refactoring analysis for all 5 scenarios
async function runAdvancedRefactoringAnalysis() {
  const btn = document.getElementById('runRefactoringBtn');
  const resultsDiv = document.getElementById('refactoringResults');
  const refactoringType = document.getElementById('refactoringType').value;
  
  // Get entity based on refactoring type (each has its own entity field)
  let entityValue = '';
  switch(refactoringType) {
    case 'rename':
      entityValue = (document.getElementById('renameEntityField') || {}).value || '';
      break;
    case 'add_column':
      entityValue = (document.getElementById('addColumnEntityField') || {}).value || '';
      break;
    case 'change_type':
      entityValue = (document.getElementById('changeTypeEntityField') || {}).value || '';
      break;
    case 'remove_field':
      entityValue = (document.getElementById('removeFieldEntityField') || {}).value || '';
      break;
    case 'restructure':
      entityValue = (document.getElementById('restructureEntityField') || {}).value || '';
      break;
  }
  entityValue = entityValue.trim();
  
  if (!btn || !resultsDiv) return;
  
  // VALIDATION: Entity is REQUIRED
  if (!entityValue) {
    alert('❌ ERROR: You MUST select which table/entity you want to refactor!\n\nFor example:\n• Adding a column to MealRecord table\n• Renaming a field in Child table\n• Removing a field from User table');
    
    // Focus the appropriate entity field based on refactoring type
    let fieldId = '';
    switch(refactoringType) {
      case 'rename': fieldId = 'renameEntityField'; break;
      case 'add_column': fieldId = 'addColumnEntityField'; break;
      case 'change_type': fieldId = 'changeTypeEntityField'; break;
      case 'remove_field': fieldId = 'removeFieldEntityField'; break;
      case 'restructure': fieldId = 'restructureEntityField'; break;
    }
    
    const field = document.getElementById(fieldId);
    if (field) {
      field.style.borderColor = '#ef4444';
      field.focus();
    }
    return;
  }
  
  let refactoringData;
  
  try {
    // Build refactoring data based on type
    switch(refactoringType) {
      case 'rename':
        const fromValue = document.getElementById('fromField').value.trim();
        const toValue = document.getElementById('toField').value.trim();
        if (!fromValue || !toValue) {
          alert('Please enter both "From" and "To" values for renaming');
          return;
        }
        refactoringData = {
          type: 'rename',
          fromProperty: fromValue,
          toProperty: toValue,
          entity: entityValue
        };
        break;
        
      case 'add_column':
        const newFieldName = document.getElementById('newFieldName').value.trim();
        const newFieldType = document.getElementById('newFieldType').value;
        const defaultValue = document.getElementById('defaultValue').value.trim();
        if (!newFieldName) {
          alert('Please enter the new field name');
          return;
        }
        refactoringData = {
          type: 'add_column',
          fieldName: newFieldName,
          dataType: newFieldType,
          defaultValue: defaultValue || null,
          entity: entityValue
        };
        break;
        
      case 'change_type':
        const typeChangeField = document.getElementById('typeChangeField').value.trim();
        const fromType = document.getElementById('fromType').value;
        const toType = document.getElementById('toType').value;
        if (!typeChangeField) {
          alert('Please enter the field name for type change');
          return;
        }
        refactoringData = {
          type: 'change_type',
          fieldName: typeChangeField,
          fromType: fromType,
          toType: toType,
          entity: entityValue
        };
        break;
        
      case 'remove_field':
        const removeFieldName = document.getElementById('removeFieldName').value.trim();
        const migrationStrategy = document.getElementById('migrationStrategy').value;
        if (!removeFieldName) {
          alert('Please enter the field name to remove');
          return;
        }
        refactoringData = {
          type: 'remove_field',
          fieldName: removeFieldName,
          migrationStrategy: migrationStrategy,
          entity: entityValue
        };
        break;
        
      case 'restructure':
        const objectPath = document.getElementById('objectPath').value.trim();
        const restructureType = document.getElementById('restructureType').value;
        if (!objectPath) {
          alert('Please enter the object path for restructuring');
          return;
        }
        refactoringData = {
          type: 'restructure',
          objectPath: objectPath,
          restructureType: restructureType,
          entity: entityValue
        };
        break;
        
      default:
        alert('Please select a refactoring type');
        return;
    }
    
    btn.disabled = true;
    btn.innerHTML = '⏳ Analyzing...';
    resultsDiv.innerHTML = `
      <div style="background: #0f0f0f; border-radius: 8px; padding: 40px; text-align: center; border: 1px solid #333;">
        <div style="font-size: 48px; margin-bottom: 16px;">⏳</div>
        <h3 style="color: #f8fafc; margin: 0 0 8px 0;">Analyzing ${refactoringType.replace('_', ' ')} Impact</h3>
        <p style="color: #94a3b8; margin: 0;">
          Scanning for ${refactoringType} impacts across your codebase...
        </p>
      </div>
    `;
    
    const response = await fetch('/api/advanced-refactoring-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refactoringData })
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

// Populate fields dropdown for rename when entity is selected - SMART DROPDOWNS
async function populateRenameFieldsDropdown() {
  const entity = document.getElementById('renameEntityField').value;
  const dropdown = document.getElementById('fromField');
  
  if (!entity) {
    dropdown.innerHTML = '<option value="">Select entity first</option>';
    return;
  }
  
  try {
    const response = await fetch('/api/schema-intelligence');
    const data = await response.json();
    
    if (data.entities && data.entities[entity]) {
      const fields = data.entities[entity].fields || [];
      dropdown.innerHTML = '<option value="">Select field</option>' +
        fields.map(f => `<option value="${f}">${f}</option>`).join('');
    } else {
      // Fallback for common fields if entity not found
      dropdown.innerHTML = '<option value="">Select field</option>' +
        '<option value="id">id</option>' +
        '<option value="name">name</option>' +
        '<option value="created_at">created_at</option>' +
        '<option value="updated_at">updated_at</option>';
    }
  } catch (error) {
    dropdown.innerHTML = '<option value="">Error loading fields</option>';
  }
}

// Show field info when selected
function showFieldInfo() {
  const entity = document.getElementById('renameEntityField').value;
  const field = document.getElementById('fromField').value;
  const infoDiv = document.getElementById('fieldInfo');
  
  if (field && entity) {
    infoDiv.innerHTML = `Type: Analyzing ${entity}.${field}...`;
    // In production, would fetch actual type info from schema
    setTimeout(() => {
      infoDiv.innerHTML = `📊 Field: ${field} • Type: string • References: ~10-20 files`;
    }, 200);
  } else {
    infoDiv.innerHTML = '';
  }
}

// Show existing fields when entity is selected (for Add Column scenario)
async function showExistingFields(refactoringType) {
  let entity = '';
  let displayDiv = null;
  let listDiv = null;
  
  if (refactoringType === 'addColumn') {
    entity = document.getElementById('addColumnEntityField').value;
    displayDiv = document.getElementById('addColumnExistingFields');
    listDiv = document.getElementById('addColumnFieldsList');
  }
  
  if (!entity || !displayDiv || !listDiv) {
    if (displayDiv) displayDiv.style.display = 'none';
    return;
  }
  
  try {
    const response = await fetch('/api/schema-intelligence');
    const data = await response.json();
    
    if (data.entities && data.entities[entity]) {
      const fields = data.entities[entity].fields || [];
      if (fields.length > 0) {
        listDiv.innerHTML = fields.map(f => `• ${f}`).join('<br>');
        displayDiv.style.display = 'block';
      } else {
        listDiv.innerHTML = 'No fields found in TypeScript types. Common fields: id, created_at, updated_at';
        displayDiv.style.display = 'block';
      }
    } else {
      // Fallback for common fields
      listDiv.innerHTML = 'Common fields: id, name, created_at, updated_at';
      displayDiv.style.display = 'block';
    }
  } catch (error) {
    listDiv.innerHTML = 'Unable to load fields';
    displayDiv.style.display = 'block';
  }
}

// Export for use
window.RefactoringAnalysisView = RefactoringAnalysisView;
window.runFullRefactoringAnalysis = runFullRefactoringAnalysis;
window.runCustomRefactoringAnalysis = runCustomRefactoringAnalysis;
window.runAdvancedRefactoringAnalysis = runAdvancedRefactoringAnalysis;
window.updateRefactoringFields = updateRefactoringFields;
window.toggleRefactoringDetails = toggleRefactoringDetails;
window.addTestViolation = addTestViolation;
window.removeTestViolation = removeTestViolation;
window.populateRenameFieldsDropdown = populateRenameFieldsDropdown;
window.showFieldInfo = showFieldInfo;
window.showExistingFields = showExistingFields;