'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { COMMUNITY_STREAKS } from '@/lib/community-data'
import { Flame } from 'lucide-react'
import Link from 'next/link'

export default function StreaksSection() {
	return (
		<div className='space-y-4'>
			<h2 className='font-headline text-xl font-bold flex items-center gap-2'>
				<span>🔥</span> Streaks
			</h2>
			<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
				{COMMUNITY_STREAKS.map(member => (
					<Link
						key={member.uid}
						href='#'
						className='flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors group'
					>
						<Avatar className='h-14 w-14 group-hover:ring-2 group-hover:ring-primary'>
							<AvatarImage src={member.photoURL} alt={member.displayName} />
							<AvatarFallback>
								{member.displayName.charAt(0).toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<span className='text-sm font-medium truncate max-w-full'>
							{member.displayName}
						</span>
						{member.streak != null && (
							<span className='flex items-center gap-1 text-xs text-amber-600 font-medium'>
								<Flame className='h-3.5 w-3.5' />
								{member.streak}
							</span>
						)}
					</Link>
				))}
			</div>
		</div>
	)
}
