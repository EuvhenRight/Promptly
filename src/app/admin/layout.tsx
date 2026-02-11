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
import { signInWithGoogle, signOutUser } from '@/firebase/auth'
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
						onClick={async () => {
							await signOutUser()
							router.push('/')
						}}
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
									onClick={async () => {
										await signOutUser()
									}}
								>
									Logout
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					) : (
						<Button onClick={() => signInWithGoogle()}>
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
