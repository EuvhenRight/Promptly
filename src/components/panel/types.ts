import type { LucideIcon } from 'lucide-react'

export interface PanelNavItem {
	href: string
	label: string
	icon: LucideIcon
	/** When true, render extra top spacing (and optional separator) before this item */
	separatorBefore?: boolean
}

export interface PanelNavConfig {
	title: string
	icon: LucideIcon
	homeHref: string
	items: PanelNavItem[]
	/** Optional: custom active state (e.g. docs: /docs matches /docs/overview) */
	getIsActive?: (href: string, pathname: string) => boolean
}
