import { vi } from 'vitest'

/**
 * Creates a mock Firestore adminDb that can be used for collection().add() and collection().get().
 * Use with vi.mock('@/firebase/admin', () => ({ get adminDb() { return adminDbRef } })).
 */
export function createMockAdminDb() {
  const mockAdd = vi.fn().mockResolvedValue({ id: 'mock-id-123' })
  const mockDocs = [
    { id: '1', data: () => ({ name: 'Item 1' }) },
    { id: '2', data: () => ({ name: 'Item 2' }) },
  ]
  const mockCollection = vi.fn(() => ({
    add: mockAdd,
    get: () => Promise.resolve({ docs: mockDocs }),
  }))
  const mockAdminDb = { collection: mockCollection }
  return { mockAdd, mockCollection, mockDocs, mockAdminDb }
}
