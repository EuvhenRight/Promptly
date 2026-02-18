import Link from 'next/link'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy | Promptly',
  description: 'Privacy Policy for the Promptly AI prompt marketplace.',
}

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <Button variant="ghost" asChild className="mb-8 -ml-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </Button>
        <article className="max-w-3xl">
          <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground">
            Privacy Policy
          </h1>
          <p className="mt-2 text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-US')}
          </p>
          <div className="mt-8 space-y-6 text-foreground/90">
            <p>
              This is a placeholder. Replace with your actual Privacy Policy
              (data collected, how it is used, cookies, third parties, user
              rights, contact).
            </p>
            <p>
              You can host the full text here or link to an external document.
            </p>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  )
}
