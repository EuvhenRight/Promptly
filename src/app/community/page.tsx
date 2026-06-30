'use client'

import CommunityFeed from '@/components/community/community-feed'
import CommunityHero from '@/components/community/community-hero'
import Footer from '@/components/layout/footer'
import Header from '@/components/layout/header'
import SubmitPromptCta from '@/components/community/SubmitPromptCta'

export default function CommunityPage() {
	return (
		<div className='flex min-h-screen flex-col bg-muted/20'>
			<Header />
			<main>
				<CommunityHero />
				<div className='container mx-auto px-4 py-8 sm:px-6 lg:px-8'>
					<div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
						<aside className='lg:col-span-3 space-y-6'>
							<SubmitPromptCta />
						</aside>

						<div className='lg:col-span-9'>
							<CommunityFeed />
						</div>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	)
}
