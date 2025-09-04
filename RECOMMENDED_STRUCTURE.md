# Recommended Project Structure for AI-Powered Code Analysis Tools

Based on the actual working AI Observer codebase (38 files total), here's the proven minimal structure:

## Core Structure (Essential Directories)

```
project/
├── bin/                    # CLI entry point
│   └── ai-observe         # Shell wrapper for CLI
│
├── src/
│   ├── analyzer/          # Code analysis engines (7 files)
│   │   ├── index.ts       # Main analyzer orchestrator
│   │   ├── framework-detector.ts
│   │   ├── type-extractor.ts
│   │   ├── data-flow-mapper.ts
│   │   ├── entity-identifier.ts
│   │   ├── rule-generator.ts
│   │   └── smart-issue-analyzer.ts
│   │
│   ├── validator/         # Validation rules (7 files)
│   │   ├── table-mapper.ts
│   │   ├── nine-rules-validator.ts
│   │   ├── contract-validator.ts
│   │   ├── contract-detector.ts
│   │   ├── boundary-validator.ts
│   │   ├── design-system-validator.ts
│   │   └── version-validator.ts
│   │
│   ├── dashboard/         # Web UI (20 files)
│   │   ├── index.ts       # Express server
│   │   ├── modular-fixed.html
│   │   ├── theme-config.js
│   │   └── components/    # Modular UI components
│   │       ├── index.js   # Component loader
│   │       ├── control-bar.js
│   │       ├── validation-service.js
│   │       ├── smart-analysis-view.js
│   │       ├── entity-data-provider.js
│   │       ├── [viewer components].js
│   │       ├── scripts/   # Business logic
│   │       │   ├── api-client.js
│   │       │   └── data-processor.js
│   │       └── renderers/ # View renderers
│   │           ├── shared-utils.js
│   │           └── [specific renderers].js
│   │
│   ├── cli/              # CLI tools (1 file)
│   │   └── analyze-smart.ts
│   │
│   ├── observer/         # File watching (2 files)
│   │   ├── map-generator.ts
│   │   └── validator-runner.ts
│   │
│   └── utils/            # Shared utilities (1 file)
│       └── remote-logger.ts
│
├── scripts/              # Dev/maintenance scripts
│   ├── test-dashboard-integrity.js
│   ├── smart-cleanup.js
│   └── validate-data.py
│
├── package.json
├── tsconfig.json
├── README.md
└── .gitignore
```

## File Count Breakdown

- **Analyzers**: 7 files (code understanding)
- **Validators**: 7 files (rule enforcement)  
- **Dashboard**: 20 files (15 components, 3 scripts, 2 renderers)
- **CLI**: 1 file (entry point)
- **Observer**: 2 files (file watching)
- **Utils**: 1 file (logging)
- **Total**: 38 source files

## Key Design Principles

### 1. Separation of Concerns
- **Analyzers**: Parse and understand code structure
- **Validators**: Apply business rules and detect issues
- **Dashboard**: Present data without business logic
- **Scripts**: Isolated data processing functions

### 2. Modular Component Loading
- Dashboard dynamically loads components
- Each component is self-contained
- Scripts provide reusable business logic

### 3. Environment-Based Configuration
- Use `OBSERVER_PROJECT_PATH` for project targeting
- No hardcoded paths in source files
- Configuration through environment variables

### 4. Data Flow
```
Code Files → Analyzers → Validators → Dashboard API → UI Components
                ↓            ↓
            .observer/    Issue Buckets
            cache files   (BLOCKERS/STRUCTURAL/COMPLIANCE)
```

## For New Projects Using This Structure

### Essential Files to Copy

1. **Core Analysis** (14 files):
   - All analyzer/*.ts files
   - All validator/*.ts files

2. **Dashboard** (20 files):
   - dashboard/index.ts (server)
   - dashboard/modular-fixed.html (template)
   - dashboard/components/* (all components)

3. **CLI** (3 files):
   - cli/analyze-smart.ts
   - observer/map-generator.ts
   - bin/ai-observe

### Customize for Your Domain

1. **Validators**: Replace with domain-specific rules
   - E.g., replace `nine-rules-validator` with your business rules
   - Keep contract-validator for type safety

2. **Analyzers**: Adapt to your framework
   - Keep framework-detector.ts
   - Modify entity-identifier for your entities

3. **Dashboard Components**: Keep structure, change content
   - Reuse component loader pattern
   - Replace viewers with domain-specific views

## Data Quality Checklist

✅ **Current Status**:
- All 38 files are actively used
- No duplicate functionality
- Clear separation between analysis and presentation
- Modular architecture allows easy extension
- Dashboard correctly targets external projects via env vars

## Why 38 Files is Optimal

This is actually quite lean for a full-featured code analysis tool with:
- 7 different analysis engines
- 7 validation rule sets
- Interactive web dashboard with 10+ views
- Real-time file watching
- CLI interface
- Issue categorization and prioritization

Each file has a specific purpose and removing any would break functionality. The structure follows the Unix philosophy: each component does one thing well.