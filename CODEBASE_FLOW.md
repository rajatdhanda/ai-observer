# AI Observer - Codebase Flow & Architecture

## Core Purpose
AI Observer prevents AI-generated code deterioration by detecting drift, validating contracts, and enforcing code standards.

## Key Flows

### 1. Smart Analysis Flow (Primary)
**Entry:** `npm run smart-analyze` or `OBSERVER_PROJECT_PATH=/path/to/project npm run smart-analyze`
**Files:**
- `src/cli/analyze-smart.ts` - Entry point
- `src/analyzer/smart-issue-analyzer.ts` - Core analyzer logic
- `src/validator/nine-rules-validator.ts` - 9 validation rules
- `src/validator/contract-validator.ts` - Contract compliance

**Output:** `.observer/FIX_THIS.json` with bucketed issues:
- BLOCKERS - Critical runtime issues (TypeScript errors, contract violations)
- STRUCTURAL - Architecture issues (error handling, AI drift)  
- COMPLIANCE - Code quality issues (registry usage)

### 2. Dashboard Flow
**Entry:** `npm run dashboard` or `OBSERVER_PROJECT_PATH=/path npm run dashboard`
**Files:**
- `src/dashboard/index.ts` - Express server, serves components
- `src/dashboard/components/smart-analysis-view.js` - Smart analysis UI
- `src/dashboard/components/live-log-panel.js` - Live logs
- `src/dashboard/components/smart-refresh-manager.js` - Auto-refresh

**APIs:**
- `/api/smart-analysis` - Returns FIX_THIS.json data
- `/api/live-logs` - Returns real-time logs
- `/api/run-smart-analysis` - Triggers analysis

### 3. Real-time Observer Flow
**Entry:** `bin/ai-observe` or `./bin/ai-observe --realtime`
**Files:**
- `src/observer/auto-observer.ts` - File watcher
- `src/observer/validator-runner.ts` - Runs validation on changes
- Uses `chokidar` for file monitoring

## Key Components

### Validators (All Active)
1. **Nine Rules Validator** - Core validation rules
2. **Contract Validator** - Entity contract compliance
3. **Table Mapper** - Database table detection
4. **TypeScript Compiler** - Type error detection

### AI Drift Detection (Critical)
- **File Size Warnings** - Files >500 lines (1000 max)
- **Duplicate Functions** - Same function in multiple files
- **Export Completeness** - Missing hook exports

### Data Validation
- `scripts/validate-data.py` - Checks data integrity
- `scripts/analyze-dependencies.py` - Maps file usage

## Environment Variables
- `OBSERVER_PROJECT_PATH` - Target project to analyze (defaults to cwd)

## Output Files
- `.observer/FIX_THIS.json` - Main output for AI consumption
- `.observer/analysis_state.json` - Session tracking
- `.observer/validation_results.json` - Data integrity check
- `.observer/dependency-analysis.json` - File usage map

## Current Statistics
- **Data Integrity:** 66.7% (8/12 checks passing)
- **Total Issues:** 132 in Streax project
- **Distribution:** BLOCKERS(58), STRUCTURAL(35), COMPLIANCE(39)
- **File Usage:** ~24% actively used (needs improvement)

## Critical Files to Maintain
```
src/
├── analyzer/
│   └── smart-issue-analyzer.ts (850 lines - CORE)
├── cli/
│   └── analyze-smart.ts (27 lines - entry)
├── dashboard/
│   ├── index.ts (830 lines - server)
│   └── components/
│       └── smart-analysis-view.js (518 lines - UI)
├── validator/
│   ├── nine-rules-validator.ts (1166 lines - TOO LARGE)
│   └── contract-validator.ts (350 lines)
└── scripts/
    ├── validate-data.py (validation)
    └── analyze-dependencies.py (usage)
```

## Issues to Address
1. **File Size:** nine-rules-validator.ts exceeds 1000 lines
2. **Unused Files:** 76% of files potentially unused
3. **Missing Files:** smart_analysis.json, tables.json, hook-analysis.json

## How AI Should Use This
1. Read `/path/to/project/.observer/FIX_THIS.json`
2. Fix issues in priority order: BLOCKERS → STRUCTURAL → COMPLIANCE
3. Run `python3 scripts/validate-data.py` to verify fixes
4. Keep files under 500 lines for optimal AI context