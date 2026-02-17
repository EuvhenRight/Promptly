import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

let adminDbRef: {
  collection: (n: string) => {
    doc: (id: string) => { get: () => Promise<{ exists: boolean }>; update: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> }
  }
} | null = null

const mockGet = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockDoc = vi.fn(() => ({ get: mockGet, update: mockUpdate, delete: mockDelete }))
const mockCollection = vi.fn(() => ({ doc: mockDoc }))
const mockAdminDb = { collection: mockCollection }

vi.mock('@/firebase/admin', () => ({
  get adminDb() {
    return adminDbRef
  },
}))

import { PATCH, DELETE } from '@/app/api/types/[id]/route'

function createPatchRequest(id: string, body: { name: string }): NextRequest {
  return new NextRequest(`http://test/api/types/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function createDeleteRequest(id: string): NextRequest {
  return new NextRequest(`http://test/api/types/${id}`, { method: 'DELETE' })
}

describe('types [id] API', () => {
  beforeEach(() => {
    adminDbRef = null
    mockGet.mockReset()
    mockUpdate.mockReset()
    mockDelete.mockReset()
    mockDoc.mockClear()
  })

  it('PATCH returns 503 when adminDb is null', async () => {
    adminDbRef = null
    const res = await PATCH(createPatchRequest('type1', { name: 'Video' }))
    const data = await res.json()
    expect(res.status).toBe(503)
    expect(data.error).toBe('Firebase Admin not initialized')
  })

  it('PATCH returns 400 when name is missing', async () => {
    adminDbRef = mockAdminDb
    const req = new NextRequest('http://test/api/types/type1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await PATCH(req)
    const data = await res.json()
    expect(res.status).toBe(400)
    expect(data.error).toBe('Body must include name')
  })

  it('PATCH returns 404 when type does not exist', async () => {
    adminDbRef = mockAdminDb
    mockGet.mockResolvedValue({ exists: false })
    const res = await PATCH(createPatchRequest('nonexistent', { name: 'Video' }))
    const data = await res.json()
    expect(res.status).toBe(404)
    expect(data.error).toBe('Type not found')
  })

  it('PATCH returns 200 when type exists', async () => {
    adminDbRef = mockAdminDb
    mockGet.mockResolvedValue({ exists: true })
    mockUpdate.mockResolvedValue(undefined)
    const res = await PATCH(createPatchRequest('type1', { name: 'Video' }) as any)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data).toMatchObject({ success: true, id: 'type1', name: 'Video' })
  })

  it('DELETE returns 503 when adminDb is null', async () => {
    adminDbRef = null
    const res = await DELETE(createDeleteRequest('type1'))
    const data = await res.json()
    expect(res.status).toBe(503)
    expect(data.error).toBe('Firebase Admin not initialized')
  })

  it('DELETE returns 404 when type does not exist', async () => {
    adminDbRef = mockAdminDb
    mockGet.mockResolvedValue({ exists: false })
    const res = await DELETE(createDeleteRequest('nonexistent'))
    const data = await res.json()
    expect(res.status).toBe(404)
    expect(data.error).toBe('Type not found')
  })

  it('DELETE returns 200 when type exists', async () => {
    adminDbRef = mockAdminDb
    mockGet.mockResolvedValue({ exists: true })
    mockDelete.mockResolvedValue(undefined)
    const res = await DELETE(createDeleteRequest('type1'))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data).toMatchObject({ success: true, id: 'type1' })
  })
})
