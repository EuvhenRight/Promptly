'use client'

import { Bell, Coins, Settings, Star, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
	{ href: '/account', label: 'Account', icon: Settings },
	{ href: '/account/plans', label: 'Plans', icon: Star },
	{ href: '/notifications', label: 'Notifications', icon: Bell },
	{ href: '/profile', label: 'Profile', icon: User },
]

type AccountSidebarProps = {
	credits?: number
}

export default function AccountSidebar({ credits = 0 }: AccountSidebarProps) {
	const pathname = usePathname()

	return (
		<aside className='w-full lg:w-56 shrink-0 space-y-6'>
			<div>
				<h3 className='mb-2 px-3 text-sm font-semibold tracking-tight'>
					Dashboard
				</h3>
				<nav className='flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0'>
					{navItems.map(({ href, label, icon: Icon }) => {
						const isActive =
							pathname === href ||
							(href === '/account/plans' && pathname.startsWith('/account/plans'))
						return (
							<Link
								key={href}
								href={href}
								className={cn(
									'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
									isActive
										? 'bg-muted text-foreground'
										: 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
								)}
							>
								<Icon className='h-4 w-4 shrink-0' />
								{label}
							</Link>
						)
					})}
				</nav>
			</div>
			<div className='flex items-center gap-2 p-3 rounded-lg border bg-muted/30'>
				<Coins className='h-4 w-4 text-amber-600 shrink-0' />
				<div className='min-w-0'>
					<p className='text-sm font-medium'>{credits} Credits</p>
					<p className='text-xs text-muted-foreground'>
						{credits < 50 ? 'Running low!' : 'Available'}
					</p>
				</div>
				<Link
					href='/account/plans#credits'
					className='ml-auto text-xs font-medium text-primary hover:underline shrink-0'
				>
					Buy more
				</Link>
			</div>
		</aside>
	)
}
