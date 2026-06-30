'use client'

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase'
import { collection, limit, orderBy, query } from 'firebase/firestore'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Trophy } from 'lucide-react'
import Link from 'next/link'
import type { PublicProfile } from '@/lib/types'
import { Skeleton } from '../ui/skeleton'

const MemberOfTheDaySkeleton = () => (
    <div className='flex flex-col items-center gap-3 p-6'>
        <Skeleton className='h-24 w-24 rounded-full' />
        <div className='text-center space-y-2'>
            <Skeleton className='h-5 w-32' />
            <Skeleton className='h-4 w-48' />
        </div>
    </div>
)

export default function MemberOfTheDay() {
    const firestore = useFirestore()
    const memberQuery = useMemoFirebase(
        () =>
            firestore
                ? query(
                    collection(firestore, 'public-profiles'),
                    orderBy('followers', 'desc'),
                    limit(1),
                )
                : null,
        [firestore],
    )
    const { data: members, isLoading } = useCollection<PublicProfile>(memberQuery)
    const member = members?.[0]

	return (
		<div className='space-y-4'>
			<h2 className='font-headline text-xl font-bold flex items-center gap-2'>
				<span>🏅</span> Member of the Day
			</h2>
            {isLoading ? (
                <MemberOfTheDaySkeleton />
            ) : !member ? (
                <p className='text-sm text-center text-muted-foreground py-4'>No member to feature today.</p>
            ) : (
                <Link
                    href={`/user/${member.username}`}
                    className='flex flex-col items-center gap-3 p-6 rounded-lg border bg-card hover:bg-muted/30 transition-colors group block'
                >
                    <Avatar className='h-24 w-24 group-hover:ring-2 group-hover:ring-primary'>
                        <AvatarImage
                            src={member.photoURL}
                            alt={member.displayName}
                        />
                        <AvatarFallback>
                            {member.displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className='text-center'>
                        <p className='font-semibold'>{member.displayName}</p>
                        <p className='text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1'>
                            <Trophy className='h-4 w-4' />
                            Top creator by followers
                        </p>
                    </div>
                </Link>
            )}
		</div>
	)
}
