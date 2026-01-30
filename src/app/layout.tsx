import { Toaster } from '@/components/ui/toaster'
import { FirebaseClientProvider } from '@/firebase'
import { CategoriesProvider } from '@/hooks/use-categories'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'

const fontInter = Inter({
	subsets: ['latin'],
	variable: '--font-inter',
})

const fontSpaceGrotesk = Space_Grotesk({
	subsets: ['latin'],
	variable: '--font-space-grotesk',
})

export const metadata: Metadata = {
	title: 'Promptly',
	description: 'A marketplace for the best AI prompts.',
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang='en' suppressHydrationWarning>
			<body
				className={cn(
					'min-h-screen bg-background font-sans antialiased',
					fontInter.variable,
					fontSpaceGrotesk.variable,
				)}
			>
				<FirebaseClientProvider>
					<CategoriesProvider>
						{children}
						<Toaster />
					</CategoriesProvider>
				</FirebaseClientProvider>
			</body>
		</html>
	)
}
