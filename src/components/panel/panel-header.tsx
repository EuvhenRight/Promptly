'use client'

import { Button } from '@/components/ui/button'
import {
	Sheet,
	SheetContent,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { Menu } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { PanelNavConfig } from './types'
import { PanelNavLink } from './panel-sidebar'

export interface PanelHeaderProps {
	config: PanelNavConfig
	/** Right-side content (e.g. <UserMenu />) */
	rightSlot: React.ReactNode
	/** Sheet title for a11y */
	sheetTitle?: string
	/** Optional: close sheet on nav */
	onNavigate?: () => void
	/** Breakpoint to hide menu button (show sidebar instead). Default 'md' to match admin */
	menuVisibleBelow?: 'md' | 'lg'
}

export function PanelHeader({
	config,
	rightSlot,
	sheetTitle = 'Menu',
	onNavigate,
	menuVisibleBelow = 'md',
}: PanelHeaderProps) {
	const pathname = usePathname()
	const getIsActive = config.getIsActive ?? ((href, p) => p === href)

	return (
		<header className='sticky top-0 z-10 flex h-14 shrink-0 items-center gap-4 border-b bg-muted/40 px-4 pr-5 sm:px-6 lg:h-[60px] lg:px-6'>
			<Sheet>
				<SheetTrigger asChild>
					<Button
						variant='outline'
						size='icon'
						className={cn(
							'shrink-0',
							menuVisibleBelow === 'lg' ? 'lg:hidden' : 'md:hidden',
						)}
					>
						<Menu className='h-6 w-6' />
						<span className='sr-only'>Toggle navigation menu</span>
					</Button>
				</SheetTrigger>
				<SheetContent side='left' className='flex flex-col p-0'>
					<SheetTitle className='sr-only'>{sheetTitle}</SheetTitle>
					<div className='flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6'>
						<Link
							href={config.homeHref}
							onClick={onNavigate}
							className='flex items-center gap-2 font-semibold'
						>
							<config.icon className='h-6 w-6 text-primary' />
							<span>{config.title}</span>
						</Link>
					</div>
					<div className='flex-1 overflow-y-auto'>
						<nav className='grid items-start gap-0 px-2 text-sm font-medium lg:px-4'>
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
										isCollapsed={false}
										isActive={getIsActive(item.href, pathname)}
										onNavigate={onNavigate}
									/>
								</div>
							))}
						</nav>
					</div>
				</SheetContent>
			</Sheet>
			<div className='min-w-0 flex-1' />
			{rightSlot}
		</header>
	)
}
