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
import {
	Sheet,
	SheetContent,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet'
import { NavContent } from '@/components/docs/doc-sidebar'
import { useUser } from '@/firebase'
import { signInWithGoogle, signOutUser } from '@/firebase/auth'
import { BookOpen, Menu } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

/**
 * Docs header bar for mobile/tablet (like Admin panel): Menu button + Docs title + user menu.
 * Visible only below lg breakpoint.
 */
export function DocsMobileHeader() {
	const [sheetOpen, setSheetOpen] = useState(false)
	const { user, isUserLoading } = useUser()
	const router = useRouter()

	return (
		<header className='flex h-14 shrink-0 items-center gap-4 border-b bg-muted/40 px-4 lg:hidden'>
			<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
				<SheetTrigger asChild>
					<Button
						variant='outline'
						size='icon'
						className='shrink-0'
						aria-label='Toggle documentation menu'
					>
						<Menu className='h-6 w-6' />
					</Button>
				</SheetTrigger>
				<SheetContent side='left' className='flex flex-col p-0 w-[280px] sm:max-w-[320px]'>
					<SheetTitle className='sr-only'>Documentation menu</SheetTitle>
					<div className='flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6'>
						<Link
							href='/docs'
							onClick={() => setSheetOpen(false)}
							className='flex items-center gap-2 font-semibold'
						>
							<BookOpen className='h-6 w-6 text-primary' />
							<span>Docs</span>
						</Link>
					</div>
					<div className='flex-1 overflow-y-auto'>
						<nav className='grid items-start gap-0.5 px-2 py-4 text-sm font-medium lg:px-4'>
							<NavContent onNavigate={() => setSheetOpen(false)} isCollapsed={false} />
						</nav>
					</div>
				</SheetContent>
			</Sheet>
			<Link
				href='/docs'
				className='flex shrink-0 items-center gap-2 font-semibold text-foreground'
			>
				<BookOpen className='h-6 w-6 text-primary' />
				<span>Docs</span>
			</Link>
			<div className='min-w-0 flex-1' />
			{isUserLoading ? (
				<div className='h-9 w-9 shrink-0 animate-pulse rounded-full bg-muted' />
			) : user ? (
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
							}}
						>
							Logout
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			) : (
				<Button size='sm' onClick={() => signInWithGoogle()} className='shrink-0'>
					Sign In
				</Button>
			)}
		</header>
	)
}
