'use client'
import { Button } from '@/components/ui/button'
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet'
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase'
import { signInWithGoogle, signOutUser } from '@/firebase/auth'
import type { Cart, UserProfile } from '@/lib/types'
import { doc } from 'firebase/firestore'
import {
	Bell,
	Bot,
	Coins,
	LogOut,
	Menu,
	PlusCircle,
	Settings,
	ShieldCheck,
	ShoppingBag,
	Star,
	Upload,
	User,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '../ui/dropdown-menu'

export default function Header() {
	const { user, isUserLoading } = useUser()
	const firestore = useFirestore()
	const router = useRouter()

	const userProfileRef = useMemoFirebase(
		() => (user ? doc(firestore, 'users', user.uid) : null),
		[firestore, user],
	)
	const { data: userProfile } = useDoc<UserProfile>(userProfileRef)

	const cartRef = useMemoFirebase(
		() => (user ? doc(firestore, 'users', user.uid, 'carts', 'active') : null),
		[firestore, user],
	)
	const { data: cart } = useDoc<Cart>(cartRef)
	const cartCount = cart?.promptIds?.length ?? 0
	const credits = userProfile?.credits ?? 0

	const pricingUrl = user ? '/account/plans' : '/plans'

	return (
		<header className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
			<div className='container mx-auto flex h-16 items-center px-4 sm:px-6 lg:px-8'>
				<div className='flex flex-shrink-0 items-center gap-2'>
					<Link href='/' className='flex items-center gap-2'>
						<Bot className='h-6 w-6 text-primary' />
						<span className='font-headline text-xl font-bold'>Promptly</span>
					</Link>
				</div>

				<div className='md:hidden ml-2'>
					<Sheet>
						<SheetTrigger asChild>
							<Button
								variant='ghost'
								size='icon'
								className='hover:bg-transparent dark:hover:bg-transparent hover:text-accent dark:hover:text-primary'
							>
								<Menu className='h-6 w-6' />
								<span className='sr-only'>Toggle Menu</span>
							</Button>
						</SheetTrigger>
						<SheetContent side='left'>
							<SheetHeader>
								<SheetTitle>
									<Link href='/' className='flex items-center gap-2'>
										<Bot className='h-6 w-6 text-primary' />
										<span className='font-headline text-xl font-bold'>
											Promptly
										</span>
									</Link>
								</SheetTitle>
							</SheetHeader>
							<div className='mt-8 flex flex-col gap-4'>
								<nav className='mt-4 flex flex-col gap-2'>
									<Button variant='ghost' asChild className='justify-start'>
										<Link href='/cart'>
											<ShoppingBag className='mr-2 h-4 w-4' />
											Cart {cartCount > 0 && `(${cartCount})`}
										</Link>
									</Button>
									<Button variant='ghost' asChild className='justify-start'>
										<Link href={pricingUrl}>Pricing</Link>
									</Button>
									<Button variant='ghost' asChild className='justify-start'>
										<Link href='/community'>Community</Link>
									</Button>
								</nav>
							</div>
						</SheetContent>
					</Sheet>
				</div>

				<div className='hidden md:flex items-center gap-6 ml-10'>
					<nav className='flex items-center gap-6 text-sm'>
						<Link
							href={pricingUrl}
							className='transition-colors text-foreground/80 font-medium hover:text-accent dark:hover:text-primary'
						>
							Pricing
						</Link>
						<Link
							href='/community'
							className='transition-colors text-foreground/80 font-medium hover:text-accent dark:hover:text-primary'
						>
							Community
						</Link>
					</nav>
				</div>

				<div className='flex-1' />

				<div className='flex flex-shrink-0 items-center gap-2'>
					<Link href='/cart' className='hidden md:flex items-center group/cart'>
						<Button
							variant='ghost'
							size='icon'
							className='relative h-12 w-12 hover:bg-transparent dark:hover:bg-transparent hover:text-accent dark:hover:text-primary'
						>
							<ShoppingBag
								className='h-8 w-8 text-foreground transition-colors group-hover/cart:text-accent dark:group-hover/cart:text-primary'
								strokeWidth={1.5}
							/>
							{cartCount > 0 && (
								<span
									className='absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground'
									aria-label={`${cartCount} items in cart`}
								>
									{cartCount > 99 ? '99+' : cartCount}
								</span>
							)}
							<span className='sr-only'>
								Cart{cartCount > 0 ? ` (${cartCount} items)` : ''}
							</span>
						</Button>
					</Link>

					{isUserLoading ? (
						<div className='h-10 w-24 animate-pulse rounded-md bg-muted' />
					) : user ? (
						<>
							<Button
								variant='ghost'
								asChild
								className='hover:bg-transparent dark:hover:bg-transparent hover:text-accent dark:hover:text-primary'
							>
								<Link href='/submit'>
									<PlusCircle className='mr-2 h-4 w-4' />
									Create
								</Link>
							</Button>
							<Button
								variant='ghost'
								asChild
								className='hidden sm:inline-flex hover:bg-transparent dark:hover:bg-transparent hover:text-accent dark:hover:text-primary'
							>
								<Link
									href='/account/plans'
									title={`${credits} credits`}
									aria-label={`${credits} credits`}
								>
									<Coins className='mr-2 h-4 w-4' />
									{credits > 999 ? `${(credits / 1000).toFixed(1)}k` : credits}
								</Link>
							</Button>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant='ghost'
										className='relative h-10 w-10 rounded-full hover:bg-transparent dark:hover:bg-transparent'
									>
										<Avatar className='h-10 w-10'>
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
								<DropdownMenuContent className='w-64' align='end' forceMount>
									<DropdownMenuLabel className='font-normal'>
										<div className='flex items-center gap-3'>
											<Avatar className='h-10 w-10'>
												<AvatarImage
													src={userProfile?.photoURL ?? user.photoURL ?? ''}
													alt={user.displayName ?? 'User'}
												/>
												<AvatarFallback>
													{(
														userProfile?.displayName ??
														user.displayName ??
														'U'
													).charAt(0)}
												</AvatarFallback>
											</Avatar>
											<div className='flex flex-col space-y-0.5'>
												<p className='text-sm font-medium leading-none'>
													{user.email}
												</p>
												<p className='text-xs leading-none text-muted-foreground'>
													{userProfile?.displayName ?? user.displayName}
												</p>
											</div>
										</div>
									</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<DropdownMenuItem onSelect={() => router.push('/account')}>
										<Settings className='mr-2 h-4 w-4' />
										<span>Account Settings</span>
									</DropdownMenuItem>
									<DropdownMenuItem
										onSelect={() => router.push('/account/plans')}
									>
										<Star className='mr-2 h-4 w-4' />
										<span>Plans & Credits</span>
									</DropdownMenuItem>
									<DropdownMenuItem
										onSelect={() => router.push('/account/notifications')}
									>
										<Bell className='mr-2 h-4 w-4' />
										<span>Notifications</span>
									</DropdownMenuItem>
									<DropdownMenuItem
										onSelect={() => router.push('/account/profile')}
									>
										<User className='mr-2 h-4 w-4' />
										<span>My Profile</span>
									</DropdownMenuItem>
									<DropdownMenuItem onSelect={() => router.push('/submit')}>
										<Upload className='mr-2 h-4 w-4' />
										<span>Submit a Prompt</span>
									</DropdownMenuItem>
									{userProfile?.role === 'admin' && (
										<DropdownMenuItem onSelect={() => router.push('/admin')}>
											<ShieldCheck className='mr-2 h-4 w-4' />
											<span>Admin Panel</span>
										</DropdownMenuItem>
									)}
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={async () => {
											await signOutUser()
										}}
									>
										<LogOut className='mr-2 h-4 w-4' />
										<span>Log out</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</>
					) : (
						<Button
							variant='ghost'
							onClick={() => signInWithGoogle()}
							className='hover:bg-transparent dark:hover:bg-transparent hover:text-accent dark:hover:text-primary'
						>
							Sign In
						</Button>
					)}
				</div>
			</div>
		</header>
	)
}
