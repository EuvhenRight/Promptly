'use client'

import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { useTypes } from '@/hooks/use-types'
import { ChevronDown, Search } from 'lucide-react'
import { useEffect, useState } from 'react'

interface SearchBarProps {
	activeFilter: string
	selectedTypeId: string | null
	onTypeChange: (typeId: string | null) => void
	totalCount: number | null
}

export default function SearchBar({
	activeFilter,
	selectedTypeId,
	onTypeChange,
	totalCount,
}: SearchBarProps) {
	const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(
		null,
	)
	const { types, isLoading: typesLoading } = useTypes()

	const currentTitle = `${activeFilter} Prompts`
	const resultsText =
		totalCount !== null
			? `About ${totalCount.toLocaleString()} results`
			: 'Loading results...'

	const selectedTypeName =
		types.find(t => t.id === selectedTypeId)?.name || 'Type'

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
					{currentTitle}
				</h1>
				<p className='mt-3 text-lg text-muted-foreground'>{resultsText}</p>

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
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant='outline'
								className='rounded-full border bg-card'
								disabled={typesLoading}
							>
								{selectedTypeId ? selectedTypeName : '+ Type'}
								<ChevronDown className='ml-2 h-4 w-4' />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuRadioGroup
								value={selectedTypeId ?? 'all'}
								onValueChange={value => {
									onTypeChange(value === 'all' ? null : value)
								}}
							>
								<DropdownMenuRadioItem value='all'>All Types</DropdownMenuRadioItem>
								{types.map(type => (
									<DropdownMenuRadioItem key={type.id} value={type.id}>
										{type.name}
									</DropdownMenuRadioItem>
								))}
							</DropdownMenuRadioGroup>
						</DropdownMenuContent>
					</DropdownMenu>
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
