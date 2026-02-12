'use client'

import PromptFeed from '@/components/home/prompt-feed'
import SearchBar from '@/components/home/search-bar'
import SubHeader from '@/components/home/sub-header'
import Footer from '@/components/layout/footer'
import Header from '@/components/layout/header'
import { Skeleton } from '@/components/ui/skeleton'
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase'
import type { Cart } from '@/lib/types'
import { doc } from 'firebase/firestore'
import { usePromptsFeed, type SortByOption } from '@/hooks/use-prompts-feed'
import { useTypes } from '@/hooks/use-types'
import { Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDebounce } from 'use-debounce'

const mainLinks = ['Featured', 'Hot', 'New', 'Top']

const FeedSkeleton = () => (
	<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'>
		{Array.from({ length: 10 }).map((_, i) => (
			<div key={i} className='space-y-2'>
				<Skeleton className='h-64 w-full' />
				<Skeleton className='h-4 w-3/4' />
			</div>
		))}
	</div>
)

export default function Home() {
	const [activeFilter, setActiveFilter] = useState('Featured')
	const [activeFilterName, setActiveFilterName] = useState('Featured')
	const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
	const [selectedModelId, setSelectedModelId] = useState<string | null>(null)
	const [isInitialTypeSet, setIsInitialTypeSet] = useState(false)
	const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
		null,
	)
	const [selectedTagId, setSelectedTagId] = useState<string | null>(null)
	const [sortBy, setSortBy] = useState<SortByOption>('createdAt:desc')
	const [searchTerm, setSearchTerm] = useState('')
	const [debouncedSearchTerm] = useDebounce(searchTerm, 500)
	const { types, isLoading: typesLoading } = useTypes()
	const { user } = useUser()
	const firestore = useFirestore()
	const cartRef = useMemoFirebase(
		() =>
			user && firestore
				? doc(firestore, 'users', user.uid, 'carts', 'active')
				: null,
		[firestore, user],
	)
	const { data: cart } = useDoc<Cart>(cartRef)
	const cartPromptIds = useMemo(
		() => new Set(cart?.promptIds ?? []),
		[cart?.promptIds],
	)

	useEffect(() => {
		if (!typesLoading && types.length > 0 && !isInitialTypeSet) {
			const imagesType = types.find(t => t.name === 'Images')
			if (imagesType) {
				setSelectedTypeId(imagesType.id)
			}
			setIsInitialTypeSet(true)
		}
	}, [types, typesLoading, isInitialTypeSet])

	const handleFilterChange = (
		id: string,
		name?: string,
		type?: 'category' | 'tag' | 'main' | 'model',
	) => {
		setActiveFilter(id)
		setActiveFilterName(name || id)

		// Reset specific filters to start fresh
		setSelectedCategoryId(null)
		setSelectedTagId(null)
		setSelectedModelId(null)
		setSearchTerm('')

		if (type === 'main') {
			switch (id) {
				case 'Hot':
					setSortBy('stats.views:desc')
					break
				case 'Top':
					setSortBy('rating.average:desc')
					break
				case 'New':
				case 'Featured':
				default:
					setSortBy('createdAt:desc')
					break
			}
		} else {
			// If filtering by category, tag, or model, reset sorting to default (Newest)
			// This avoids confusion like "Top of Logos" when Top was previously selected.
			// The user can then use the sort dropdown if they wish.
			setSortBy('createdAt:desc')
			if (type === 'category') {
				setSelectedCategoryId(id)
			} else if (type === 'tag') {
				setSelectedTagId(id)
			} else if (type === 'model') {
				setSelectedModelId(id)
			}
		}
	}

	const handleTypeChange = (typeId: string | null) => {
		setSelectedTypeId(typeId)
	}

	const handleModelChange = (modelId: string | null) => {
		setSelectedModelId(modelId)
	}

	const handleSortChange = (newSortBy: SortByOption) => {
		setSortBy(newSortBy)
	}

	const handleSearch = (term: string) => {
		setSearchTerm(term)
		setActiveFilterName(term ? `"${term}"` : 'Featured')
		setActiveFilter(term ? 'search' : 'Featured')
		setSelectedCategoryId(null)
		setSelectedTagId(null)
	}

	const { prompts, loading, error, hasMore, loadMore, totalCount } =
		usePromptsFeed({
			categoryId: selectedCategoryId,
			typeId: selectedTypeId,
			tagId: selectedTagId,
			modelId: selectedModelId,
			sortBy,
			searchTerm: debouncedSearchTerm,
		})

	const observer = useRef<IntersectionObserver | null>(null)

	const loadMoreRef = useCallback(
		(node: HTMLDivElement) => {
			if (loading) return
			if (observer.current) observer.current.disconnect()

			observer.current = new IntersectionObserver(entries => {
				if (entries[0].isIntersecting && hasMore) {
					loadMore()
				}
			})

			if (node) observer.current.observe(node)
		},
		[loading, hasMore, loadMore],
	)

	return (
		<div className='flex min-h-screen flex-col bg-background'>
			<Header />
			<SubHeader
				activeFilter={activeFilter}
				onFilterChange={handleFilterChange}
				mainLinks={mainLinks}
			/>
			<main>
				<SearchBar
					activeFilter={activeFilterName}
					selectedTypeId={selectedTypeId}
					onTypeChange={handleTypeChange}
					selectedModelId={selectedModelId}
					onModelChange={handleModelChange}
					totalCount={totalCount}
					sortBy={sortBy}
					onSortChange={handleSortChange}
					searchTerm={searchTerm}
					onSearch={handleSearch}
					isLoading={loading}
				/>
				<div className='container mx-auto px-4 py-8 sm:px-6 lg:px-8'>
					{error && (
						<p className='text-destructive text-center'>
							Error: {error.message}
						</p>
					)}

					<PromptFeed prompts={prompts} cartPromptIds={cartPromptIds} />

					<div ref={loadMoreRef} />

					{loading && (
						<div className='mt-8 text-center'>
							{prompts.length === 0 ? (
								<FeedSkeleton />
							) : (
								<Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
							)}
						</div>
					)}

					{!hasMore && !loading && prompts.length > 0 && (
						<p className='mt-8 text-center text-muted-foreground'>
							You've reached the end!
						</p>
					)}
				</div>
			</main>
			<Footer />
		</div>
	)
}
