import { describe, it, expect, vi, beforeEach } from 'vitest'

let adminDbRef: { collection: (n: string) => { add: ReturnType<typeof vi.fn> } } | null = null
const mockAdd = vi.fn()
const mockCollection = vi.fn(() => ({ add: mockAdd }))
const mockAdminDb = { collection: mockCollection }

vi.mock('@/firebase/admin', () => ({
  get adminDb() {
    return adminDbRef
  },
}))

import { GET, POST } from '@/app/api/tags/route'

describe('tags API - contract', () => {
  beforeEach(() => {
    adminDbRef = null
    mockAdd.mockReset()
  })

  it('503: error key when adminDb is null', async () => {
    adminDbRef = null
    const res = await GET()
    const data = await res.json()
    expect(res.status).toBe(503)
    expect(typeof data.error).toBe('string')
  })

  it('400: Name is required when name is whitespace', async () => {
    adminDbRef = mockAdminDb
    const req = new Request('http://test/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '   ' }),
    })
    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(400)
    expect(data.error).toBe('Name is required')
  })
})
