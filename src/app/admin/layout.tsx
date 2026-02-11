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
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { useUser } from '@/firebase'
import { signOutUser } from '@/firebase/auth'
import { UserProfile } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
	Bot,
	Cpu,
	FileText,
	FileType,
	FolderOpen,
	Home,
	Image,
	Loader2,
	Menu,
	MessagesSquare,
	PanelLeft,
	PanelRight,
	Tags,
	Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

function AdminNavLink({
	href,
	children,
	icon: Icon,
	isCollapsed,
}: {
	href: string
	children: React.ReactNode
	icon: React.ElementType
	isCollapsed: boolean
}) {
	const pathname = usePathname()
	const isActive = pathname === href

	if (isCollapsed) {
		return (
			<TooltipProvider>
				<Tooltip delayDuration={0}>
					<TooltipTrigger asChild>
						<Link
							href={href}
							className={cn(
								'ml-[5px] flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-primary',
								isActive && 'bg-muted text-primary',
							)}
						>
							<Icon className='h-6 w-6' />
							<span className='sr-only'>{children}</span>
						</Link>
					</TooltipTrigger>
					<TooltipContent side='right'>{children}</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		)
	}

	return (
		<Link
			href={href}
			className={cn(
				'-ml-2.5 flex h-9 items-center gap-3 rounded-lg px-3 text-muted-foreground transition-all hover:text-primary',
				isActive && 'bg-muted text-primary',
			)}
		>
			<Icon className='h-6 w-6' />
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
	const [authStatus, setAuthStatus] = useState<
		'loading' | 'admin' | 'guest' | 'no_claim'
	>('loading')
	const router = useRouter()
	const [isCollapsed, setIsCollapsed] = useState(false)

	useEffect(() => {
		if (isUserLoading) {
			setAuthStatus('loading')
			return
		}

		if (!user) {
			setAuthStatus('guest')
			router.replace('/')
			return
		}

		// Force refresh the token to get the latest custom claims
		user
			.getIdTokenResult(true)
			.then(idTokenResult => {
				if (idTokenResult.claims.admin === true) {
					setAuthStatus('admin')
				} else {
					setAuthStatus('no_claim')
				}
			})
			.catch(() => {
				setAuthStatus('no_claim') // If token refresh fails, assume no claim
			})
	}, [user, isUserLoading, router])

	if (authStatus === 'loading') {
		return (
			<div className='flex h-screen w-full items-center justify-center bg-background'>
				<Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
			</div>
		)
	}

	if (authStatus === 'no_claim') {
		return (
			<div className='flex h-screen w-full items-center justify-center bg-background p-4'>
				<div className='text-center p-8 border rounded-lg shadow-lg max-w-md bg-card'>
					<h1 className='text-2xl font-bold text-destructive'>
						Access Denied
					</h1>
					<p className='mt-4 text-muted-foreground'>
						Your account does not have administrator privileges. The admin panel
						requires a special permission flag ('admin: true') which is not
						present in your current session.
					</p>
					<p className='mt-2 font-semibold text-foreground'>How to fix this:</p>
					<ul className='text-sm text-muted-foreground list-decimal list-inside text-left mt-2 space-y-1'>
						<li>
							Ensure an existing admin has run the 'set-admin.js' script for
							your User ID.
						</li>
						<li>
							Log out and log back in to refresh your authentication token with
							the new admin permission.
						</li>
					</ul>
					<Button
						onClick={() => signOutUser().then(() => router.push('/'))}
						className='mt-6'
					>
						Log Out and Go to Homepage
					</Button>
				</div>
			</div>
		)
	}

	if (authStatus !== 'admin') {
		// This handles the 'guest' case and any other unexpected state
		return (
			<div className='flex h-screen w-full items-center justify-center bg-background'>
				<Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
			</div>
		)
	}

	// Admin access is confirmed, render the layout
	return (
		<div
			className={cn(
				'grid min-h-screen w-full',
				isCollapsed
					? 'md:grid-cols-[64px_1fr]'
					: 'md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]',
			)}
		>
			<div className='hidden border-r bg-muted/40 md:block sticky top-0 h-screen'>
				<div className='flex h-full max-h-screen flex-col gap-2'>
					<div
						className={cn(
							'flex h-14 items-center border-b lg:h-[60px]',
							isCollapsed ? 'justify-center px-2' : 'px-4 lg:px-6',
						)}
					>
						<Link
							href='/admin'
							className='flex items-center gap-2 font-semibold'
						>
							<Bot className='h-6 w-6 text-primary' />
							{!isCollapsed && <span className=''>Promptly Admin</span>}
						</Link>
					</div>
					<div className='flex-1 overflow-auto py-2'>
						<nav
							className={cn(
								'grid items-start text-sm font-medium',
								isCollapsed ? 'px-2' : 'px-4',
							)}
						>
							<AdminNavLink href='/admin' icon={Home} isCollapsed={isCollapsed}>
								Dashboard
							</AdminNavLink>
							<AdminNavLink
								href='/admin/prompts'
								icon={FileText}
								isCollapsed={isCollapsed}
							>
								Prompts
							</AdminNavLink>
							<AdminNavLink
								href='/admin/comments'
								icon={MessagesSquare}
								isCollapsed={isCollapsed}
							>
								Comments
							</AdminNavLink>
							<AdminNavLink
								href='/admin/categories'
								icon={FolderOpen}
								isCollapsed={isCollapsed}
							>
								Categories
							</AdminNavLink>
							<AdminNavLink
								href='/admin/tags'
								icon={Tags}
								isCollapsed={isCollapsed}
							>
								Tags
							</AdminNavLink>
							<AdminNavLink
								href='/admin/types'
								icon={FileType}
								isCollapsed={isCollapsed}
							>
								Types
							</AdminNavLink>
							<AdminNavLink
								href='/admin/models'
								icon={Cpu}
								isCollapsed={isCollapsed}
							>
								Models
							</AdminNavLink>
							<AdminNavLink
								href='/admin/search-bar-backgrounds'
								icon={Image}
								isCollapsed={isCollapsed}
							>
								Search Bar Background
							</AdminNavLink>
							<AdminNavLink
								href='/admin/users'
								icon={Users}
								isCollapsed={isCollapsed}
							>
								Users
							</AdminNavLink>
						</nav>
					</div>
					<div className='mt-auto border-t p-2'>
						<Button
							variant='ghost'
							size='icon'
							className='w-full'
							onClick={() => setIsCollapsed(!isCollapsed)}
						>
							{isCollapsed ? (
								<PanelRight className='h-6 w-6' />
							) : (
								<PanelLeft className='h-6 w-6' />
							)}
							<span className='sr-only'>Toggle sidebar</span>
						</Button>
					</div>
				</div>
			</div>
			<div className='flex flex-col min-w-0'>
				<header className='flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6'>
					<Sheet>
						<SheetTrigger asChild>
							<Button
								variant='outline'
								size='icon'
								className='shrink-0 md:hidden'
							>
								<Menu className='h-6 w-6' />
								<span className='sr-only'>Toggle navigation menu</span>
							</Button>
						</SheetTrigger>
						<SheetContent side='left' className='flex flex-col p-0'>
							<SheetTitle className='sr-only'>Admin Menu</SheetTitle>
							<div className='flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6'>
								<Link
									href='/admin'
									className='flex items-center gap-2 font-semibold'
								>
									<Bot className='h-6 w-6 text-primary' />
									<span className=''>Promptly Admin</span>
								</Link>
							</div>
							<div className='flex-1 overflow-y-auto'>
								<nav className='grid items-start px-2 text-sm font-medium lg:px-4'>
									<AdminNavLink href='/admin' icon={Home} isCollapsed={false}>
										Dashboard
									</AdminNavLink>
									<AdminNavLink
										href='/admin/prompts'
										icon={FileText}
										isCollapsed={false}
									>
										Prompts
									</AdminNavLink>
									<AdminNavLink
										href='/admin/comments'
										icon={MessagesSquare}
										isCollapsed={false}
									>
										Comments
									</AdminNavLink>
									<AdminNavLink
										href='/admin/categories'
										icon={FolderOpen}
										isCollapsed={false}
									>
										Categories
									</AdminNavLink>
									<AdminNavLink
										href='/admin/tags'
										icon={Tags}
										isCollapsed={false}
									>
										Tags
									</AdminNavLink>
									<AdminNavLink
										href='/admin/types'
										icon={FileType}
										isCollapsed={false}
									>
										Types
									</AdminNavLink>
									<AdminNavLink
										href='/admin/models'
										icon={Cpu}
										isCollapsed={false}
									>
										Models
									</AdminNavLink>
									<AdminNavLink
										href='/admin/search-bar-backgrounds'
										icon={Image}
										isCollapsed={false}
									>
										Search Bar Background
									</AdminNavLink>
									<AdminNavLink
										href='/admin/users'
										icon={Users}
										isCollapsed={false}
									>
										Users
									</AdminNavLink>
								</nav>
							</div>
						</SheetContent>
					</Sheet>
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
									}}
								>
									Logout
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					) : (
						<Button onClick={() => {}}>
							<GoogleIcon />
							Sign In
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
