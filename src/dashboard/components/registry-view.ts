/**
 * Registry View Component
 * Shows Routes, QueryKeys, CTAs registries and their usage
 */

export function renderRegistryView(data: any): string {
  if (!data || !data.registryValidation) {
    return `
      <div style="color: #64748b; text-align: center; padding: 40px;">
        <div style="font-size: 48px; margin-bottom: 20px;">📋</div>
        <div style="font-size: 20px; margin-bottom: 10px;">No registry validation available</div>
        <div>Registries help prevent typos in routes, query keys, and CTAs</div>
      </div>
    `;
  }

  const { registries, usage, coverage, score } = data.registryValidation;
  const scoreColor = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

  return `
    <div class="registry-view">
      <!-- Score Header -->
      <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 30px; border-radius: 12px; margin-bottom: 30px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h2 style="font-size: 24px; margin-bottom: 10px;">Registry Validation</h2>
            <div style="color: #94a3b8;">Prevents typos in routes, query keys, and CTAs</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 48px; font-weight: bold; color: ${scoreColor};">${score}%</div>
            <div style="color: #94a3b8;">Registry Score</div>
          </div>
        </div>
      </div>

      <!-- Registry Status -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px;">
        ${renderRegistryCard('Routes', registries.routes)}
        ${renderRegistryCard('QueryKeys', registries.queryKeys)}
        ${renderRegistryCard('CTAs', registries.ctas)}
        ${renderRegistryCard('API Endpoints', registries.apiEndpoints)}
      </div>

      <!-- Coverage Stats -->
      <div class="section" style="margin-bottom: 20px;">
        <h3 style="color: #3b82f6; margin-bottom: 15px;">📊 Coverage Statistics</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">
          <div style="background: #0f172a; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #3b82f6;">${coverage.defined}</div>
            <div style="color: #94a3b8; font-size: 12px;">Defined</div>
          </div>
          <div style="background: #0f172a; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #10b981;">${coverage.used}</div>
            <div style="color: #94a3b8; font-size: 12px;">Used</div>
          </div>
          <div style="background: #0f172a; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #f59e0b;">${coverage.unused.length}</div>
            <div style="color: #94a3b8; font-size: 12px;">Unused</div>
          </div>
          <div style="background: #0f172a; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #ef4444;">${coverage.undefined.length}</div>
            <div style="color: #94a3b8; font-size: 12px;">Undefined</div>
          </div>
        </div>
      </div>

      <!-- Invalid Usages (Hardcoded values) -->
      ${usage.invalid.length > 0 ? `
        <div class="section" style="background: #7f1d1d; border: 2px solid #ef4444; margin-bottom: 20px;">
          <h3 style="color: #fca5a5; margin-bottom: 15px;">
            🚨 Hardcoded Values Found (${usage.invalid.length})
          </h3>
          <div style="max-height: 300px; overflow-y: auto;">
            ${usage.invalid.slice(0, 10).map((item: any) => `
              <div style="background: #991b1b; padding: 12px; border-radius: 6px; margin-bottom: 10px;">
                <div style="color: #fca5a5; font-weight: bold; font-family: monospace;">
                  "${item.value}"
                </div>
                <div style="color: #e2e8f0; font-size: 12px; margin: 5px 0;">
                  📁 ${item.file.split('/').pop()}:${item.line}
                </div>
                <div style="color: #10b981; font-size: 12px;">
                  💡 ${item.suggestion || 'Use registry constant instead'}
                </div>
              </div>
            `).join('')}
            ${usage.invalid.length > 10 ? `
              <div style="color: #fca5a5; text-align: center; padding: 10px;">
                ... and ${usage.invalid.length - 10} more
              </div>
            ` : ''}
          </div>
        </div>
      ` : ''}

      <!-- Potential Typos -->
      ${usage.typos && usage.typos.length > 0 ? `
        <div class="section" style="background: #78350f; border: 1px solid #f59e0b; margin-bottom: 20px;">
          <h3 style="color: #fcd34d; margin-bottom: 15px;">
            ⚠️ Potential Typos (${usage.typos.length})
          </h3>
          <div style="max-height: 200px; overflow-y: auto;">
            ${usage.typos.map((typo: any) => `
              <div style="background: #451a03; padding: 10px; border-radius: 6px; margin-bottom: 8px;">
                <div style="color: #fcd34d;">
                  Found: <span style="font-family: monospace;">"${typo.found}"</span>
                </div>
                <div style="color: #10b981; font-size: 12px;">
                  Did you mean: <span style="font-family: monospace;">"${typo.suggestion}"</span>?
                  (${Math.round(typo.similarity * 100)}% similar)
                </div>
                <div style="color: #94a3b8; font-size: 11px;">
                  📁 ${typo.file.split('/').pop()}:${typo.line}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Registry Definitions -->
      ${registries.routes.found ? `
        <div class="section" style="margin-bottom: 20px;">
          <h3 style="color: #3b82f6; margin-bottom: 15px;">🗺️ Routes Registry</h3>
          <div style="background: #0f172a; padding: 15px; border-radius: 8px;">
            <div style="color: #94a3b8; font-size: 12px; margin-bottom: 10px;">
              📁 ${registries.routes.file || 'Unknown'}
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 8px;">
              ${Array.from(registries.routes.items.entries()).slice(0, 10).map((entry: any) => {
                const [key, item] = entry;
                return `
                <div style="background: #1e293b; padding: 8px; border-radius: 4px; font-family: monospace; font-size: 12px;">
                  <span style="color: #667eea;">${key}</span>: 
                  <span style="color: #10b981;">"${item.value}"</span>
                </div>`;
              }).join('')}
            </div>
            ${registries.routes.items.size > 10 ? `
              <div style="color: #64748b; margin-top: 10px; font-size: 12px;">
                ... and ${registries.routes.items.size - 10} more routes
              </div>
            ` : ''}
          </div>
        </div>
      ` : ''}

      <!-- Recommendation -->
      <div class="section" style="background: #1e3a8a; border: 1px solid #3b82f6;">
        <h3 style="color: #93c5fd; margin-bottom: 15px;">📝 Recommendations</h3>
        <div style="color: #e2e8f0; line-height: 1.8;">
          ${!registries.routes.found ? `
            <div style="margin-bottom: 10px;">
              1. Create <code style="background: #334155; padding: 2px 6px; border-radius: 4px;">/src/constants/routes.ts</code>:
              <pre style="background: #0f172a; padding: 10px; border-radius: 4px; margin-top: 5px; font-size: 12px;">
export const Routes = {
  home: '/',
  profile: '/profile',
  settings: '/settings',
  // ... add all your routes
} as const;</pre>
            </div>
          ` : ''}
          
          ${!registries.queryKeys.found ? `
            <div style="margin-bottom: 10px;">
              2. Create <code style="background: #334155; padding: 2px 6px; border-radius: 4px;">/src/constants/queryKeys.ts</code>:
              <pre style="background: #0f172a; padding: 10px; border-radius: 4px; margin-top: 5px; font-size: 12px;">
export const QueryKeys = {
  users: () => ['users'],
  user: (id: string) => ['users', id],
  posts: () => ['posts'],
  // ... add all your query keys
} as const;</pre>
            </div>
          ` : ''}
          
          <div>
            ${registries.routes.found && registries.queryKeys.found ? '✅' : '3.'} 
            Replace all hardcoded strings with registry constants to prevent typos and improve maintainability.
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderRegistryCard(name: string, registry: any): string {
  const found = registry?.found || false;
  const itemCount = registry?.items?.size || 0;
  
  return `
    <div style="background: ${found ? '#14532d' : '#7f1d1d'}; padding: 20px; border-radius: 12px; border: 1px solid ${found ? '#10b981' : '#ef4444'};">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h4 style="color: #e2e8f0; font-size: 16px;">${name}</h4>
        <span style="font-size: 24px;">${found ? '✅' : '❌'}</span>
      </div>
      ${found ? `
        <div style="color: #86efac;">
          ${itemCount} items defined
        </div>
        <div style="color: #64748b; font-size: 11px; margin-top: 5px;">
          ${registry.file ? `📁 ${registry.file.split('/').pop()}` : 'Location unknown'}
        </div>
      ` : `
        <div style="color: #fca5a5;">
          Not found
        </div>
        <div style="color: #fca5a5; font-size: 11px; margin-top: 5px;">
          Create registry to prevent typos
        </div>
      `}
    </div>
  `;
}