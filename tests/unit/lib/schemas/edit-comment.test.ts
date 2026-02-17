import { describe, it, expect } from 'vitest'
import * as z from 'zod'

const editCommentSchema = z.object({
  text: z.string().optional(),
  rating: z.number().min(1).max(5),
})

describe('editCommentSchema', () => {
  it('validates valid input', () => {
    const result = editCommentSchema.safeParse({ text: 'Good!', rating: 5 })
    expect(result.success).toBe(true)
  })

  it('accepts optional text', () => {
    const result = editCommentSchema.safeParse({ rating: 4 })
    expect(result.success).toBe(true)
  })

  it('fails when rating is below 1', () => {
    const result = editCommentSchema.safeParse({ rating: 0 })
    expect(result.success).toBe(false)
  })

  it('fails when rating is above 5', () => {
    const result = editCommentSchema.safeParse({ rating: 6 })
    expect(result.success).toBe(false)
  })

  it('fails when rating is missing', () => {
    const result = editCommentSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})
