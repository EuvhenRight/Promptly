'use client'

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase'
import { collection, limit, orderBy, query, where } from 'firebase/firestore'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { BadgeCheck } from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '../ui/skeleton'
import type { PublicProfile } from '@/lib/types'


const VerifiedProfilesSkeleton = () => (
    <div className='flex flex-wrap gap-2'>
        {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className='flex items-center gap-2 px-3 py-2'>
                <Skeleton className='h-8 w-8 rounded-full' />
                <Skeleton className='h-4 w-20' />
            </div>
        ))}
    </div>
)


export default function VerifiedProfiles() {
    const firestore = useFirestore()
    const verifiedQuery = useMemoFirebase(
		() =>
			firestore
				? query(
						collection(firestore, 'public-profiles'),
						where('isVerified', '==', true),
						orderBy('createdAt', 'desc'),
						limit(10),
					)
				: null,
		[firestore],
	)
    const { data: verifiedProfiles, isLoading } = useCollection<PublicProfile>(verifiedQuery)


	return (
		<div className='space-y-4'>
			<h2 className='font-headline text-xl font-bold flex items-center gap-2'>
				<span>💎</span> Verified Profiles
			</h2>
            {isLoading ? (
                <VerifiedProfilesSkeleton />
            ) : !verifiedProfiles || verifiedProfiles.length === 0 ? (
                <p className='text-sm text-center text-muted-foreground py-4'>No verified profiles yet.</p>
            ) : (
                <div className='flex flex-wrap gap-2'>
                    {verifiedProfiles.map(member => (
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
                            <BadgeCheck className='h-4 w-4 text-primary shrink-0' />
                        </Link>
                    ))}
                </div>
            )}
		</div>
	)
}
