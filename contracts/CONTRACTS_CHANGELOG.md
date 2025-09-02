# Contracts Changelog

All notable changes to contract schemas will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Migration Policy
- Breaking changes require a new version (V1 → V2)
- Provide migration adapters for all breaking changes
- Deprecation period: minimum 30 days
- Old versions must work during transition

---

## [Unreleased]

### Professional V2 - 2024-03-01
#### Breaking Changes
- **Added** `licenseNumber` (string, required) - Professional license for compliance
- **Added** `certifications` (array, required) - Professional certifications list
- **Added** `rating` (number, 0-5) - Customer rating score
- **Expanded** `professionType` enum - Added 'nail_technician' and 'esthetician'

#### Migration Guide
```typescript
import { toProfessionalV2 } from './professional.v2.schema';

// Migrate V1 data to V2
const v2Data = toProfessionalV2(v1Data);
// Note: licenseNumber defaults to 'PENDING-VERIFICATION'
```

#### Deprecation Notice
- ProfessionalV1 will be deprecated on **2024-04-01**
- All consumers must migrate by this date

---

## [2.0.0] - 2024-02-15

### Order V2
#### Breaking Changes
- **Changed** `userId` from number to string (UUID format)
- **Added** `trackingNumber` (string, optional)
- **Added** `estimatedDelivery` (datetime, optional)
- **Removed** `legacyOrderId` field

#### Migration Guide
```typescript
import { toOrderV2 } from './order.v2.schema';

const v2Order = toOrderV2(v1Order);
// userId will be converted: number → string
```

---

## [1.5.0] - 2024-02-01

### Post V1.1
#### Non-Breaking Changes
- **Added** `editHistory` (array, optional) - Track post edits
- **Added** `viewCount` (number, optional) - Analytics tracking

---

## [1.0.0] - 2024-01-15

### Initial Release
#### Schemas Created
- ProfessionalV1
- PostV1
- LiveSessionV1
- ProductV1
- OrderV1
- BookingV1
- PaymentV1

---

## Version Naming Convention

### Major Version (Breaking Changes)
- V1 → V2: Breaking changes requiring migration
- Examples: Required fields added, type changes, field removals

### Minor Version (Backward Compatible)
- V1.1, V1.2: Optional fields added
- Examples: New optional fields, expanded enums (if optional)

### Patch Version (Fixes)
- V1.0.1: Documentation or validation fixes
- No schema structure changes

---

## Validation Rules

1. **Never edit existing versions** - Create new version for breaking changes
2. **Always provide adapters** - toProfessionalV2() for forward migration
3. **Document deprecation dates** - Minimum 30 days notice
4. **Test with fixtures** - Each version needs test fixtures
5. **Tag releases** - Git tag when deploying new versions

---

## Emergency Rollback Procedure

If a new version causes production issues:

1. Keep V1 validation active (don't remove)
2. Use backward adapter: `toProfessionalV1(v2Data)`
3. Log which services are still on V1
4. Extend deprecation date if needed

---

## Current Active Versions

| Schema | Active Versions | Primary | Deprecating |
|--------|----------------|---------|-------------|
| Professional | V1, V2 | V2 | V1 (2024-04-01) |
| Order | V2 | V2 | - |
| Post | V1 | V1 | - |
| LiveSession | V1 | V1 | - |
| Product | V1 | V1 | - |
| Booking | V1 | V1 | - |
| Payment | V1 | V1 | - |