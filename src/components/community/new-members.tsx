'use client'

import {
	useCollection,
	useFirestore,
	useMemoFirebase,
} from '@/firebase'
import {
	collection,
	orderBy,
	query,
	limit,
} from 'firebase/firestore'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { Skeleton } from '../ui/skeleton'
import type { PublicProfile } from '@/lib/types'

const NewMembersSkeleton = () => (
    <div className='space-y-2'>
        {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className='flex items-center gap-2 px-3 py-2'>
                <Skeleton className='h-8 w-8 rounded-full' />
                <Skeleton className='h-4 w-24' />
            </div>
        ))}
    </div>
)

export default function NewMembers() {
    const firestore = useFirestore()

    const newMembersQuery = useMemoFirebase(
		() =>
			firestore
				? query(
						collection(firestore, 'public-profiles'),
						orderBy('createdAt', 'desc'),
						limit(10),
					)
				: null,
		[firestore],
	)

    const { data: newMembers, isLoading } = useCollection<PublicProfile>(newMembersQuery)

	return (
		<div className='space-y-4'>
			<h2 className='font-headline text-xl font-bold flex items-center gap-2'>
				<span>👋</span> New Members
			</h2>
			{isLoading ? (
                <NewMembersSkeleton />
            ) : !newMembers || newMembers.length === 0 ? (
                <p className='text-sm text-muted-foreground text-center py-4'>No new members yet.</p>
            ) : (
                <div className='flex flex-wrap gap-2'>
                    {newMembers.map(member => (
                        <Link
                            key={member.uid}
                            href={`/user/${member.username}`}
                            className='flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors group'
                        >
                            <Avatar className='h-8 w-8'>
                                <AvatarImage src={member.photoURL} alt={member.displayName} />
                                <AvatarFallback>
                                    {member.displayName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <span className='text-sm font-medium truncate max-w-[100px]'>
                                {member.displayName}
                            </span>
                        </Link>
                    ))}
                </div>
            )}
		</div>
	)
}
