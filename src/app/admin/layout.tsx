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
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase'
import { signInWithGoogle, signOutUser } from '@/firebase/auth'
import { cn } from '@/lib/utils'
import type { UserProfile } from '@/lib/types'
import {
	Bot,
	Cpu,
	FileText,
	FileType,
	FolderOpen,
	Home,
	Image,
	Loader2,
	MessagesSquare,
	Tags,
	Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { doc } from 'firebase/firestore'

function AdminNavLink({
	href,
	children,
	icon: Icon,
}: {
	href: string
	children: React.ReactNode
	icon: React.ElementType
}) {
	const pathname = usePathname()
	const isActive = pathname === href
	return (
		<Link
			href={href}
			className={cn(
				'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
				isActive && 'bg-muted text-primary',
			)}
		>
			<Icon className='h-4 w-4' />
			{children}
		</Link>
	)
}

const GoogleIcon = () => (
	<svg viewBox='0 0 48' className='h-5 w-5'>
		<path
			fill='#FFC107'
			d='M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L38.802 8.922C34.962 5.518 29.8 3.5 24 3.5C11.31 3.5 1.5 13.31 1.5 26S11.31 48.5 24 48.5c11.438 0 20.286-8.38 21.6-19.199l.011-.217z'
		/>
		<path
			fill='#FF3D00'
			d='M6.306 14.691c2.242-2.85 5.484-4.691 9.194-4.691c3.059 0 5.842 1.154 7.961 3.039L29.263 12.2C25.423 8.796 20.262 6.5 15.5 6.5C9.933 6.5 4.952 9.658 1.453 14.168L6.306 14.691z'
		/>
		<path
			fill='#4CAF50'
			d='M24 48.5c5.757 0 10.938-2.117 14.7-5.571L32.5 36.93C30.01 39.205 27.205 40.5 24 40.5c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l6.04-6.04C34.963 5.518 29.802 3.5 24 3.5c-12.69 0-22.5 9.81-22.5 22.5S11.31 48.5 24 48.5z'
		/>
		<path
			fill='#1976D2'
			d='M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L38.802 8.922C34.962 5.518 29.8 3.5 24 3.5C11.31 3.5 1.5 13.31 1.5 26S11.31 48.5 24 48.5c11.438 0 20.286-8.38 21.6-19.199l.011-.217z'
		/>
	</svg>
)

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const { user, isUserLoading } = useUser()
	const firestore = useFirestore()
	const router = useRouter()

	const userProfileRef = useMemoFirebase(
		() => (user ? doc(firestore, 'users', user.uid) : null),
		[firestore, user],
	)
	const { data: userProfile, isLoading: isProfileLoading } =
		useDoc<UserProfile>(userProfileRef)

	useEffect(() => {
		const isAuthCheckComplete = !isUserLoading && !isProfileLoading

		if (isAuthCheckComplete) {
			if (!user || userProfile?.role !== 'admin') {
				// If user is not logged in OR is not an admin, redirect.
				router.replace('/')
			}
		}
	}, [user, userProfile, isUserLoading, isProfileLoading, router])

	// While we are checking auth and profile, show a loading screen.
	if (isUserLoading || isProfileLoading) {
		return (
			<div className='flex h-screen w-full items-center justify-center bg-background'>
				<Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
			</div>
		)
	}

	// If the profile is loaded but role is not admin, render nothing while redirecting.
	if (userProfile?.role !== 'admin') {
		return null
	}

	// Admin access is confirmed, render the layout
	return (
		<div className='grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]'>
			<div className='hidden border-r bg-muted/40 md:block'>
				<div className='flex h-full max-h-screen flex-col gap-2'>
					<div className='flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6'>
						<Link
							href='/admin'
							className='flex items-center gap-2 font-semibold'
						>
							<Bot className='h-6 w-6 text-primary' />
							<span className=''>Promptly Admin</span>
						</Link>
					</div>
					<div className='flex-1'>
						<nav className='grid items-start px-2 text-sm font-medium lg:px-4'>
							<AdminNavLink href='/admin' icon={Home}>
								Dashboard
							</AdminNavLink>
							<AdminNavLink href='/admin/prompts' icon={FileText}>
								Prompts
							</AdminNavLink>
							<AdminNavLink href='/admin/comments' icon={MessagesSquare}>
								Comments
							</AdminNavLink>
							<AdminNavLink href='/admin/categories' icon={FolderOpen}>
								Categories
							</AdminNavLink>
							<AdminNavLink href='/admin/tags' icon={Tags}>
								Tags
							</AdminNavLink>
							<AdminNavLink href='/admin/types' icon={FileType}>
								Types
							</AdminNavLink>
							<AdminNavLink href='/admin/models' icon={Cpu}>
								Models
							</AdminNavLink>
							<AdminNavLink href='/admin/search-bar-backgrounds' icon={Image}>
								Search Bar Background
							</AdminNavLink>
							<AdminNavLink href='/admin/users' icon={Users}>
								Users
							</AdminNavLink>
						</nav>
					</div>
				</div>
			</div>
			<div className='flex flex-col'>
				<header className='flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6'>
					<div className='w-full flex-1' />
					{isUserLoading ? (
						<div className='h-10 w-24 animate-pulse rounded-md bg-muted' />
					) : user ? (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant='secondary'
									size='icon'
									className='rounded-full'
								>
									<Avatar className='h-8 w-8'>
										<AvatarImage
											src={user.photoURL ?? ''}
											alt={user.displayName ?? 'Admin'}
										/>
										<AvatarFallback>
											{user.displayName?.charAt(0) ?? 'A'}
										</AvatarFallback>
									</Avatar>
									<span className='sr-only'>Toggle user menu</span>
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
									onClick={() => {
										signOutUser()
										router.push('/')
									}}
								>
									Logout
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					) : (
						<Button onClick={signInWithGoogle}>
							<GoogleIcon />
							Sign In with Google
						</Button>
					)}
				</header>
				<main className='flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6'>
					{children}
				</main>
			</div>
		</div>
	)
}
