'use client'

import CommunityFeed from '@/components/community/community-feed'
import CommunityHero from '@/components/community/community-hero'
import MemberOfTheDay from '@/components/community/member-of-the-day'
import NewMembers from '@/components/community/new-members'
import VerifiedProfiles from '@/components/community/verified-profiles'
import Footer from '@/components/layout/footer'
import Header from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import TopCreators from '@/components/community/top-creators'

export default function CommunityPage() {
	return (
		<div className='flex min-h-screen flex-col bg-background'>
			<Header />
			<main>
				<CommunityHero />
				<div className='container mx-auto px-4 py-8 sm:px-6 lg:px-8'>
					<div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
						
						<aside className='lg:col-span-3 space-y-6'>
							<Card>
								<CardContent className='pt-6'>
									<TopCreators />
								</CardContent>
							</Card>
						</aside>

						
						<div className='lg:col-span-6'>
							<Card>
								<CardContent className='pt-6'>
									<CommunityFeed />
								</CardContent>
							</Card>
						</div>

						
						<aside className='lg:col-span-3 space-y-6'>
							<Card>
								<CardContent className='pt-6'>
									<MemberOfTheDay />
								</CardContent>
							</Card>
							<Card>
								<CardContent className='pt-6'>
									<NewMembers />
								</CardContent>
							</Card>
							<Card>
								<CardContent className='pt-6'>
									<VerifiedProfiles />
								</CardContent>
							</Card>
						</aside>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	)
}
