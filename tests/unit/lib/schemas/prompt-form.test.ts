import { describe, it, expect } from 'vitest'
import { promptFormSchema } from '@/app/admin/prompts/new/prompt-form'

describe('promptFormSchema', () => {
  it('validates valid input', () => {
    const result = promptFormSchema.safeParse({
      title: 'My Prompt',
      description: 'A test prompt',
      price: 5,
      categoryId: 'cat1',
      privateContent: 'This is the private content for the prompt.',
    })
    expect(result.success).toBe(true)
  })

  it('fails when title is too short', () => {
    const result = promptFormSchema.safeParse({
      title: 'ab',
      categoryId: 'cat1',
      privateContent: 'Private content here.',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message === 'Title must be at least 3 characters long.')).toBe(true)
    }
  })

  it('fails when categoryId is empty', () => {
    const result = promptFormSchema.safeParse({
      title: 'My Prompt',
      categoryId: '',
      privateContent: 'Private content here.',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message === 'Please select a category.')).toBe(true)
    }
  })

  it('fails when privateContent is too short', () => {
    const result = promptFormSchema.safeParse({
      title: 'My Prompt',
      categoryId: 'cat1',
      privateContent: 'short',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message === 'The private prompt content is required.')).toBe(true)
    }
  })

  it('fails when price is negative', () => {
    const result = promptFormSchema.safeParse({
      title: 'My Prompt',
      categoryId: 'cat1',
      privateContent: 'Private content here.',
      price: -1,
    })
    expect(result.success).toBe(false)
  })

  it('defaults price to 1 when omitted', () => {
    const result = promptFormSchema.safeParse({
      title: 'My Prompt',
      categoryId: 'cat1',
      privateContent: 'Private content here.',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.price).toBe(1)
    }
  })
})
