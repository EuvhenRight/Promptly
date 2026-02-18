import Link from 'next/link'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy | Promptly',
  description: 'Privacy Policy for the Promptly AI prompt marketplace.',
}

const LAST_UPDATED = 'February 18, 2026'

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
        <article className="prose prose-neutral dark:prose-invert max-w-3xl">
          <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground">Last updated: {LAST_UPDATED}</p>

          <section className="mt-8 space-y-4 text-foreground/90">
            <h2 className="font-headline text-xl font-semibold text-foreground">
              1. Controller
            </h2>
            <p>
              The data controller for the processing of your personal data in
              connection with the Promptly marketplace is:
            </p>
            <ul className="list-disc pl-6">
              <li>
                <strong>[Company Name]</strong>
              </li>
              <li>[Registered Address]</li>
              <li>Chamber of Commerce (KVK): [KVK Number]</li>
              <li>Contact: [Contact Email]</li>
            </ul>
          </section>

          <section className="mt-8 space-y-4 text-foreground/90">
            <h2 className="font-headline text-xl font-semibold text-foreground">
              2. Purposes and Legal Bases
            </h2>
            <p>We process personal data for the following purposes:</p>

            <h3 className="font-headline text-lg font-medium text-foreground">
              2.1 Account and authentication
            </h3>
            <p>
              We collect your email, display name, username, and photo to create
              and manage your account. Firebase Authentication is used for sign-in.
              <strong> Legal basis:</strong> Performance of a contract (Art. 6(1)(b)
              GDPR). Without this data, we cannot provide the service.
            </p>

            <h3 className="font-headline text-lg font-medium text-foreground">
              2.2 Profile and public information
            </h3>
            <p>
              Display name, username, photo, cover image, description, and social
              links (X, Instagram, Facebook) may be shown on your public profile.
              <strong> Legal basis:</strong> Performance of a contract and your
              consent where applicable.
            </p>

            <h3 className="font-headline text-lg font-medium text-foreground">
              2.3 Purchases, credits, and payouts
            </h3>
            <p>
              We process purchase history, cart data, credits, subscription plans,
              and payout requests to process payments and deliver digital content.
              Payment processing is handled by Stripe. <strong>Legal basis:</strong>{' '}
              Performance of a contract.
            </p>

            <h3 className="font-headline text-lg font-medium text-foreground">
              2.4 Content (prompts, comments, ratings)
            </h3>
            <p>
              We store prompts, comments, ratings, favorites, and follow
              relationships to operate the marketplace.
              <strong> Legal basis:</strong> Performance of a contract.
            </p>

            <h3 className="font-headline text-lg font-medium text-foreground">
              2.5 Preferences and local storage
            </h3>
            <p>
              Theme preference, cart (for guests), and UI preferences (e.g.
              hideMyPrompts, showFeaturedImage) are stored in your browser.
              <strong> Legal basis:</strong> Legitimate interest (Art. 6(1)(f)
              GDPR) to improve user experience. See our{' '}
              <Link href="/legal/cookies" className="text-primary underline">
                Cookie Policy
              </Link>{' '}
              for details.
            </p>
          </section>

          <section className="mt-8 space-y-4 text-foreground/90">
            <h2 className="font-headline text-xl font-semibold text-foreground">
              3. Recipients and International Transfers
            </h2>
            <p>We share data with the following recipients:</p>
            <ul className="list-disc pl-6">
              <li>
                <strong>Firebase / Google Cloud</strong> (Auth, Firestore,
                Storage): Data is processed under a Data Processing Agreement.
                Google may transfer data outside the EEA under Standard
                Contractual Clauses. See{' '}
                <a
                  href="https://firebase.google.com/terms/data-processing-terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Firebase Data Processing Terms
                </a>
                .
              </li>
              <li>
                <strong>Stripe</strong> (payment processing): Payment and
                transaction data are shared with Stripe. Stripe operates under a
                DPA and may process data in the EU via Stripe Payments Europe Ltd.
                See{' '}
                <a
                  href="https://stripe.com/legal/privacy-center"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Stripe Privacy Center
                </a>
                .
              </li>
            </ul>
          </section>

          <section className="mt-8 space-y-4 text-foreground/90">
            <h2 className="font-headline text-xl font-semibold text-foreground">
              4. Retention
            </h2>
            <p>We retain personal data as follows:</p>
            <ul className="list-disc pl-6">
              <li>
                <strong>Account data:</strong> Until you delete your account, plus
                a reasonable period for backups and legal obligations.
              </li>
              <li>
                <strong>Purchase and transaction data:</strong> As required for
                tax and legal compliance (typically 7 years in the Netherlands).
              </li>
              <li>
                <strong>Content (prompts, comments):</strong> Until you delete it
                or your account is closed.
              </li>
              <li>
                <strong>Local storage:</strong> Until you clear it or withdraw
                consent; cookie consent is stored until withdrawn.
              </li>
            </ul>
          </section>

          <section className="mt-8 space-y-4 text-foreground/90">
            <h2 className="font-headline text-xl font-semibold text-foreground">
              5. Your Rights
            </h2>
            <p>
              Under the GDPR, you have the right to:
            </p>
            <ul className="list-disc pl-6">
              <li>
                <strong>Access</strong> (Art. 15): Obtain a copy of your personal
                data.
              </li>
              <li>
                <strong>Rectification</strong> (Art. 16): Correct inaccurate data.
              </li>
              <li>
                <strong>Erasure</strong> (Art. 17): Request deletion of your data
                (subject to legal exceptions).
              </li>
              <li>
                <strong>Restriction</strong> (Art. 18): Limit processing in
                certain cases.
              </li>
              <li>
                <strong>Data portability</strong> (Art. 20): Receive your data in
                a structured, commonly used format.
              </li>
              <li>
                <strong>Object</strong> (Art. 21): Object to processing based on
                legitimate interest.
              </li>
              <li>
                <strong>Withdraw consent</strong>: Where processing is based on
                consent, you may withdraw it at any time.
              </li>
            </ul>
            <p>
              To exercise these rights, contact us at [Contact Email]. You also
              have the right to lodge a complaint with the Dutch Data Protection
              Authority (Autoriteit Persoonsgegevens):{' '}
              <a
                href="https://autoriteitpersoonsgegevens.nl"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                autoriteitpersoonsgegevens.nl
              </a>
            </p>
          </section>

          <section className="mt-8 space-y-4 text-foreground/90">
            <h2 className="font-headline text-xl font-semibold text-foreground">
              6. Provision of Data
            </h2>
            <p>
              Providing account and payment data is necessary to enter into and
              perform the contract. If you do not provide it, we cannot create
              your account or process purchases. Profile and content data are
              voluntary to the extent you choose to add them.
            </p>
          </section>

          <section className="mt-8 space-y-4 text-foreground/90">
            <h2 className="font-headline text-xl font-semibold text-foreground">
              7. Security
            </h2>
            <p>
              We implement appropriate technical and organizational measures to
              protect your personal data. Our processors (Firebase, Stripe) are
              bound by data processing agreements and maintain relevant
              certifications.
            </p>
          </section>

          <section className="mt-8 space-y-4 text-foreground/90">
            <h2 className="font-headline text-xl font-semibold text-foreground">
              8. Contact
            </h2>
            <p>
              For questions about this Privacy Policy or to exercise your rights,
              contact us at [Contact Email].
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  )
}
