import Link from 'next/link'
import {
  Bot,
  Cookie,
  FileText,
  Home,
  Info,
  PlusCircle,
  Shield,
  ShoppingBag,
  Users,
} from 'lucide-react'

const currentYear = new Date().getFullYear()

const productLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/plans', label: 'Pricing', icon: ShoppingBag },
  { href: '/submit', label: 'Submit a Prompt', icon: PlusCircle },
  { href: '/cart', label: 'Cart', icon: ShoppingBag },
]

const communityLinks = [
  { href: '/community', label: 'Community', icon: Users },
]

const legalLinks = [
  { href: '/legal/terms', label: 'Terms of Service', icon: FileText },
  { href: '/legal/privacy', label: 'Privacy Policy', icon: Shield },
  { href: '/legal/cookies', label: 'Cookie Policy', icon: Cookie },
  { href: '/about', label: 'About', icon: Info },
]

function FooterLink({
  href,
  label,
  icon: Icon,
}: {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-accent dark:hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </Link>
  )
}

function FooterNav({
  title,
  links,
  ariaLabel,
}: {
  title: string
  links: typeof productLinks
  ariaLabel: string
}) {
  return (
    <nav aria-label={ariaLabel} className="flex flex-col gap-3">
      <h3 className="font-headline text-sm font-semibold text-foreground">
        {title}
      </h3>
      <ul className="flex flex-col gap-2 list-none p-0 m-0">
        {links.map(({ href, label, icon }) => (
          <li key={href}>
            <FooterLink href={href} label={label} icon={icon} />
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default function Footer() {
  return (
    <footer
      className="mt-auto border-t border-border bg-muted/50 text-muted-foreground"
      role="contentinfo"
    >
      <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-1 flex flex-col gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 w-fit font-headline text-lg font-semibold text-foreground transition-colors hover:text-accent dark:hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
              aria-label="Promptly – Home"
            >
              <Bot className="h-6 w-6 text-primary" aria-hidden />
              Promptly
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              A marketplace for the best AI prompts. Discover, create, and share.
            </p>
          </div>

          <FooterNav
            title="Product"
            links={productLinks}
            ariaLabel="Product and marketplace links"
          />
          <FooterNav
            title="Community & Support"
            links={communityLinks}
            ariaLabel="Community and support links"
          />
          <div className="flex flex-col gap-4 sm:col-span-2 lg:col-span-1">
            <FooterNav
              title="Legal"
              links={legalLinks}
              ariaLabel="Legal links"
            />
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col items-center justify-between gap-4 sm:flex-row sm:items-center">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} Promptly. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/80">
            AI prompt marketplace
          </p>
        </div>
      </div>
    </footer>
  )
}
