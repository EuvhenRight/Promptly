'use client'

import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import type { PanelNavConfig } from './types'
import { PanelHeader } from './panel-header'
import { PanelSidebar } from './panel-sidebar'
import { UserMenu } from './user-menu'

export interface PanelLayoutProps {
	/** Nav config for sidebar and header menu */
	navConfig: PanelNavConfig
	children: React.ReactNode
	/** Optional class for main content area */
	mainClassName?: string
	/** Sidebar visible from this breakpoint. Default 'md' (admin-style) */
	sidebarVisibleFrom?: 'md' | 'lg'
}

/**
 * Reusable panel layout: sidebar + header + main.
 * Same structure for admin and docs; only navConfig (menu context) changes.
 */
export function PanelLayout({
	navConfig,
	children,
	mainClassName,
	sidebarVisibleFrom = 'md',
}: PanelLayoutProps) {
	const [isCollapsed, setIsCollapsed] = useState(false)
	const rightColumnRef = useRef<HTMLDivElement>(null)
	const pathname = usePathname()

	// Scroll content to top on route change so header stays visible (avoids Next.js scrolling wrong element)
	useEffect(() => {
		rightColumnRef.current?.scrollTo(0, 0)
	}, [pathname])

	return (
		<div
			className={cn(
				'h-screen min-h-0 w-full flex flex-col',
				// At breakpoint switch to grid; below breakpoint flex so single column (sidebar hidden) fills screen
				sidebarVisibleFrom === 'lg' && 'lg:grid',
				sidebarVisibleFrom === 'md' && 'md:grid',
				sidebarVisibleFrom === 'lg' &&
					(isCollapsed
						? 'lg:grid-cols-[64px_1fr]'
						: 'lg:grid-cols-[220px_1fr] xl:grid-cols-[280px_1fr]'),
				sidebarVisibleFrom === 'md' &&
					(isCollapsed
						? 'md:grid-cols-[64px_1fr]'
						: 'md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]'),
			)}
		>
			<PanelSidebar
				config={navConfig}
				isCollapsed={isCollapsed}
				setIsCollapsed={setIsCollapsed}
				visibleFrom={sidebarVisibleFrom}
			/>
			{/* Right column: scroll container so header (sticky) stays visible; we scroll this to top on pathname change */}
			<div
				ref={rightColumnRef}
				className='flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden'
			>
				<PanelHeader
					config={navConfig}
					rightSlot={<UserMenu />}
					sheetTitle={`${navConfig.title} menu`}
					menuVisibleBelow={sidebarVisibleFrom}
				/>
				<main
					className={cn(
						'flex min-w-0 flex-1 flex-col gap-4 overflow-x-hidden p-4 sm:p-5 lg:gap-6 lg:p-6',
						mainClassName,
					)}
				>
					{children}
				</main>
			</div>
		</div>
	)
}
