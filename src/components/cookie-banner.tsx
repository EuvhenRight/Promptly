'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

const CONSENT_KEY = 'promptly_cookie_consent'

type ConsentStatus = 'accepted' | 'rejected' | null

export function CookieBanner() {
  const [consent, setConsent] = useState<ConsentStatus>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem(CONSENT_KEY) as ConsentStatus | null
    if (stored === 'accepted' || stored === 'rejected') {
      setConsent(stored)
    } else {
      setConsent('pending')
    }
  }, [])

  const handleChoice = (choice: 'accepted' | 'rejected') => {
    if (typeof window === 'undefined') return
    localStorage.setItem(CONSENT_KEY, choice)
    setConsent(choice)
  }

  if (consent !== 'pending') return null

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background p-4 shadow-lg sm:p-6"
    >
      <div className="container mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          We use cookies and similar technologies to provide the service, store
          your preferences, and improve your experience. See our{' '}
          <Link
            href="/legal/cookies"
            className="font-medium text-primary underline hover:text-primary/90"
          >
            Cookie Policy
          </Link>{' '}
          for details.
        </p>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleChoice('rejected')}
            aria-label="Reject all non-essential cookies"
          >
            Reject all
          </Button>
          <Button
            size="sm"
            onClick={() => handleChoice('accepted')}
            aria-label="Accept all cookies"
          >
            Accept all
          </Button>
        </div>
      </div>
    </div>
  )
}
