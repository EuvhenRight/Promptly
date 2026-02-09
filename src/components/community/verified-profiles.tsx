'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { VERIFIED_PROFILES } from '@/lib/community-data'
import { BadgeCheck } from 'lucide-react'
import Link from 'next/link'

export default function VerifiedProfiles() {
	return (
		<div className='space-y-4'>
			<h2 className='font-headline text-xl font-bold flex items-center gap-2'>
				<span>💎</span> Verified Profiles
			</h2>
			<div className='flex flex-wrap gap-2'>
				{VERIFIED_PROFILES.map(member => (
					<Link
						key={member.uid}
						href='#'
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
		</div>
	)
}
