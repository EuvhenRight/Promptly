import { Toaster } from '@/components/ui/toaster'
import { FirebaseClientProvider } from '@/firebase'
import { CategoriesProvider } from '@/hooks/use-categories'
import { TagsProvider } from '@/hooks/use-tags'
import { TypesProvider } from '@/hooks/use-types'
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

function getFirebaseConfig() {
  const rawConfig =
    process.env.FIREBASE_CONFIG || process.env.FIREBASE_WEBAPP_CONFIG;
  if (!rawConfig) {
    console.error(
      "Server-side Warning: FIREBASE_CONFIG or FIREBASE_WEBAPP_CONFIG environment variable not set. Client-side initialization will likely fail."
    );
    return {};
  }
  try {
    return JSON.parse(rawConfig);
  } catch (e) {
    console.error("Server-side Error: Failed to parse Firebase config environment variable.", e);
    return {};
  }
}


export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	const firebaseConfig = getFirebaseConfig();
	return (
		<html lang='en' suppressHydrationWarning>
			<body
				className={cn(
					'min-h-screen bg-background font-sans antialiased',
					fontInter.variable,
					fontSpaceGrotesk.variable,
				)}
			>
				<FirebaseClientProvider config={firebaseConfig}>
					<CategoriesProvider>
						<TagsProvider>
							<TypesProvider>
								{children}
								<Toaster />
							</TypesProvider>
						</TagsProvider>
					</CategoriesProvider>
				</FirebaseClientProvider>
			</body>
		</html>
	)
}
