import { z } from 'zod';

/**
 * Professional Contract V1
 * Original version - established baseline
 */
export const ProfessionalV1Schema = z.object({
  id: z.string(),
  email: z.string().email(),
  phone: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  name: z.string(),
  username: z.string(),
  avatarUrl: z.string().url().optional(),
  location: z.string().optional(),
  professionType: z.enum(['hair_stylist', 'colorist', 'makeup_artist', 'barber']),
  salonName: z.string().optional(),
  isVerified: z.boolean(),
  isActive: z.boolean(),
  yearsOfExperience: z.number().positive().optional(),
  specializations: z.array(z.string()).optional()
});

// Type inference
export type ProfessionalV1 = z.infer<typeof ProfessionalV1Schema>;

// Database mapper for V1 (handles snake_case)
export const DatabaseProfessionalV1Mapper = z.object({
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
  specializations: z.any().optional()
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
  specializations: data.specializations
}));

// Validation function
export function validateProfessionalV1(data: unknown, fromDatabase: boolean = false) {
  const schema = fromDatabase ? DatabaseProfessionalV1Mapper : ProfessionalV1Schema;
  return schema.parse(data); // Fails loudly on mismatch
}