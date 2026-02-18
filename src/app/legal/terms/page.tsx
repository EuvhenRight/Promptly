import Link from 'next/link'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service | Promptly',
  description: 'Terms of Service for the Promptly AI prompt marketplace.',
}

const LAST_UPDATED = 'February 18, 2026'

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="text-muted-foreground">Last updated: {LAST_UPDATED}</p>

          <section className="mt-8 space-y-4 text-foreground/90">
            <h2 className="font-headline text-xl font-semibold text-foreground">
              1. Acceptance of Terms
            </h2>
            <p>
              By creating an account, browsing, or using Promptly
              (&quot;Service&quot;), you agree to these Terms of Service
              (&quot;Terms&quot;). If you do not agree, do not use the Service.
              [Company Name], [Registered Address], KVK [KVK Number]
              (&quot;we&quot;, &quot;us&quot;, &quot;Promptly&quot;) operates the
              Service.
            </p>
          </section>

          <section className="mt-8 space-y-4 text-foreground/90">
            <h2 className="font-headline text-xl font-semibold text-foreground">
              2. Description of Service
            </h2>
            <p>
              Promptly is an online marketplace where users can discover, buy,
              and sell AI prompts (digital content). We provide the platform;
              creators sell their prompts, and buyers purchase access to prompt
              content. We also offer subscription plans and credit packs for
              image/video generation.
            </p>
          </section>

          <section className="mt-8 space-y-4 text-foreground/90">
            <h2 className="font-headline text-xl font-semibold text-foreground">
              3. Account Registration
            </h2>
            <p>
              You must create an account to buy, sell, or use certain features.
              You agree to provide accurate information and keep your account
              secure. You are responsible for all activity under your account.
              You must be at least 16 years old (or the age of consent in your
              jurisdiction) to use the Service.
            </p>
          </section>

          <section className="mt-8 space-y-4 text-foreground/90">
            <h2 className="font-headline text-xl font-semibold text-foreground">
              4. Payment Terms
            </h2>
            <p>
              Payments are processed via Stripe in EUR. Prices are displayed
              inclusive of VAT where applicable. By completing a purchase, you
              agree to Stripe&apos;s terms. We reserve the right to change
              prices; changes apply to new purchases only.
            </p>
            <p>
              For subscription plans, you will be billed monthly or annually
              until you cancel. You may cancel at any time; access continues until
              the end of the current billing period.
            </p>
          </section>

          <section className="mt-8 space-y-4 text-foreground/90">
            <h2 className="font-headline text-xl font-semibold text-foreground">
              5. Digital Content and Withdrawal Right
            </h2>
            <p>
              Under EU consumer law, you normally have a 14-day right to withdraw
              from distance contracts. However, for digital content (including AI
              prompts) that is delivered immediately after purchase, you lose the
              right of withdrawal once you expressly consent to immediate access
              and acknowledge that you forfeit the withdrawal right.
            </p>
            <p>
              Before we deliver paid prompt content to you, we will ask you to
              expressly confirm that you agree to immediate access and that you
              lose your right to withdraw. Once you confirm and access the
              content, the sale is final. Credits and subscription plans follow
              the same principle: once used, withdrawal is not available.
            </p>
          </section>

          <section className="mt-8 space-y-4 text-foreground/90">
            <h2 className="font-headline text-xl font-semibold text-foreground">
              6. Refunds
            </h2>
            <p>
              Refunds may be granted at our discretion for defective content,
              technical failures, or duplicate charges. To request a refund,
              contact [Contact Email] with your order details. We will process
              valid refund requests within 14 days. If you have not received the
              digital content due to our error, you are entitled to a full
              refund.
            </p>
          </section>

          <section className="mt-8 space-y-4 text-foreground/90">
            <h2 className="font-headline text-xl font-semibold text-foreground">
              7. Content Policy
            </h2>
            <p>When creating or uploading content, you agree not to:</p>
            <ul className="list-disc pl-6">
              <li>Post illegal, harmful, or infringing content</li>
              <li>Violate intellectual property rights of others</li>
              <li>Post deceptive, misleading, or spam content</li>
              <li>Include malware, viruses, or harmful code</li>
              <li>Harass, defame, or discriminate</li>
            </ul>
            <p>
              We may remove content that violates these rules, suspend or
              terminate accounts, and cooperate with authorities. If you believe
              content infringes your rights or is illegal, contact us at [Contact
              Email]. We will review reports and take appropriate action.
            </p>
          </section>

          <section className="mt-8 space-y-4 text-foreground/90">
            <h2 className="font-headline text-xl font-semibold text-foreground">
              8. Seller / Creator Obligations
            </h2>
            <p>
              If you sell prompts on Promptly, you represent that you own or have
              the right to license the content. You grant us a non-exclusive
              licence to host, display, and deliver your prompts to buyers. You
              understand that your identity (username, profile) is visible to
              buyers as required under the EU Digital Services Act for
              marketplace traceability.
            </p>
            <p>
              Platform fees apply to sales as indicated on the pricing page.
              Payouts are processed according to our payout policy and applicable
              minimum thresholds.
            </p>
          </section>

          <section className="mt-8 space-y-4 text-foreground/90">
            <h2 className="font-headline text-xl font-semibold text-foreground">
              9. Intellectual Property
            </h2>
            <p>
              Promptly&apos;s brand, design, and technology remain our property.
              Creators retain ownership of their prompts; buyers receive a
              licence to use purchased prompts for personal or commercial use as
              described at purchase. You may not redistribute or resell prompt
              content in violation of the licence.
            </p>
          </section>

          <section className="mt-8 space-y-4 text-foreground/90">
            <h2 className="font-headline text-xl font-semibold text-foreground">
              10. Limitation of Liability
            </h2>
            <p>
              To the extent permitted by law, we are not liable for indirect,
              incidental, consequential, or punitive damages. Our liability is
              limited to the amount you paid us in the 12 months preceding the
              claim. Nothing in these Terms excludes liability for death or
              personal injury caused by negligence, fraud, or other mandatory
              liability under applicable law.
            </p>
          </section>

          <section className="mt-8 space-y-4 text-foreground/90">
            <h2 className="font-headline text-xl font-semibold text-foreground">
              11. Termination and Suspension
            </h2>
            <p>
              You may close your account at any time. We may suspend or
              terminate your account for breach of these Terms, fraud, or other
              misconduct. Upon termination, your right to use the Service ceases;
              we may retain data as required by law.
            </p>
          </section>

          <section className="mt-8 space-y-4 text-foreground/90">
            <h2 className="font-headline text-xl font-semibold text-foreground">
              12. Governing Law and Disputes
            </h2>
            <p>
              These Terms are governed by the laws of the Netherlands. Disputes
              will be resolved in the courts of the Netherlands. EU consumers
              retain the right to bring claims in their country of residence.
            </p>
            <p>
              The European Commission provides an online dispute resolution
              platform:{' '}
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                ec.europa.eu/consumers/odr
              </a>
              . We are not obligated to participate in alternative dispute
              resolution.
            </p>
          </section>

          <section className="mt-8 space-y-4 text-foreground/90">
            <h2 className="font-headline text-xl font-semibold text-foreground">
              13. Changes to Terms
            </h2>
            <p>
              We may update these Terms. Material changes will be notified via
              email or a notice on the Service. Continued use after the effective
              date constitutes acceptance. If you do not agree, you must stop
              using the Service and may close your account.
            </p>
          </section>

          <section className="mt-8 space-y-4 text-foreground/90">
            <h2 className="font-headline text-xl font-semibold text-foreground">
              14. Contact
            </h2>
            <p>
              For questions about these Terms, contact us at [Contact Email].
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  )
}
