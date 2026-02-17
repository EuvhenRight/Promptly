/**
 * Tags API – same contract as types/categories: GET/POST, 503/400/500/200.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockAdd = vi.fn().mockResolvedValue({ id: 'mock-id-123' })
const mockDocs = [
  { id: '1', data: () => ({ name: 'ChatGPT Image' }) },
  { id: '2', data: () => ({ name: 'Midjourney' }) },
]
const mockCollection = vi.fn(() => ({
  add: mockAdd,
  get: () => Promise.resolve({ docs: mockDocs }),
}))
const mockAdminDb = { collection: mockCollection }

let adminDbRef: typeof mockAdminDb | null = null
vi.mock('@/firebase/admin', () => ({
  get adminDb() {
    return adminDbRef
  },
}))

import { GET, POST } from '@/app/api/tags/route'

describe('tags API', () => {
  beforeEach(() => {
    adminDbRef = null
    mockAdd.mockReset().mockResolvedValue({ id: 'mock-id-123' })
    mockCollection.mockClear()
  })

  it('GET returns 503 when adminDb is not initialized', async () => {
    adminDbRef = null
    const res = await GET()
    const data = await res.json()
    expect(res.status).toBe(503)
    expect(data.error).toContain('Firebase Admin')
  })

  it('POST returns 503 when adminDb is not initialized', async () => {
    adminDbRef = null
    const req = new Request('http://test/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'FLUX' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(503)
    expect((await res.json()).error).toBe('Firebase Admin not initialized')
  })

  it('POST returns 400 when name is only whitespace', async () => {
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

  it('POST returns 200 with id when name is valid', async () => {
    adminDbRef = mockAdminDb
    const req = new Request('http://test/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'FLUX' }),
    })
    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data).toMatchObject({ success: true, name: 'FLUX' })
    expect(data.id).toBeDefined()
  })

  it('POST returns 500 when Firestore add throws', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    adminDbRef = mockAdminDb
    mockAdd.mockRejectedValueOnce(new Error('Firestore unavailable'))
    const req = new Request('http://test/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' }),
    })
    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(500)
    expect(data).toHaveProperty('error')
    consoleSpy.mockRestore()
  })
})
