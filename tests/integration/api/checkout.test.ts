/**
 * Checkout API – contract tests for error paths and success path (with mocked Stripe + optional adminDb).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCreate = vi.fn().mockResolvedValue({
  client_secret: 'mock_client_secret',
  id: 'cs_mock',
})
const mockStripe = {
  checkout: {
    sessions: {
      create: mockCreate,
    },
  },
}

vi.mock('@/lib/stripe', () => ({
  getStripe: () => Promise.resolve(mockStripe),
}))

let adminDbRef: { collection: (n: string) => { doc: (id: string) => { get: () => Promise<{ exists: boolean; data: () => Record<string, unknown> }> } } } | null = null
const mockGet = vi.fn().mockResolvedValue({
  exists: true,
  data: () => ({ title: 'Test Prompt', description: '', price: 5, images: [] }),
})
const mockDoc = vi.fn(() => ({ get: mockGet }))
const mockCollection = vi.fn(() => ({ doc: mockDoc }))
const mockAdminDb = { collection: mockCollection }

vi.mock('@/firebase/admin', () => ({
  get adminDb() {
    return adminDbRef
  },
}))

import { POST } from '@/app/api/checkout/route'

describe('checkout API', () => {
  beforeEach(() => {
    adminDbRef = null
    mockCreate.mockClear().mockResolvedValue({
      client_secret: 'mock_client_secret',
      id: 'cs_mock',
    })
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ title: 'Test Prompt', description: '', price: 5, images: [] }),
    })
  })

  it('POST returns 400 when promptId missing and type is prompt (default)', async () => {
    const req = new Request('http://test/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(400)
    expect(data.error).toContain('Missing promptId')
  })

  it('POST returns 400 when type=prompt but no promptId', async () => {
    const req = new Request('http://test/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'prompt' }),
    })
    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(400)
    expect(data.error).toContain('Missing promptId')
  })

  it('POST returns 503 when type=cart and adminDb is not initialized', async () => {
    adminDbRef = null
    const req = new Request('http://test/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'cart', promptIds: ['id1'] }),
    })
    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(503)
    expect(data.error).toContain('Cart checkout')
  })

  it('POST returns 200 with clientSecret for type=credits (no adminDb needed)', async () => {
    const req = new Request('http://test/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'credits', credits: 300 }),
    })
    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data).toHaveProperty('clientSecret')
    expect(data.clientSecret).toBe('mock_client_secret')
    expect(data).toHaveProperty('amountCents')
  })

  it('POST returns 200 with clientSecret for type=plan', async () => {
    const req = new Request('http://test/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'plan', plan: 'starter', billing: 'monthly' }),
    })
    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data).toHaveProperty('clientSecret')
    expect(data.clientSecret).toBe('mock_client_secret')
  })

  it('POST returns 404 when type=prompt and prompt does not exist', async () => {
    adminDbRef = mockAdminDb
    mockGet.mockResolvedValueOnce({ exists: false, data: () => ({}) })
    const req = new Request('http://test/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'prompt', promptId: 'nonexistent' }),
    })
    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(404)
    expect(data.error).toBe('Prompt not found')
  })

  it('POST returns 500 when Stripe create throws', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockCreate.mockRejectedValueOnce(new Error('Stripe API error'))
    const req = new Request('http://test/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'credits', credits: 300 }),
    })
    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(500)
    expect(data).toHaveProperty('error')
    consoleSpy.mockRestore()
  })
})
