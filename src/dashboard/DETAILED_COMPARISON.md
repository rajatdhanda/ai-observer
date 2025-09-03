# Detailed Screenshot Comparison - Enhanced vs Working

## Critical Issues Found

| Feature | Enhanced Dashboard | Working Dashboard | Issue |
|---------|-------------------|-------------------|-------|
| **TABLE PROPERTIES** |
| Properties Display | ✅ Shows all 19 properties with types | ❌ Shows "No properties defined" | Properties not being extracted |
| Property Types | ✅ string, number, union types visible | ❌ Empty | Data not loading |
| **TABLE RELATIONSHIPS** |
| Relationship Display | ✅ "order → belongsTo Professional" | ❌ Not showing | Relationships missing |
| **TABLE USAGE STATS** |
| Hook Count | ✅ Shows "1" for order table | ❌ Shows "0" | Hooks not counted |
| Component Count | ✅ Shows "14" components | ❌ Shows "0" | Components not linked |
| **HOOK DETAILS** |
| Error Location | ✅ Shows file path + line number | ⚠️ No line numbers | Missing file location |
| Contract Violations | ✅ Shows "created_at" vs "createdAt" with line 28 | ✅ Shows violation but no line | Line numbers missing |
| Health Score Display | ✅ Shows "85%" with proper calculation | ⚠️ Shows but wrong calculation | Score calculation off |
| **COMPONENT DETAILS** |
| Health Score | ✅ client-card shows "55%" | ❌ Shows "100%" | Not calculating violations |
| Contract Errors | ✅ Shows 3 contract errors for client-card | ❌ Shows no errors | Violations not mapped |
| Error Details | ✅ "total_visits" vs "totalVisits" line 72 | ❌ Generic message | No real errors shown |
| **PAGES** |
| Nested Display | ✅ "(main) > feed" nested structure | ❌ Flat list | No nesting structure |
| Health Scores | ✅ Shows "25%" for feed page with 5 errors | ❌ Shows "80%" generic | Not calculating |
| Contract Violations | ✅ Shows "is_verified" error at line 30 | ❌ No violations | Not mapped to pages |
| **SIDEBAR** |
| Health Indicators | ✅ Red/orange/green dots | ✅ Has dots | ✅ Working |
| Validation Count | ✅ Shows actual counts | ✅ Shows counts | ✅ Working |
| Component Names | ✅ Shows real names | ✅ Fixed | ✅ Working |
| **DATA FLOW PIPELINE** |
| Active Steps | ✅ Type, Hooks, Components highlighted | ⚠️ Shows but not accurate | Data not accurate |

## Root Causes:

### 1. Properties Not Loading
```javascript
// PROBLEM: Looking in wrong place
const properties = table.properties || [];

// FIX: Should be
const properties = table.properties || table.typeDefinition?.properties || [];
```

### 2. Relationships Missing
```javascript
// Table data has relationships but not being displayed
// Need to check table.relationships array
```

### 3. Line Numbers Missing in Errors
```javascript
// Contract violations have location like "file.ts:28"
// Need to parse and display line number
```

### 4. Components Not Mapped to Tables
```javascript
// Components showing [object Object] or wrong counts
// Need proper extraction from table.components
```

### 5. Pages Not Nested
```javascript
// Enhanced shows "(main) > feed" structure
// Need to parse page paths for nesting
```

## Components to Fix/Update:

### 1. **table-data-extractor.ts** (new, 200 lines)
- Extract properties correctly from typeDefinition
- Parse relationships properly
- Count actual usage in hooks/components

### 2. **validation-mapper.ts** (update existing)
- Parse line numbers from locations
- Map violations to specific components/pages
- Calculate accurate health scores

### 3. **page-hierarchy-builder.ts** (new, 150 lines)
- Parse page paths like "(main) > feed"
- Build nested structure
- Map violations to pages

### 4. **Update working.html**
- Fix property extraction
- Show line numbers in errors
- Display relationships
- Show nested pages

## Action Plan:

1. Fix property extraction from typeDefinition
2. Parse and display line numbers from violation locations
3. Map contract violations to correct components/pages
4. Build page hierarchy from paths
5. Calculate accurate health scores based on real violations
6. Show usage statistics correctly