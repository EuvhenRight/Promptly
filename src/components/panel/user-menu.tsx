'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useUser } from '@/firebase'
import { signInWithGoogle, signOutUser } from '@/firebase/auth'
import { useRouter } from 'next/navigation'

/**
 * Reusable user menu: avatar dropdown with Back to App + Logout (or Sign In).
 * Used in admin panel and docs header.
 */
export function UserMenu() {
	const { user, isUserLoading } = useUser()
	const router = useRouter()

	if (isUserLoading) {
		return (
			<div
				className='h-9 w-9 shrink-0 animate-pulse rounded-full bg-muted'
				aria-hidden
			/>
		)
	}

	if (!user) {
		return (
			<Button size='sm' onClick={() => signInWithGoogle()} className='shrink-0'>
				Sign In
			</Button>
		)
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant='secondary'
					size='icon'
					className='shrink-0 rounded-full'
					aria-label='Toggle user menu'
				>
					<Avatar className='h-8 w-8'>
						<AvatarImage
							src={user.photoURL ?? ''}
							alt={user.displayName ?? 'User'}
						/>
						<AvatarFallback>
							{user.displayName?.charAt(0) ?? 'U'}
						</AvatarFallback>
					</Avatar>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end'>
				<DropdownMenuLabel>{user.displayName}</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={() => router.push('/')}>
					Back to App
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={async () => {
						await signOutUser()
						router.push('/')
					}}
				>
					Logout
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
