import { z } from 'zod'

/** Trim first, then require at least one character (so whitespace-only fails). */
export const typeNameSchema = z.object({
  name: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, 'Name is required')),
})

export type TypeNameInput = z.infer<typeof typeNameSchema>

export function validateTypeName(
  input: unknown
): { success: true; name: string } | { success: false; errors: z.ZodError } {
  const result = typeNameSchema.safeParse(input)
  if (result.success) return { success: true, name: result.data.name }
  return { success: false, errors: result.error }
}
