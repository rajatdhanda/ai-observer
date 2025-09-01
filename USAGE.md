# AI Observer - Universal Project Analyzer

## Overview
AI Observer is a generic tool that can analyze ANY TypeScript/JavaScript project to provide:
- Business logic understanding
- Data flow visualization  
- Type and schema detection
- Error and bottleneck detection
- Real-time monitoring

## Quick Start

### Analyze Current Directory
```bash
npm run observer analyze
```

### Analyze Any Project
```bash
npm run observer analyze /path/to/any/project
npm run observer analyze ../my-other-project
npm run observer analyze ./test-projects/streax
```

## Available Commands

### 1. Full Analysis
Comprehensive project analysis including types, entities, and validation rules:
```bash
npm run observer analyze [project-path]
```

### 2. Business Logic Analysis  
Automatically discovers tables, workflows, hooks, and features:
```bash
npm run observer business [project-path]
```

Output includes:
- Database tables/models
- Business workflows
- Hook usage patterns
- Feature health status
- Business rules

### 3. Data Flow Analysis
Detects bottlenecks, error propagation, and performance issues:
```bash
npm run observer flow [project-path]
```

Identifies:
- N+1 query problems
- Synchronous I/O bottlenecks
- Heavy computation areas
- Critical data paths

### 4. Interactive Dashboard
Visual dashboard with real-time monitoring:
```bash
npm run observer dashboard [project-path]
```

Features:
- Project switcher (select from available projects)
- Real-time error detection
- Business view with feature health
- Data flow visualization
- Bottleneck identification

### 5. Watch Mode
Monitor project changes in real-time:
```bash
npm run observer watch [project-path]
```

## Dashboard Shortcuts

For convenience, you can also use:
```bash
npm run dashboard                    # Uses current directory
npm run dashboard:here              # Explicitly use current directory  
npm run dashboard:streax            # Use test Streax project
```

## How It Works

The tool automatically:
1. **Detects your framework** (Next.js, React, Node.js, etc.)
2. **Extracts type definitions** from TypeScript files
3. **Identifies business entities** (User, Order, Product, etc.)
4. **Maps data flow** across layers (API → Service → Database)
5. **Discovers business logic** patterns and workflows
6. **Generates validation rules** from your code

## Project Requirements

Works with any project that has:
- TypeScript files (`.ts`, `.tsx`)
- JavaScript files (`.js`, `.jsx`)  
- A `tsconfig.json` or `package.json`

## Output Files

Analysis results are saved in the project's `.observer/` directory:
- `analysis.json` - Full project analysis
- `business-analysis.json` - Business logic findings
- `flow-analysis.json` - Data flow and bottlenecks

## Examples

### Analyze a Next.js App
```bash
npm run observer analyze ../my-nextjs-app
npm run observer dashboard ../my-nextjs-app
```

### Analyze a Node.js API
```bash
npm run observer business ~/projects/my-api
npm run observer flow ~/projects/my-api
```

### Compare Multiple Projects
```bash
# Terminal 1
npm run observer dashboard ./project-a

# Terminal 2  
npm run observer dashboard ./project-b
```

## Making It Global (Optional)

To use `observer` command globally:
```bash
npm run build
npm link
# Now use from anywhere:
observer analyze /any/project/path
```

## Best Practices

1. **Start with business analysis** to understand the domain
2. **Check data flow** for performance bottlenecks
3. **Use dashboard** for ongoing monitoring
4. **Run full analysis** before major refactoring

## What Gets Analyzed

- **Tables/Models**: Database schemas, TypeORM entities, Prisma models
- **Business Workflows**: User flows, order processing, authentication
- **Hooks**: React hooks, custom hooks, state management
- **Features**: Grouped functionality with health status
- **Validations**: Zod schemas, validation rules, business rules
- **Data Flow**: API routes, service layers, database queries
- **Errors**: Unhandled errors, try-catch blocks, error boundaries
- **Performance**: Query patterns, computational complexity