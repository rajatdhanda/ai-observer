/**
 * Component Loader - Manages all dashboard components
 * Reduces the main HTML file from 4000+ lines to manageable size
 */

import { OverviewComponent } from './overview-component';
import { UnifiedComponent } from './unified-component';
import { TableMappingComponent } from './table-mapping-component';
import { HealthScore } from './health-score';
import { SeverityBadge } from './severity-badge';

export class ComponentLoader {
  static async loadComponent(name: string): Promise<string> {
    try {
      switch(name) {
        case 'overview':
          const overviewData = await OverviewComponent.fetchData();
          return OverviewComponent.render(overviewData);
          
        case 'unified':
          const unifiedData = await UnifiedComponent.fetchData();
          return UnifiedComponent.render(unifiedData);
          
        case 'table-mapping':
          const tableData = await TableMappingComponent.fetchData();
          return TableMappingComponent.render(tableData);
          
        case 'code-quality':
          return this.renderCodeQuality();
          
        case 'contracts':
          return this.renderContracts();
          
        case 'business':
          return this.renderBusinessLogic();
          
        case 'tests':
          return this.renderTests();
          
        default:
          return this.renderNotFound(name);
      }
    } catch (error) {
      console.error(`Failed to load component ${name}:`, error);
      return this.renderError(name, error);
    }
  }
  
  private static renderCodeQuality(): string {
    return `
      <div style="padding: 20px;">
        <h2 style="color: #f8fafc;">Code Quality Analysis</h2>
        <div style="background: #1a1a1a; padding: 16px; border-radius: 8px; margin-top: 16px;">
          <p style="color: #94a3b8;">
            Running TypeScript compiler checks, linting, and code complexity analysis...
          </p>
        </div>
      </div>
    `;
  }
  
  private static renderContracts(): string {
    return `
      <div style="padding: 20px;">
        <h2 style="color: #f8fafc;">Contract Validation</h2>
        <div style="background: #1a1a1a; padding: 16px; border-radius: 8px; margin-top: 16px;">
          <p style="color: #94a3b8;">
            Validating API contracts against database schemas and TypeScript interfaces...
          </p>
        </div>
      </div>
    `;
  }
  
  private static renderBusinessLogic(): string {
    return `
      <div style="padding: 20px;">
        <h2 style="color: #f8fafc;">Business Logic Analysis</h2>
        <div style="background: #1a1a1a; padding: 16px; border-radius: 8px; margin-top: 16px;">
          <p style="color: #94a3b8;">
            Analyzing business rules, data flows, and domain logic consistency...
          </p>
        </div>
      </div>
    `;
  }
  
  private static renderTests(): string {
    return `
      <div style="padding: 20px;">
        <h2 style="color: #f8fafc;">Test Coverage</h2>
        <div style="background: #1a1a1a; padding: 16px; border-radius: 8px; margin-top: 16px;">
          <p style="color: #94a3b8;">
            Analyzing test coverage and running contract validation tests...
          </p>
        </div>
      </div>
    `;
  }
  
  private static renderNotFound(name: string): string {
    return `
      <div style="padding: 20px; text-align: center;">
        <h2 style="color: #ef4444;">Component Not Found</h2>
        <p style="color: #94a3b8; margin-top: 8px;">
          Component "${name}" is not available
        </p>
      </div>
    `;
  }
  
  private static renderError(name: string, error: any): string {
    return `
      <div style="padding: 20px;">
        <div style="background: #7f1d1d; padding: 16px; border-radius: 8px; border: 1px solid #ef4444;">
          <h2 style="color: #fca5a5; margin: 0;">Error Loading Component</h2>
          <p style="color: #fca5a5; margin-top: 8px;">
            Failed to load "${name}": ${error.message || 'Unknown error'}
          </p>
        </div>
      </div>
    `;
  }
}