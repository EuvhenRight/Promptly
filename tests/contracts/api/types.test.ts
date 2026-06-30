/**
 * Contract tests: assert API behavior (status codes + response shape).
 * Complements integration tests - these focus purely on the contract.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

let adminDbRef: { collection: (n: string) => { add: ReturnType<typeof vi.fn>; get: () => Promise<{ docs: unknown[] }> } } | null = null
const mockAdd = vi.fn()
const mockCollection = vi.fn(() => ({
  add: mockAdd,
  get: () => Promise.resolve({ docs: [] }),
}))
const mockAdminDb = { collection: mockCollection }

vi.mock('@/firebase/admin', () => ({
  get adminDb() {
    return adminDbRef
  },
}))

import { GET, POST } from '@/app/api/types/route'

describe('types API - contract (status + body shape)', () => {
  beforeEach(() => {
    adminDbRef = null
    mockAdd.mockReset()
  })

  it('503: error key is string', async () => {
    adminDbRef = null
    const res = await GET()
    const data = await res.json()
    expect(res.status).toBe(503)
    expect(typeof data.error).toBe('string')
    expect(data.error.length).toBeGreaterThan(0)
  })

  it('400: error key is "Name is required" when name is only whitespace', async () => {
    adminDbRef = mockAdminDb
    const req = new Request('http://test/api/types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '   ' }),
    })
    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(400)
    expect(data.error).toBe('Name is required')
  })

  it('500: error key exists', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    adminDbRef = mockAdminDb
    mockAdd.mockRejectedValueOnce(new Error('Simulated failure'))
    const req = new Request('http://test/api/types', {
      method: 'POST',
      body: JSON.stringify({ name: 'Valid' }),
    })
    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(500)
    expect(data).toHaveProperty('error')
    consoleSpy.mockRestore()
  })
})
