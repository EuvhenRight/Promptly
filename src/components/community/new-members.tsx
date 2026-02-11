'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { NEW_MEMBERS } from '@/lib/community-data'
import Link from 'next/link'

export default function NewMembers() {
	return (
		<div className='space-y-4'>
			<h2 className='font-headline text-xl font-bold flex items-center gap-2'>
				<span>👋</span> New Members
			</h2>
			<div className='flex flex-wrap gap-2'>
				{NEW_MEMBERS.map(member => (
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
		</div>
	)
}
