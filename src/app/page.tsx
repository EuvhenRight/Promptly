'use client'

import PromptFeed from '@/components/home/prompt-feed'
import SearchBar from '@/components/home/search-bar'
import SubHeader from '@/components/home/sub-header'
import Footer from '@/components/layout/footer'
import Header from '@/components/layout/header'
import { Skeleton } from '@/components/ui/skeleton'
import { usePromptsFeed } from '@/hooks/use-prompts-feed'
import { Loader2 } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

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
	const selectedCategoryId = mainLinks.includes(activeFilter)
		? null
		: activeFilter
	const { prompts, loading, error, hasMore, loadMore } =
		usePromptsFeed(selectedCategoryId)

	const observer = useRef<IntersectionObserver | null>(null)

	// A callback ref to attach to the sentinel element.
	// This pattern is useful for re-creating the observer when dependencies change.
	const loadMoreRef = useCallback(
		(node: HTMLDivElement) => {
			if (loading) return // Don't set up observer while loading
			if (observer.current) observer.current.disconnect() // Disconnect previous observer

			// Create a new observer with the latest `hasMore` and `loadMore`
			observer.current = new IntersectionObserver(entries => {
				// If the sentinel is in view and there's more to load, call loadMore
				if (entries[0].isIntersecting && hasMore) {
					loadMore()
				}
			})

			// If the node exists, start observing it
			if (node) observer.current.observe(node)
		},
		[loading, hasMore, loadMore],
	)

	return (
		<div className='flex min-h-screen flex-col bg-background'>
			<Header />
			<SubHeader
				activeFilter={activeFilter}
				onFilterChange={setActiveFilter}
				mainLinks={mainLinks}
			/>
			<main>
				<SearchBar activeFilter={activeFilter} />
				<div className='container mx-auto px-4 py-8 sm:px-6 lg:px-8'>
					{error && (
						<p className='text-destructive text-center'>
							Error: {error.message}
						</p>
					)}

					<PromptFeed prompts={prompts} />

					{/* 
            This invisible div is the "sentinel". The IntersectionObserver watches it.
            When it scrolls into view, more content is loaded.
          */}
					<div ref={loadMoreRef} />

					{/* Loading indicator: show skeleton on initial load, spinner on subsequent loads */}
					{loading && (
						<div className='mt-8 text-center'>
							{prompts.length === 0 ? (
								<FeedSkeleton />
							) : (
								<Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
							)}
						</div>
					)}

					{/* End of content message: shown when there are no more prompts to load */}
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
