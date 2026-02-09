'use client'

import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { Flame } from 'lucide-react'
import Link from 'next/link'

export default function CommunityHero() {
	const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(
		null,
	)
	const [credit, setCredit] = useState<string | null>(null)

	useEffect(() => {
		fetch('/api/search-bar-backgrounds?active=true', { cache: 'no-store' })
			.then(res => (res.ok ? res.json() : null))
			.then(data => {
				if (data && typeof data === 'object' && data.imageUrl) {
					setBackgroundImageUrl(data.imageUrl)
					setCredit(data.name ? `by @${data.name}` : 'Community Background')
				} else {
					setBackgroundImageUrl(null)
				}
			})
			.catch(() => setBackgroundImageUrl(null))
	}, [])

	return (
		<section className='relative h-[400px] w-full lg:h-[500px] overflow-hidden'>
			{backgroundImageUrl && (
				<div
					className='absolute inset-0 bg-cover bg-center'
					style={{ backgroundImage: `url("${backgroundImageUrl.replace(/"/g, '%22')}")` }}
				/>
			)}
			<div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30' />
			<div className='absolute inset-0 flex flex-col items-center justify-center text-center text-white'>
				<div className='container mx-auto px-4'>
					<h1 className='font-headline text-4xl font-bold md:text-6xl lg:text-7xl tracking-tight'>
						The Prompter Community
					</h1>
					<p className='mt-4 max-w-2xl mx-auto text-lg text-gray-200 md:text-xl'>
						Welcome to the home for AI prompters, where the pros share their
						tricks, showcase their work, hone their skills and create
						breathtaking images.
					</p>
					<Button
						size='lg'
						className='mt-8 bg-accent text-accent-foreground hover:bg-accent/90'
						asChild
					>
						<Link href='#'>
							<Flame className='mr-2 h-5 w-5' />
							Join today for free
						</Link>
					</Button>
				</div>
			</div>
			{credit && (
				<p className='absolute bottom-4 right-6 text-sm text-white/70'>
					{credit}
				</p>
			)}
		</section>
	)
}
