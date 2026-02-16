'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Crown, TrendingUp } from 'lucide-react'
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase'
import { collection, orderBy, query, limit } from 'firebase/firestore'
import Link from 'next/link'
import type { PublicProfile } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const TopCreatorsSkeleton = () => (
	<div className='space-y-4'>
		{Array.from({ length: 5 }).map((_, i) => (
			<div key={i} className='flex items-center gap-3'>
				<Skeleton className='h-10 w-10 rounded-full' />
				<div className='flex-1 space-y-1'>
					<Skeleton className='h-4 w-24' />
					<Skeleton className='h-3 w-16' />
				</div>
			</div>
		))}
	</div>
)

const CreatorList = ({ creators }: { creators: PublicProfile[] }) => (
	<div className='space-y-4'>
		{creators.map((creator, index) => (
			<Link
				href={`/user/${creator.username}`}
				key={creator.uid}
				className='flex items-center gap-4 group'
			>
				<span className='text-lg font-bold text-muted-foreground w-6 text-center'>
					{index + 1}
				</span>
				<Avatar className='h-10 w-10'>
					<AvatarImage src={creator.photoURL} alt={creator.displayName} />
					<AvatarFallback>
						{creator.displayName.charAt(0).toUpperCase()}
					</AvatarFallback>
				</Avatar>
				<div className='flex-grow min-w-0'>
					<p className='font-semibold group-hover:text-primary truncate'>
						{creator.displayName}
					</p>
					<p className='text-sm text-muted-foreground'>
						{creator.followers?.toLocaleString() ?? 0} followers
					</p>
				</div>
				{index === 0 && <Crown className='h-6 w-6 text-yellow-500' />}
			</Link>
		))}
	</div>
)

export default function TopCreatorsWidget({
	className,
}: {
	className?: string
}) {
	const firestore = useFirestore()

	const topCreatorsQuery = useMemoFirebase(
		() =>
			firestore
				? query(
						collection(firestore, 'public-profiles'),
						orderBy('followers', 'desc'),
						limit(5),
					)
				: null,
		[firestore],
	)

	const { data: topCreators, isLoading } =
		useCollection<PublicProfile>(topCreatorsQuery)

	return (
		<aside className={cn('space-y-6', className)}>
			<div className='sticky top-24'>
				<Card>
					<CardHeader>
						<CardTitle className='font-headline text-2xl flex items-center gap-2'>
							<TrendingUp className='h-6 w-6' /> Top Creators
						</CardTitle>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<TopCreatorsSkeleton />
						) : !topCreators || topCreators.length === 0 ? (
							<p className='text-sm text-muted-foreground text-center py-4'>
								No creators found yet.
							</p>
						) : (
							<CreatorList creators={topCreators} />
						)}
					</CardContent>
				</Card>
			</div>
		</aside>
	)
}
