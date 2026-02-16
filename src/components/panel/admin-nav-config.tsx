'use client'

import {
	Bot,
	BookOpen,
	Cpu,
	FileText,
	FileType,
	FolderOpen,
	Home,
	Image,
	MessagesSquare,
	Tags,
	Users,
	CircleDollarSign,
	Banknote,
} from 'lucide-react'
import type { PanelNavConfig } from './types'

export const ADMIN_NAV_CONFIG: PanelNavConfig = {
	title: 'Promptly Admin',
	icon: Bot,
	homeHref: '/admin',
	items: [
		{ href: '/admin', label: 'Dashboard', icon: Home },
		{ href: '/admin/prompts', label: 'Prompts', icon: FileText },
		{ href: '/admin/sales', label: 'Sales', icon: CircleDollarSign },
		{ href: '/admin/comments', label: 'Comments', icon: MessagesSquare },
		{ href: '/admin/categories', label: 'Categories', icon: FolderOpen },
		{ href: '/admin/tags', label: 'Tags', icon: Tags },
		{ href: '/admin/types', label: 'Types', icon: FileType },
		{ href: '/admin/models', label: 'Models', icon: Cpu },
		{
			href: '/admin/search-bar-backgrounds',
			label: 'Search Bar Background',
			icon: Image,
		},
		{ href: '/admin/users', label: 'Users', icon: Users },
		{ href: '/admin/payouts', label: 'Payouts', icon: Banknote },
		{ href: '/docs', label: 'Docs', icon: BookOpen },
	],
}
