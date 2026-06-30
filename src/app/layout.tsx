import { SuppressTimeoutLog } from '@/components/suppress-timeout-log'
import { Toaster } from '@/components/ui/toaster'
import { FirebaseClientProvider } from '@/firebase'
import { getFirebaseConfig } from '@/firebase/config'
import { CategoriesProvider } from '@/hooks/use-categories'
import { ModelsProvider } from '@/hooks/use-models'
import { TagsProvider } from '@/hooks/use-tags'
import { TypesProvider } from '@/hooks/use-types'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { CookieBanner } from '@/components/cookie-banner'
import { ThemeProvider } from '@/components/theme-provider'

const fontInter = Inter({
	subsets: ['latin'],
	variable: '--font-inter',
})

const fontSpaceGrotesk = Space_Grotesk({
	subsets: ['latin'],
	variable: '--font-space-grotesk',
})

const siteUrl =
	process.env.NEXT_PUBLIC_SITE_URL ||
	(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)

export const metadata: Metadata = {
	metadataBase: siteUrl ? new URL(siteUrl) : undefined,
	title: {
		default: 'Promptly — Find, Buy & Sell AI Prompts',
		template: '%s | Promptly',
	},
	description:
		'Find, buy, and sell AI prompts. Discover prompts for Midjourney, ChatGPT, and more. Verified reviews, creator earnings, ready to use.',
	openGraph: {
		title: 'Promptly — Find, Buy & Sell AI Prompts',
		description:
			'Find, buy, and sell AI prompts. Discover prompts for Midjourney, ChatGPT, and more. Verified reviews, creator earnings.',
		url: siteUrl,
		siteName: 'Promptly',
		type: 'website',
		images: siteUrl ? [{ url: '/og-image.png', width: 1200, height: 630 }] : [],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Promptly — Find, Buy & Sell AI Prompts',
		description:
			'Find, buy, and sell AI prompts. Verified reviews. Creator-first marketplace.',
	},
	robots: {
		index: true,
		follow: true,
	},
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	const firebaseConfig = getFirebaseConfig()
	return (
		<html lang='en' suppressHydrationWarning>
			<body
				className={cn(
					'min-h-screen bg-background font-sans antialiased',
					fontInter.variable,
					fontSpaceGrotesk.variable,
				)}
			>
				<ThemeProvider
					attribute='class'
					defaultTheme='light'
					disableTransitionOnChange
				>
					<FirebaseClientProvider config={firebaseConfig}>
						<SuppressTimeoutLog />
						<CategoriesProvider>
							<TagsProvider>
								<TypesProvider>
									<ModelsProvider>
										{children}
										<Toaster />
										<CookieBanner />
									</ModelsProvider>
								</TypesProvider>
							</TagsProvider>
						</CategoriesProvider>
					</FirebaseClientProvider>
				</ThemeProvider>
			</body>
		</html>
	)
}
