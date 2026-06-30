import { describe, it, expect } from 'vitest'
import { validateTypeName } from '@/lib/validation/type-name'

describe('validateTypeName - Solution #1: behavior & contracts', () => {
  it('returns success for valid name', () => {
    const result = validateTypeName({ name: 'Video' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.name).toBe('Video')
  })

  it('trims whitespace', () => {
    const result = validateTypeName({ name: '  Images  ' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.name).toBe('Images')
  })

  it('returns errors for empty name', () => {
    const result = validateTypeName({ name: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors.issues.some((i) => i.message === 'Name is required')).toBe(true)
    }
  })

  it('returns errors for invalid input shape', () => {
    const result = validateTypeName({ name: 123 })
    expect(result.success).toBe(false)
  })

  it('returns errors for null', () => {
    const result = validateTypeName(null)
    expect(result.success).toBe(false)
  })

  it('returns errors for whitespace-only name', () => {
    const result = validateTypeName({ name: '   ' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors.issues.some((i) => i.message === 'Name is required')).toBe(true)
    }
  })
})
