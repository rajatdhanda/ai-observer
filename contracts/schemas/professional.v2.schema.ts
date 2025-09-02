import { z } from 'zod';
import type { ProfessionalV1 } from './professional.v1.schema';

/**
 * Professional Contract V2
 * Breaking changes:
 * - Added: licenseNumber (required)
 * - Added: certifications array
 * - Changed: professionType enum expanded
 * - Added: rating field
 */
export const ProfessionalV2Schema = z.object({
  id: z.string(),
  email: z.string().email(),
  phone: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  name: z.string(),
  username: z.string(),
  avatarUrl: z.string().url().optional(),
  location: z.string().optional(),
  // BREAKING: Expanded enum
  professionType: z.enum([
    'hair_stylist', 
    'colorist', 
    'makeup_artist', 
    'barber',
    'nail_technician', // NEW
    'esthetician'      // NEW
  ]),
  salonName: z.string().optional(),
  isVerified: z.boolean(),
  isActive: z.boolean(),
  yearsOfExperience: z.number().positive().optional(),
  specializations: z.array(z.string()).optional(),
  
  // NEW REQUIRED FIELDS (Breaking changes)
  licenseNumber: z.string().min(1),
  certifications: z.array(z.object({
    name: z.string(),
    issuer: z.string(),
    dateIssued: z.string().datetime(),
    expiryDate: z.string().datetime().optional()
  })),
  rating: z.number().min(0).max(5).default(0)
});

// Type inference
export type ProfessionalV2 = z.infer<typeof ProfessionalV2Schema>;

// Database mapper for V2
export const DatabaseProfessionalV2Mapper = z.object({
  id: z.string(),
  email: z.string(),
  phone: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  name: z.string(),
  username: z.string(),
  avatar_url: z.string().optional(),
  location: z.string().optional(),
  profession_type: z.string(),
  salon_name: z.string().optional(),
  is_verified: z.boolean(),
  is_active: z.boolean(),
  years_of_experience: z.number().optional(),
  specializations: z.any().optional(),
  license_number: z.string(),
  certifications: z.any(),
  rating: z.number()
}).transform((data) => ({
  id: data.id,
  email: data.email,
  phone: data.phone,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
  name: data.name,
  username: data.username,
  avatarUrl: data.avatar_url,
  location: data.location,
  professionType: data.profession_type as any,
  salonName: data.salon_name,
  isVerified: data.is_verified,
  isActive: data.is_active,
  yearsOfExperience: data.years_of_experience,
  specializations: data.specializations,
  licenseNumber: data.license_number,
  certifications: data.certifications,
  rating: data.rating
}));

/**
 * Migration adapter from V1 to V2
 * Provides defaults for new required fields
 */
export function toProfessionalV2(v1: ProfessionalV1): ProfessionalV2 {
  return {
    ...v1,
    // Provide defaults for new required fields
    licenseNumber: 'PENDING-VERIFICATION',
    certifications: [],
    rating: 0,
    // Type assertion needed for expanded enum
    professionType: v1.professionType as ProfessionalV2['professionType']
  };
}

/**
 * Backward adapter from V2 to V1 (data loss warning!)
 * Only use during transition period
 */
export function toProfessionalV1(v2: ProfessionalV2): ProfessionalV1 {
  // Strip out V2-only fields
  const { licenseNumber, certifications, rating, ...v1Fields } = v2;
  
  // Handle enum narrowing
  const allowedTypes: ProfessionalV1['professionType'][] = 
    ['hair_stylist', 'colorist', 'makeup_artist', 'barber'];
  
  return {
    ...v1Fields,
    professionType: allowedTypes.includes(v2.professionType as any) 
      ? v2.professionType as ProfessionalV1['professionType']
      : 'hair_stylist' // Default fallback
  };
}

// Validation function
export function validateProfessionalV2(data: unknown, fromDatabase: boolean = false) {
  const schema = fromDatabase ? DatabaseProfessionalV2Mapper : ProfessionalV2Schema;
  return schema.parse(data); // Fails loudly on mismatch
}

// Deprecation notice
export const DEPRECATION_DATE = '2024-04-01';
export const DEPRECATION_MESSAGE = `ProfessionalV1 will be deprecated on ${DEPRECATION_DATE}. Please migrate to V2.`;