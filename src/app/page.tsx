'use client'

import PromptFeed from '@/components/home/prompt-feed'
import SearchBar from '@/components/home/search-bar'
import SubHeader from '@/components/home/sub-header'
import Footer from '@/components/layout/footer'
import Header from '@/components/layout/header'
import { Skeleton } from '@/components/ui/skeleton'
import { usePromptsFeed } from '@/hooks/use-prompts-feed'
import { useTypes } from '@/hooks/use-types'
import { Loader2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

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
	const [isInitialTypeSet, setIsInitialTypeSet] = useState(false)
	const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
		null,
	)
	const [selectedTagId, setSelectedTagId] = useState<string | null>(null)
	const { types, isLoading: typesLoading } = useTypes()

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
		type?: 'category' | 'tag' | 'main',
	) => {
		setActiveFilter(id)
		setActiveFilterName(name || id)

		setSelectedCategoryId(null)
		setSelectedTagId(null)

		if (type === 'category') {
			setSelectedCategoryId(id)
		} else if (type === 'tag') {
			setSelectedTagId(id)
		}
	}

	const handleTypeChange = (typeId: string | null) => {
		setSelectedTypeId(typeId)
	}

	const { prompts, loading, error, hasMore, loadMore, totalCount } =
		usePromptsFeed({
			categoryId: selectedCategoryId,
			typeId: selectedTypeId,
			tagId: selectedTagId,
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
					totalCount={totalCount}
				/>
				<div className='container mx-auto px-4 py-8 sm:px-6 lg:px-8'>
					{error && (
						<p className='text-destructive text-center'>
							Error: {error.message}
						</p>
					)}

					<PromptFeed prompts={prompts} />

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
