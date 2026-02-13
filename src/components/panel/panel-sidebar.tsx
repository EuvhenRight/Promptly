'use client'

import { Button } from '@/components/ui/button'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { PanelLeft, PanelRight } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { PanelNavConfig, PanelNavItem } from './types'

export function PanelNavLink({
	item,
	isCollapsed,
	isActive,
	onNavigate,
}: {
	item: PanelNavItem
	isCollapsed: boolean
	isActive: boolean
	onNavigate?: () => void
}) {
	const { href, label, icon: Icon } = item

	if (isCollapsed) {
		return (
			<TooltipProvider>
				<Tooltip delayDuration={0}>
					<TooltipTrigger asChild>
						<Link
							href={href}
							onClick={onNavigate}
							className={cn(
								'ml-[5px] flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-primary',
								isActive && 'bg-muted text-primary',
							)}
						>
							<Icon className='h-6 w-6' />
							<span className='sr-only'>{label}</span>
						</Link>
					</TooltipTrigger>
					<TooltipContent side='right'>{label}</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		)
	}

	return (
		<Link
			href={href}
			onClick={onNavigate}
			className={cn(
				'-ml-2.5 flex h-9 items-center gap-3 rounded-lg px-3 text-muted-foreground transition-all hover:text-primary',
				isActive && 'bg-muted text-primary',
			)}
		>
			<Icon className='h-6 w-6' />
			{label}
		</Link>
	)
}

export interface PanelSidebarProps {
	config: PanelNavConfig
	isCollapsed: boolean
	setIsCollapsed: (v: boolean) => void
	/** Optional: e.g. close sheet on nav (mobile) */
	onNavigate?: () => void
	/** Desktop: sidebar visible from this breakpoint. Default 'md' to match admin. */
	visibleFrom?: 'md' | 'lg'
}

export function PanelSidebar({
	config,
	isCollapsed,
	setIsCollapsed,
	onNavigate,
	visibleFrom = 'md',
}: PanelSidebarProps) {
	const pathname = usePathname()
	const getIsActive = config.getIsActive ?? ((href, p) => p === href)

	return (
		<aside
			className={cn(
				'hidden border-r bg-muted/40 sticky top-0 h-screen',
				visibleFrom === 'lg' ? 'lg:block' : 'md:block',
			)}
		>
			<div className='flex h-full max-h-screen flex-col gap-2'>
				<div
					className={cn(
						'flex h-14 items-center border-b lg:h-[60px]',
						isCollapsed ? 'justify-center px-2' : 'px-4 lg:px-6',
					)}
				>
					<Link
						href={config.homeHref}
						className='flex items-center gap-2 font-semibold'
					>
						<config.icon className='h-6 w-6 text-primary' />
						{!isCollapsed && <span>{config.title}</span>}
					</Link>
				</div>
				<div className='flex-1 overflow-auto py-2'>
					<nav
						className={cn(
							'grid items-start gap-0 text-sm font-medium',
							isCollapsed ? 'px-2' : 'px-4',
						)}
					>
						{config.items.map((item) => (
							<div
								key={item.href}
								className={cn(
									item.separatorBefore &&
										'mt-4 border-t border-border pt-4',
								)}
							>
								<PanelNavLink
									item={item}
									isCollapsed={isCollapsed}
									isActive={getIsActive(item.href, pathname)}
									onNavigate={onNavigate}
								/>
							</div>
						))}
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
		</aside>
	)
}
