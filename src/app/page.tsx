'use client'

import { signInWithGoogle } from '@/firebase/auth'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import PromptFeed from '@/components/home/prompt-feed'
import SearchBar from '@/components/home/search-bar'
import SubHeader from '@/components/home/sub-header'
import Footer from '@/components/layout/footer'
import Header from '@/components/layout/header'
import { Skeleton } from '@/components/ui/skeleton'
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase'
import type { Cart, UserProfile } from '@/lib/types'
import { doc } from 'firebase/firestore'
import { usePromptsFeed, type SortByOption } from '@/hooks/use-prompts-feed'
import { Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDebounce } from 'use-debounce'
import { Button } from '@/components/ui/button'
import { useScrollDirection } from '@/hooks/useScrollDirection'

function AuthModal({
	open,
	onOpenChange,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='sm:max-w-md text-center p-8'>
				<DialogHeader className='space-y-4'>
					<DialogTitle className='font-headline text-3xl font-bold tracking-tight text-center'>
						Unlock Millions of Prompts
					</DialogTitle>
					<DialogDescription className='text-center text-lg text-muted-foreground'>
						Sign in to continue exploring and creating.
					</DialogDescription>
				</DialogHeader>
				<div className='py-6'>
					<Button
						size='lg'
						className='w-full'
						onClick={() => signInWithGoogle()}
					>
						<svg
							width='24'
							height='24'
							viewBox='0 0 24 24'
							fill='none'
							xmlns='http://www.w3.org/2000/svg'
							className='mr-3'
						>
							<path
								d='M22.56 12.25C22.56 11.42 22.49 10.61 22.34 9.82H12V14.45H18.47C18.18 16.02 17.34 17.35 16.08 18.22V20.75H19.95C21.66 19.01 22.56 16.25 22.56 12.25Z'
								fill='#4285F4'
							/>
							<path
								d='M12 23C14.97 23 17.45 22.09 19.13 20.43L15.25 17.9C14.2 18.59 12.89 19 11.2 19C8.36 19 5.92 17.27 5.09 14.85H1.08V17.4C2.76 20.69 6.2 23 12 23Z'
								fill='#34A853'
							/>
							<path
								d='M5.09 14.85C4.89 14.25 4.78 13.62 4.78 12.98C4.78 12.35 4.89 11.71 5.09 11.12V8.58H1.08C0.38 9.94 0 11.4 0 12.98C0 14.57 0.38 16.03 1.08 17.4L5.09 14.85Z'
								fill='#FBBC05'
							/>
							<path
								d='M12 4.98C13.68 4.98 15.08 5.58 16.14 6.6L19.21 3.54C17.45 1.93 14.97 1 12 1C6.2 1 2.76 4.31 1.08 8.58L5.09 11.12C5.92 8.73 8.36 6.98 12 6.98'
								fill='#EA4335'
							/>
						</svg>
						Sign in with Google
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}

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
	const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
		null,
	)
	const [selectedTagId, setSelectedTagId] = useState<string | null>(null)
	const [sortBy, setSortBy] = useState<SortByOption>('createdAt:desc')
	const [searchTerm, setSearchTerm] = useState('')
	const [debouncedSearchTerm] = useDebounce(searchTerm, 500)
	const [showPrivateOnly, setShowPrivateOnly] = useState(false)
	const { user } = useUser()
	const firestore = useFirestore()
	const [hideMyPrompts, setHideMyPrompts] = useState(false)
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
	const [isScrolled, setIsScrolled] = useState(false)
	const scrollDir = useScrollDirection()

	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 200)
		}
		window.addEventListener('scroll', handleScroll, { passive: true })
		return () => window.removeEventListener('scroll', handleScroll)
	}, [])

	useEffect(() => {
		const stored = localStorage.getItem('hideMyPrompts')
		if (stored) {
			setHideMyPrompts(JSON.parse(stored) === true)
		}
	}, [])

	const userProfileRef = useMemoFirebase(
		() => (user ? doc(firestore, 'users', user.uid) : null),
		[firestore, user],
	)
	const { data: userProfile } = useDoc<UserProfile>(userProfileRef)

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
	const purchasedPromptIds = useMemo(
		() => new Set(userProfile?.purchasedPrompts ?? []),
		[userProfile?.purchasedPrompts],
	)
	const isProOrAdmin =
		userProfile?.planId === 'pro' || userProfile?.role === 'admin'

	const handleFilterChange = (
		id: string,
		name?: string,
		type?: 'category' | 'tag' | 'main' | 'model' | 'pro',
	) => {
		setActiveFilter(id)
		setActiveFilterName(name || id)

		// Reset specific filters to start fresh
		setSelectedCategoryId(null)
		setSelectedTagId(null)
		setSelectedModelId(null)
		setSearchTerm('')
		setShowPrivateOnly(false)

		if (type === 'pro') {
			setShowPrivateOnly(true)
		} else if (type === 'main') {
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

		// Only sync main filter links if no content filter is active
		const isContentFilterActive =
			selectedCategoryId ||
			selectedTagId ||
			selectedModelId ||
			searchTerm ||
			showPrivateOnly
		if (isContentFilterActive) {
			return
		}

		// Sync the active main filter based on the sort selection
		if (newSortBy === 'createdAt:desc') {
			if (activeFilter !== 'Featured') {
				setActiveFilter('New')
			}
		} else if (newSortBy === 'stats.views:desc') {
			setActiveFilter('Hot')
		} else if (newSortBy === 'rating.average:desc') {
			setActiveFilter('Top')
		} else {
			// This is for price sorting. If a main filter is active, deselect it.
			if (['Featured', 'Hot', 'New', 'Top'].includes(activeFilter)) {
				setActiveFilter('') // An empty string won't match any link, so none will be highlighted.
			}
		}
	}

	const handleSearch = (term: string) => {
		setSearchTerm(term)
		setActiveFilterName(term ? `"${term}"` : 'Featured')
		setActiveFilter(term ? 'search' : 'Featured')
		setSelectedCategoryId(null)
		setSelectedTagId(null)
		setShowPrivateOnly(false)
	}

	const { prompts, loading, error, hasMore, loadMore, totalCount } =
		usePromptsFeed({
			categoryId: selectedCategoryId,
			typeId: selectedTypeId,
			tagId: selectedTagId,
			modelId: selectedModelId,
			sortBy,
			searchTerm: debouncedSearchTerm,
			privateOnly: showPrivateOnly,
			excludeAuthorId: hideMyPrompts ? user?.uid : null,
		})

	const observer = useRef<IntersectionObserver | null>(null)

	const visiblePrompts = useMemo(() => {
		if (isProOrAdmin) return prompts
		return prompts.filter(p => !p.isPrivate)
	}, [prompts, isProOrAdmin])

	const shouldShowPaywall = !user && prompts.length >= 30

	// Effect to block scrolling when auth modal is open
	useEffect(() => {
		if (isAuthModalOpen) {
			document.body.style.overflow = 'hidden'
		} else {
			document.body.style.overflow = ''
		}
		// Cleanup function to ensure scroll is re-enabled on unmount
		return () => {
			document.body.style.overflow = ''
		}
	}, [isAuthModalOpen])

	const loadMoreRef = useCallback(
		(node: HTMLDivElement | null) => {
			if (loading) return
			if (observer.current) observer.current.disconnect()

			observer.current = new IntersectionObserver(
				entries => {
					if (entries[0] && entries[0].isIntersecting && hasMore) {
						if (shouldShowPaywall) {
							setIsAuthModalOpen(true)
						} else {
							loadMore()
						}
					}
				},
				{
					rootMargin: '600px',
				},
			)

			if (node) observer.current.observe(node)
		},
		[loading, hasMore, loadMore, shouldShowPaywall],
	)

	const isHeaderHidden = scrollDir === 'down' && isScrolled && !isAuthModalOpen

	return (
		<div className='flex min-h-screen flex-col bg-background'>
			<Header isHidden={isHeaderHidden} />
			<SubHeader
				isHidden={isHeaderHidden}
				activeFilter={activeFilter}
				onFilterChange={handleFilterChange}
				mainLinks={mainLinks}
				userProfile={userProfile}
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
						<div className='text-destructive text-center py-4 space-y-2'>
							<p>Error loading prompts: {error.message}</p>
							{/index|Index/.test(String(error?.message)) && (
								<p className='text-sm text-muted-foreground'>
									Try clearing filters or run{' '}
									<code className='text-xs'>firebase deploy --only firestore:indexes</code>{' '}
									to deploy indexes.
								</p>
							)}
						</div>
					)}

					{!loading &&
					!error &&
					(visiblePrompts.length === 0 || totalCount === 0) ? (
						<div
							className='flex flex-col items-center justify-center py-20 px-4 text-center min-h-[200px]'
							role='status'
							aria-live='polite'
						>
							<p className='text-lg font-semibold text-foreground'>
								No prompts found
							</p>
							<p className='mt-2 text-sm text-muted-foreground'>
								Try adjusting your filters or search terms
							</p>
						</div>
					) : null}

					<PromptFeed
						prompts={visiblePrompts}
						cartPromptIds={cartPromptIds}
						purchasedPromptIds={purchasedPromptIds}
					/>

					<div ref={loadMoreRef} />

					{shouldShowPaywall && !isAuthModalOpen && (
						<div className='flex flex-col items-center  text-center space-y-4 my-8'>
							<h2 className='font-headline text-3xl font-bold'>
								Sign in to unlock millions more prompts
							</h2>
							<Button size='lg' onClick={() => signInWithGoogle()}>
								<svg
									width='24'
									height='24'
									viewBox='0 0 24 24'
									fill='none'
									xmlns='http://www.w3.org/2000/svg'
									className='mr-3'
								>
									<path
										d='M22.56 12.25C22.56 11.42 22.49 10.61 22.34 9.82H12V14.45H18.47C18.18 16.02 17.34 17.35 16.08 18.22V20.75H19.95C21.66 19.01 22.56 16.25 22.56 12.25Z'
										fill='#4285F4'
									/>
									<path
										d='M12 23C14.97 23 17.45 22.09 19.13 20.43L15.25 17.9C14.2 18.59 12.89 19 11.2 19C8.36 19 5.92 17.27 5.09 14.85H1.08V17.4C2.76 20.69 6.2 23 12 23Z'
										fill='#34A853'
									/>
									<path
										d='M5.09 14.85C4.89 14.25 4.78 13.62 4.78 12.98C4.78 12.35 4.89 11.71 5.09 11.12V8.58H1.08C0.38 9.94 0 11.4 0 12.98C0 14.57 0.38 16.03 1.08 17.4L5.09 14.85Z'
										fill='#FBBC05'
									/>
									<path
										d='M12 4.98C13.68 4.98 15.08 5.58 16.14 6.6L19.21 3.54C17.45 1.93 14.97 1 12 1C6.2 1 2.76 4.31 1.08 8.58L5.09 11.12C5.92 8.73 8.36 6.98 12 6.98'
										fill='#EA4335'
									/>
								</svg>
								Sign in with Google
							</Button>
						</div>
					)}

					<AuthModal
						open={isAuthModalOpen}
						onOpenChange={setIsAuthModalOpen}
					/>

					{loading && (
						<div className='mt-8 text-center'>
							{prompts.length === 0 ? (
								<FeedSkeleton />
							) : (
								<Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
							)}
						</div>
					)}

					{!hasMore &&
						!loading &&
						prompts.length > 0 &&
						!shouldShowPaywall && (
							<p className='mt-8 text-center text-muted-foreground'>
								You've reached the end!
							</p>
						)}
				</div>
			</main>
			{(!shouldShowPaywall || (shouldShowPaywall && !isAuthModalOpen)) && (
				<Footer />
			)}
		</div>
	)
}
