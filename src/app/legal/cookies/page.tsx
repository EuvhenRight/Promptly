import Link from 'next/link'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Cookie Policy | Promptly',
  description: 'Cookie Policy for the Promptly AI prompt marketplace.',
}

const LAST_UPDATED = 'February 18, 2026'

export default function CookiesPage() {
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
            Cookie Policy
          </h1>
          <p className="text-muted-foreground">Last updated: {LAST_UPDATED}</p>

          <section className="mt-8 space-y-4 text-foreground/90">
            <h2 className="font-headline text-xl font-semibold text-foreground">
              1. What Are Cookies and Similar Technologies
            </h2>
            <p>
              We use cookies and similar technologies (such as localStorage) to
              make our website work and to improve your experience. This policy
              explains what we use and why.
            </p>
          </section>

          <section className="mt-8 space-y-4 text-foreground/90">
            <h2 className="font-headline text-xl font-semibold text-foreground">
              2. Essential Cookies and Storage
            </h2>
            <p>
              These are necessary for the website to function. They cannot be
              disabled.
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-border">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="p-3 text-left font-semibold">Name</th>
                    <th className="p-3 text-left font-semibold">Purpose</th>
                    <th className="p-3 text-left font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="p-3">Firebase Auth</td>
                    <td className="p-3">
                      Keeps you signed in; session persistence
                    </td>
                    <td className="p-3">Session / persistent</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="p-3">Stripe</td>
                    <td className="p-3">
                      Secure payment processing during checkout
                    </td>
                    <td className="p-3">Session</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-8 space-y-4 text-foreground/90">
            <h2 className="font-headline text-xl font-semibold text-foreground">
              3. Functional Storage (localStorage)
            </h2>
            <p>
              These store preferences in your browser to improve your experience.
              You can manage or clear them via your browser settings.
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-border">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="p-3 text-left font-semibold">Key</th>
                    <th className="p-3 text-left font-semibold">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="p-3">theme</td>
                    <td className="p-3">Stores your light/dark theme preference</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="p-3">promptly_local_cart</td>
                    <td className="p-3">
                      Stores cart items when you browse without being signed in
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="p-3">hideMyPrompts</td>
                    <td className="p-3">Hides your own prompts in the feed</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="p-3">showFeaturedImage</td>
                    <td className="p-3">Account display preference</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="p-3">promptly_cookie_consent</td>
                    <td className="p-3">
                      Stores your cookie consent choice (accept/reject)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-8 space-y-4 text-foreground/90">
            <h2 className="font-headline text-xl font-semibold text-foreground">
              4. Managing Your Preferences
            </h2>
            <p>
              You can accept or reject non-essential functional storage via our
              cookie banner when you first visit. You can change your preference
              at any time by visiting this page or clearing your browser data.
            </p>
            <p>
              To withdraw consent: clear the &quot;promptly_cookie_consent&quot;
              key from localStorage or use your browser&apos;s clear site data
              option. Withdrawing consent is as easy as giving it.
            </p>
            <p>
              You can also disable cookies in your browser settings. Note that
              disabling essential cookies may prevent the website from working
              correctly.
            </p>
          </section>

          <section className="mt-8 space-y-4 text-foreground/90">
            <h2 className="font-headline text-xl font-semibold text-foreground">
              5. Third-Party Cookies
            </h2>
            <p>
              Stripe and Firebase may set their own cookies when you use
              checkout or sign in. We do not control these. See{' '}
              <a
                href="https://stripe.com/legal/privacy-center"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Stripe Privacy
              </a>{' '}
              and{' '}
              <a
                href="https://firebase.google.com/support/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Firebase Privacy
              </a>
              .
            </p>
          </section>

          <section className="mt-8 space-y-4 text-foreground/90">
            <h2 className="font-headline text-xl font-semibold text-foreground">
              6. More Information
            </h2>
            <p>
              For how we process personal data, see our{' '}
              <Link href="/legal/privacy" className="text-primary underline">
                Privacy Policy
              </Link>
              . For questions, contact [Contact Email].
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  )
}
