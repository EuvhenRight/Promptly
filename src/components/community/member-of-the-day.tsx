'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MEMBER_OF_THE_DAY } from '@/lib/community-data'
import { Trophy } from 'lucide-react'
import Link from 'next/link'

export default function MemberOfTheDay() {
	return (
		<div className='space-y-4'>
			<h2 className='font-headline text-xl font-bold flex items-center gap-2'>
				<span>🏅</span> Member of the Day
			</h2>
			<Link
				href='#'
				className='flex flex-col items-center gap-3 p-6 rounded-lg border bg-card hover:bg-muted/30 transition-colors group block'
			>
				<Avatar className='h-24 w-24 group-hover:ring-2 group-hover:ring-primary'>
					<AvatarImage
						src={MEMBER_OF_THE_DAY.photoURL}
						alt={MEMBER_OF_THE_DAY.displayName}
					/>
					<AvatarFallback>
						{MEMBER_OF_THE_DAY.displayName.charAt(0).toUpperCase()}
					</AvatarFallback>
				</Avatar>
				<div className='text-center'>
					<p className='font-semibold'>{MEMBER_OF_THE_DAY.displayName}</p>
					<p className='text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1'>
						<Trophy className='h-4 w-4' />
						Most active creator today
					</p>
				</div>
			</Link>
		</div>
	)
}
