'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'

interface SearchBarProps {
	activeFilter: string
}

const mockData: { [key: string]: { title: string; results: string } } = {
	Featured: { title: 'Featured Prompts', results: '2.7k' },
	Hot: { title: 'Hot Prompts', results: '15.1k' },
	New: { title: 'New Prompts', results: '534k' },
	Top: { title: 'Top Prompts', results: '1.2M' },
	Video: { title: 'Video Prompts', results: '450' },
	'ChatGPT Image': { title: 'ChatGPT Image Prompts', results: '1.2k' },
	Midjourney: { title: 'Midjourney Prompts', results: '8.8k' },
	FLUX: { title: 'FLUX Prompts', results: '180' },
	Sora: { title: 'Sora Prompts', results: '99' },
	'Stable Diffusion': { title: 'Stable Diffusion Prompts', results: '7.5k' },
	Portraits: { title: 'Portrait Prompts', results: '3.1k' },
	Photography: { title: 'Photography Prompts', results: '4.9k' },
	Anime: { title: 'Anime Prompts', results: '6.4k' },
	Logo: { title: 'Logo Prompts', results: '2.2k' },
	'Character Design': { title: 'Character Design Prompts', results: '4.1k' },
}

export default function SearchBar({ activeFilter }: SearchBarProps) {
	const currentData = mockData[activeFilter] || {
		title: `${activeFilter} Prompts`,
		results: '...',
	}
	const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(
		null,
	)

	const fetchBackground = () => {
		fetch('/api/search-bar-backgrounds?active=true', { cache: 'no-store' })
			.then(res => (res.ok ? res.json() : null))
			.then(data => {
				if (data && typeof data === 'object' && data.imageUrl) {
					setBackgroundImageUrl(data.imageUrl)
				} else {
					setBackgroundImageUrl(null)
				}
			})
			.catch(() => setBackgroundImageUrl(null))
	}

	useEffect(() => {
		fetchBackground()
		const onVisibilityChange = () => {
			if (document.visibilityState === 'visible') fetchBackground()
		}
		document.addEventListener('visibilitychange', onVisibilityChange)
		return () =>
			document.removeEventListener('visibilitychange', onVisibilityChange)
	}, [])

	return (
		<section
			className='relative min-h-[280px] py-12 md:py-16 text-center overflow-hidden bg-background bg-cover bg-center'
			style={
				backgroundImageUrl
					? {
							backgroundImage: `linear-gradient(rgba(255,255,255,0.65), rgba(255,255,255,0.65)), url("${backgroundImageUrl.replace(/"/g, '%22')}")`,
						}
					: undefined
			}
		>
			<div className='container relative z-10 mx-auto px-4 sm:px-6 lg:px-8'>
				<h1 className='text-4xl md:text-5xl font-bold font-headline tracking-tight'>
					{currentData.title}
				</h1>
				<p className='mt-3 text-lg text-muted-foreground'>
					About {currentData.results} results
				</p>

				<div className='mt-8 max-w-3xl mx-auto'>
					<div className='relative'>
						<div className='relative flex items-center w-full h-16 bg-card border rounded-full shadow-lg shadow-primary/10'>
							<Search className='absolute left-6 h-6 w-6 text-muted-foreground' />
							<Input
								placeholder='Search for prompts, models, or inspiration…'
								className='pl-16 pr-32 h-full text-base rounded-full bg-transparent border-0 focus-visible:ring-0'
							/>
							<div className='absolute right-2 top-1/2 -translate-y-1/2'>
								<Button
									type='submit'
									className='rounded-full bg-foreground text-background hover:bg-foreground/90 h-12 px-8'
								>
									Search
								</Button>
							</div>
						</div>
					</div>
				</div>

				<div className='mt-6 flex justify-center items-center gap-3'>
					<Button variant='outline' className='rounded-full border bg-card'>
						+ Type
					</Button>
					<Button variant='outline' className='rounded-full border bg-card'>
						+ Model
					</Button>
					<Button variant='outline' className='rounded-full border bg-card'>
						Sort ↑↓
					</Button>
				</div>
			</div>
		</section>
	)
}
