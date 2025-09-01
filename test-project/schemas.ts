import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email()
});

export const DailyLogSchema = z.object({
  id: z.string(),
  photos: z.array(z.string()),
  meals: z.object({
    breakfast: z.string(),
    lunch: z.string(),
    snack: z.string()
  }),
  teacherNote: z.string().optional()
});

export type User = z.infer<typeof UserSchema>;
export type DailyLog = z.infer<typeof DailyLogSchema>;