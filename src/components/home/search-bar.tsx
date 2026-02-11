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
import { useModels } from '@/hooks/use-models'
import { type SortByOption } from '@/hooks/use-prompts-feed'
import { useTypes } from '@/hooks/use-types'
import { ArrowDownUp, ChevronDown, Loader2, Search } from 'lucide-react'
import { useEffect, useState } from 'react'

const sortOptions: { label: string; value: SortByOption }[] = [
	{ label: 'Newest', value: 'createdAt:desc' },
	{ label: 'Popularity', value: 'stats.views:desc' },
	{ label: 'Top Rated', value: 'rating.average:desc' },
	{ label: 'Price: Low to High', value: 'price:asc' },
	{ label: 'Price: High to Low', value: 'price:desc' },
]

interface SearchBarProps {
	activeFilter: string
	selectedTypeId: string | null
	onTypeChange: (typeId: string | null) => void
	selectedModelId: string | null
	onModelChange: (modelId: string | null) => void
	totalCount: number | null
	sortBy: SortByOption
	onSortChange: (sortBy: SortByOption) => void
	searchTerm: string
	onSearch: (term: string) => void
	isLoading: boolean
}

export default function SearchBar({
	activeFilter,
	selectedTypeId,
	onTypeChange,
	selectedModelId,
	onModelChange,
	totalCount,
	sortBy,
	onSortChange,
	searchTerm,
	onSearch,
	isLoading,
}: SearchBarProps) {
	const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(
		null,
	)
	const { types, isLoading: typesLoading } = useTypes()
	const { models, isLoading: modelsLoading } = useModels()

	const currentTitle = `${activeFilter} Prompts`
	const resultsText =
		totalCount !== null
			? `About ${totalCount.toLocaleString()} results`
			: 'Loading results...'

	const selectedTypeName =
		types.find(t => t.id === selectedTypeId)?.name || 'Type'
	const selectedModelName =
		models.find(m => m.id === selectedModelId)?.name || 'Model'

	const selectedSortLabel =
		sortOptions.find(o => o.value === sortBy)?.label || 'Sort'

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
			<div className='relative z-10 mx-auto flex w-full max-w-screen-2xl flex-col items-center gap-12 px-6 py-16 text-center sm:py-10 lg:py-16'>
				<h1 className='search-bar-title text-4xl md:text-5xl lg:text-6xl font-black font-headline tracking-tight'>
					{currentTitle}
				</h1>
				<p className='search-bar-subtitle text-lg'>{resultsText}</p>

				<div className='w-full max-w-3xl'>
					<form
						className='relative'
						onSubmit={e => {
							e.preventDefault()
							// onSearch is already called via onChange
						}}
					>
						<div className='relative flex items-center w-full h-16 bg-card border rounded-full shadow-lg shadow-primary/10'>
							<Search className='absolute left-6 h-6 w-6 text-muted-foreground' />
							<Input
								placeholder='Search for prompts, models, or inspiration…'
								className='pl-16 pr-32 h-full text-base rounded-full bg-transparent border-0 focus-visible:ring-0'
								value={searchTerm}
								onChange={e => onSearch(e.target.value)}
							/>
							<div className='absolute right-2 top-1/2 -translate-y-1/2'>
								<Button
									type='submit'
									className='rounded-full bg-foreground text-background hover:bg-primary hover:text-primary-foreground h-12 px-8'
									disabled={isLoading}
								>
									{isLoading ? <Loader2 className='animate-spin' /> : 'Search'}
								</Button>
							</div>
						</div>
					</form>
				</div>

				<div className='flex flex-wrap justify-center items-center gap-3'>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant='outline'
								className='rounded-full border bg-card hover:text-primary dark:hover:text-primary'
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
								<DropdownMenuRadioItem value='all'>
									All Types
								</DropdownMenuRadioItem>
								{types.map(type => (
									<DropdownMenuRadioItem key={type.id} value={type.id}>
										{type.name}
									</DropdownMenuRadioItem>
								))}
							</DropdownMenuRadioGroup>
						</DropdownMenuContent>
					</DropdownMenu>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant='outline'
								className='rounded-full border bg-card hover:text-primary dark:hover:text-primary'
								disabled={modelsLoading}
							>
								{selectedModelId ? selectedModelName : '+ Model'}
								<ChevronDown className='ml-2 h-4 w-4' />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuLabel>Filter by Model</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuRadioGroup
								value={selectedModelId ?? 'all'}
								onValueChange={value => {
									onModelChange(value === 'all' ? null : value)
								}}
							>
								<DropdownMenuRadioItem value='all'>
									All Models
								</DropdownMenuRadioItem>
								{models.map(model => (
									<DropdownMenuRadioItem key={model.id} value={model.id}>
										{model.name}
									</DropdownMenuRadioItem>
								))}
							</DropdownMenuRadioGroup>
						</DropdownMenuContent>
					</DropdownMenu>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant='outline'
								className='rounded-full border bg-card hover:text-primary dark:hover:text-primary'
							>
								{selectedSortLabel}
								<ArrowDownUp className='ml-2 h-4 w-4' />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuLabel>Sort by</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuRadioGroup
								value={sortBy}
								onValueChange={value => onSortChange(value as SortByOption)}
							>
								{sortOptions.map(option => (
									<DropdownMenuRadioItem
										key={option.value}
										value={option.value}
									>
										{option.label}
									</DropdownMenuRadioItem>
								))}
							</DropdownMenuRadioGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</section>
	)
}
