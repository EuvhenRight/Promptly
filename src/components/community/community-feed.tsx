'use client'

import PromptFeed from '@/components/home/prompt-feed'
import { usePromptsFeed } from '@/hooks/use-prompts-feed'
import { useCallback, useMemo, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase'
import { doc } from 'firebase/firestore'
import type { Cart, UserProfile } from '@/lib/types'

const FeedSkeleton = () => (
	<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
		{Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className='space-y-2'>
			    <div className='w-full aspect-[4/3] animate-pulse rounded-2xl bg-muted' />
                <div className='h-4 w-3/4 animate-pulse rounded-md bg-muted' />
            </div>
		))}
	</div>
)

export default function CommunityFeed() {
    const { user } = useUser()
    const firestore = useFirestore()
	const { prompts, loading, error, hasMore, loadMore } = usePromptsFeed({
		sortBy: 'createdAt:desc',
        categoryId: null,
        typeId: null,
        tagId: null,
        modelId: null,
        searchTerm: null,
	})
    const observer = useRef<IntersectionObserver | null>(null)

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
    const isProOrAdmin = userProfile?.planId === 'pro' || userProfile?.role === 'admin'

    const visiblePrompts = useMemo(() => {
		if (isProOrAdmin) return prompts
		return prompts.filter(p => !p.isPrivate)
	}, [prompts, isProOrAdmin])

    const loadMoreRef = useCallback(
		(node: HTMLDivElement | null) => {
			if (loading) return
			if (observer.current) observer.current.disconnect()

			observer.current = new IntersectionObserver(
				entries => {
					if (entries[0] && entries[0].isIntersecting && hasMore) {
						loadMore()
					}
				},
				{ rootMargin: '400px' },
			)

			if (node) observer.current.observe(node)
		},
		[loading, hasMore, loadMore],
	)

	return (
		<div className='space-y-4'>
			<h2 className='font-headline text-xl font-bold flex items-center gap-2'>
				<span>✨</span> Latest Prompts
			</h2>
            {error && <p className='text-destructive'>Error loading prompts.</p>}
			
            <PromptFeed prompts={visiblePrompts} cartPromptIds={cartPromptIds} purchasedPromptIds={purchasedPromptIds} />

            <div ref={loadMoreRef} />

            {loading && (
                <div className='mt-8 text-center'>
                    {prompts.length === 0 ? <FeedSkeleton /> : <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />}
                </div>
            )}
		</div>
	)
}
