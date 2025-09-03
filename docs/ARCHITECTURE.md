# AI Observer Architecture Navigator

## Overview
The Architecture Navigator provides a unified view of your application's health across all architectural layers - Tables, Hooks, Components, API Routes, and Pages.

## Architecture Components

### Server-Side (TypeScript)

#### 1. Dashboard Server (`src/dashboard/index.ts`)
Main HTTP server handling all API endpoints and validation logic.

**Key APIs:**
- `/api/architecture-data?type={hook|component|api|page}` - Returns items with health scores
- `/api/nine-rules` - Code quality validation results
- `/api/contracts` - Contract violation results
- `/api/discover-files?type={type}` - File discovery for architectural elements

**Key Methods:**
```typescript
discoverProjectFiles(type: string): Promise<string[]>
  - Smart file discovery with filtering
  - Excludes: contracts/, tests/, config files, schema files
  - Only includes src/ directory files

getArchitectureData(type: string): Promise<ArchitectureItem[]>
  - Combines file discovery with validation results
  - Calculates accurate health scores
  - Returns comprehensive data for each item

calculateHealthScore(issueCount: number): number
  - Aggressive scoring: 15% deduction per issue
  - Minimum score: 10%
  - Maximum score: 100% (no issues)
```

#### 2. Validation Components (`src/dashboard/components/`)
Reusable validation display components:
- `contract-view.ts` - Contract violation grouping and display
- `enhanced-nine-rules-view.ts` - Code quality issue grouping
- `unified-architecture-view.ts` - Combined validation view

### Client-Side (HTML/JavaScript)

#### Enhanced Dashboard (`src/dashboard/enhanced.html`)

**Key Functions:**
```javascript
populateArchitectureCounts()
  - Fetches data from server APIs
  - Updates sidebar counts
  - Populates clickable lists

selectArchitectureItem(name, type, filePath)
  - Handles item clicks
  - Fetches validation data
  - Renders unified diagnostic view

generateItemDiagnostic(name, type, violations, issues)
  - Creates HTML for diagnostic display
  - Shows health score
  - Displays all validation results
```

## Data Flow

```
User clicks item in sidebar
    ↓
selectArchitectureItem() called
    ↓
Fetch validation data (parallel):
    - /api/nine-rules
    - /api/contracts
    ↓
Filter issues for specific file
    ↓
Generate diagnostic HTML
    ↓
Display in main content area
```

## Health Score Calculation

```
Total Issues = Contract Violations + Code Quality Issues

Health Score = 100 - (Total Issues × 15)
- Minimum: 10%
- Maximum: 100%

Score Ranges:
- 80-100%: Good (green)
- 40-79%: Warning (yellow)
- 10-39%: Error (red)
```

## File Discovery Rules

### Included:
- Files in `src/` directory
- `.ts`, `.tsx`, `.js`, `.jsx` files
- Hooks: `/hooks/` or files starting with `use[A-Z]`
- Components: `/components/` directory
- API Routes: `/api/` directory
- Pages: `/app/` directory with `page.tsx` files

### Excluded:
- `contracts/` directory (schema files)
- `tests/`, `__tests__/` directories
- `.test.`, `.spec.`, `.config.`, `.schema.` files
- `node_modules/`, `.git/`, `dist/`, `build/`
- Hidden directories (starting with `.`)
- Configuration files (package.json, tsconfig.json)

## Validation Integration

The Architecture Navigator integrates three validation systems:

1. **Code Quality (Nine Rules)**
   - Type-Database Alignment
   - Hook-Database Pattern
   - Error Handling Chain
   - Loading States
   - Registry Usage
   - And more...

2. **Contract Violations**
   - Field naming mismatches
   - Type mismatches
   - Missing required fields
   - Incorrect data transformations

3. **Business Logic** (Future)
   - Data flow validation
   - State management checks
   - API contract compliance

## Usage

1. **View Health Overview**: Sidebar shows counts and health indicators
2. **Click for Details**: Select any item to see comprehensive diagnostics
3. **Identify Issues**: View categorized issues with severity levels
4. **Get Solutions**: See specific suggestions for each issue

## Benefits

- **Unified View**: All validation results in one place
- **Accurate Data**: Uses same validation logic as individual tabs
- **Smart Discovery**: Only shows relevant source files
- **Health Tracking**: Visual indicators for quick assessment
- **Actionable Insights**: Specific suggestions for fixes