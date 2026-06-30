import Link from 'next/link'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'About | Promptly',
  description: 'About Promptly - AI prompt marketplace.',
}

export default function AboutPage() {
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
        <article className="prose prose-neutral dark:prose-invert max-w-3xl">
          <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground">
            About Promptly
          </h1>

          <section className="mt-8 space-y-4 text-foreground/90">
            <p>
              Promptly is a marketplace for the best AI prompts. Discover, create,
              and share prompts for image generation, video creation, and more.
            </p>
          </section>

          <section className="mt-8 space-y-4 text-foreground/90">
            <h2 className="font-headline text-xl font-semibold text-foreground">
              Company Information
            </h2>
            <p>
              In accordance with Dutch law and EU regulations, we provide the
              following company details:
            </p>
            <ul className="list-none space-y-1 pl-0">
              <li>
                <strong>Legal name:</strong> [Company Name]
              </li>
              <li>
                <strong>Registered address:</strong> [Registered Address]
              </li>
              <li>
                <strong>Chamber of Commerce (KVK):</strong> [KVK Number]
              </li>
              <li>
                <strong>Contact:</strong>{' '}
                <a href="mailto:[Contact Email]" className="text-primary underline">
                  [Contact Email]
                </a>
              </li>
              <li>
                <strong>VAT ID (if applicable):</strong> [VAT ID]
              </li>
            </ul>
          </section>

          <section className="mt-8 space-y-4 text-foreground/90">
            <h2 className="font-headline text-xl font-semibold text-foreground">
              Legal
            </h2>
            <ul className="list-disc pl-6">
              <li>
                <Link href="/legal/terms" className="text-primary underline">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="text-primary underline">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/cookies" className="text-primary underline">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  )
}
