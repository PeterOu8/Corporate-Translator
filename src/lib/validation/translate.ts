import { z } from 'zod';

export const MAX_INPUT_LENGTH = 500;

export const translationSchema = z
  .object({
    text: z
      .string()
      .trim()
      .min(1, 'Please enter text.')
      .max(
        MAX_INPUT_LENGTH,
        `Maximum ${MAX_INPUT_LENGTH.toLocaleString('en-US')} characters.`,
      ),

    mode: z.enum(['corporate', 'reverse']),

    style: z.enum(['professional', 'startup founder', 'recruiter']),

    intensity: z.number().int().min(1).max(5),
  })
  .strict();

export type TranslationInput = z.infer<typeof translationSchema>;
