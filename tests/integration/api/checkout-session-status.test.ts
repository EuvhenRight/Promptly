/**
 * Checkout session-status API – GET with session_id; 400 when missing, 500 when Stripe fails.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockRetrieve = vi.fn().mockResolvedValue({
  status: 'complete',
  customer_details: { email: 'test@example.com' },
})

vi.mock('@/lib/stripe', () => ({
  getStripe: () =>
    Promise.resolve({
      checkout: {
        sessions: {
          retrieve: mockRetrieve,
        },
      },
    }),
}))

import { GET } from '@/app/api/checkout/session-status/route'

function reqWithSessionId(sessionId: string | null): NextRequest {
  const url = sessionId
    ? `http://test/api/checkout/session-status?session_id=${encodeURIComponent(sessionId)}`
    : 'http://test/api/checkout/session-status'
  return new NextRequest(url)
}

describe('checkout session-status API', () => {
  beforeEach(() => {
    mockRetrieve.mockClear().mockResolvedValue({
      status: 'complete',
      customer_details: { email: 'test@example.com' },
    })
  })

  it('GET returns 400 when session_id is missing', async () => {
    const res = await GET(reqWithSessionId(''))
    const data = await res.json()
    expect(res.status).toBe(400)
    expect(data.error).toBe('Missing session_id')
  })

  it('GET returns 400 when session_id query is absent', async () => {
    const res = await GET(new NextRequest('http://test/api/checkout/session-status'))
    const data = await res.json()
    expect(res.status).toBe(400)
    expect(data.error).toBe('Missing session_id')
  })

  it('GET returns 200 with status and customer_email when session exists', async () => {
    const res = await GET(reqWithSessionId('cs_123'))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.status).toBe('complete')
    expect(data.customer_email).toBe('test@example.com')
  })

  it('GET returns 500 when Stripe retrieve throws', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockRetrieve.mockRejectedValueOnce(new Error('Stripe error'))
    const res = await GET(reqWithSessionId('cs_123'))
    const data = await res.json()
    expect(res.status).toBe(500)
    expect(data).toHaveProperty('error')
    consoleSpy.mockRestore()
  })
})
