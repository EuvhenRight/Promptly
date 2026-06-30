/**
 * Solution #2: Layering & mocking at boundaries
 * - Unit tests (tests/unit/) = pure logic, no I/O
 * - Integration tests = API routes with mocked Firebase at the boundary
 *
 * Solution #3: Explicit error path tests
 * - Every failure mode has at least one test (adminDb null, validation, Firestore error)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Firebase admin at the boundary before route is loaded
const mockAdd = vi.fn().mockResolvedValue({ id: 'mock-id-123' })
const mockGet = vi.fn()
const mockDocs = [
  { id: '1', data: () => ({ name: 'Video' }) },
  { id: '2', data: () => ({ name: 'Images' }) },
]
const mockCollection = vi.fn(() => ({
  add: mockAdd,
  get: () => Promise.resolve({ docs: mockDocs }),
}))
const mockAdminDb = { collection: mockCollection }

// Use a mutable ref so we can switch between null and mock per test
let adminDbRef: typeof mockAdminDb | null = null
vi.mock('@/firebase/admin', () => ({
  get adminDb() {
    return adminDbRef
  },
}))

// Import route handlers after mock is applied
import { GET, POST } from '@/app/api/types/route'

describe('types API - Solution #2: mock at boundary', () => {
  beforeEach(() => {
    adminDbRef = null
    mockAdd.mockReset().mockResolvedValue({ id: 'mock-id-123' })
    mockCollection.mockClear()
  })

  describe('Solution #3: explicit error paths', () => {
    it('GET returns 503 when adminDb is not initialized', async () => {
      adminDbRef = null
      const res = await GET()
      const data = await res.json()
      expect(res.status).toBe(503)
      expect(data).toHaveProperty('error')
      expect(data.error).toContain('Firebase Admin')
    })

    it('POST returns 503 when adminDb is not initialized', async () => {
      adminDbRef = null
      const req = new Request('http://test/api/types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Video' }),
      })
      const res = await POST(req)
      const data = await res.json()
      expect(res.status).toBe(503)
      expect(data.error).toBe('Firebase Admin not initialized')
    })

    it('POST returns 400 when name is only whitespace', async () => {
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

    it('POST returns 200 with id when name is valid', async () => {
      adminDbRef = mockAdminDb
      const req = new Request('http://test/api/types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Video' }),
      })
      const res = await POST(req)
      const data = await res.json()
      expect(res.status).toBe(200)
      expect(data).toMatchObject({ success: true, name: 'Video' })
      expect(data.id).toBeDefined()
    })

    it('POST returns 500 when Firestore add throws', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      adminDbRef = mockAdminDb
      mockAdd.mockRejectedValueOnce(new Error('Firestore unavailable'))
      const req = new Request('http://test/api/types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Video' }),
      })
      const res = await POST(req)
      const data = await res.json()
      expect(res.status).toBe(500)
      expect(data).toHaveProperty('error')
      consoleSpy.mockRestore()
    })
  })

  describe('Contract: response shape (Solution #1)', () => {
    it('400 response has error key and status 400', async () => {
      adminDbRef = mockAdminDb
      const req = new Request('http://test/api/types', {
        method: 'POST',
        body: JSON.stringify({ name: '   ' }),
      })
      const res = await POST(req)
      const data = await res.json()
      expect(res.status).toBe(400)
      expect(data).toHaveProperty('error')
      expect(typeof data.error).toBe('string')
    })

    it('503 response has error key', async () => {
      adminDbRef = null
      const res = await GET()
      const data = await res.json()
      expect(res.status).toBe(503)
      expect(data).toHaveProperty('error')
    })

    it('500 response has error key', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      adminDbRef = mockAdminDb
      mockAdd.mockRejectedValueOnce(new Error('DB error'))
      const req = new Request('http://test/api/types', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' }),
      })
      const res = await POST(req)
      const data = await res.json()
      expect(res.status).toBe(500)
      expect(data).toHaveProperty('error')
      consoleSpy.mockRestore()
    })
  })
})
