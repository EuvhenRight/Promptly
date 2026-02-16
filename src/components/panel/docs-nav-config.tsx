import {
	ArrowLeft,
	BookOpen,
	Code,
	Database,
	FileJson,
	GitBranch,
	Home,
	Layout,
	ListTodo,
	Puzzle,
	Rocket,
	Server,
	Settings,
	Shield,
	FileCheck,
} from 'lucide-react'
import type { PanelNavConfig } from './types'

export const DOCS_NAV_CONFIG: PanelNavConfig = {
	title: 'Docs',
	icon: BookOpen,
	homeHref: '/docs',
	items: [
		{ href: '/docs/overview', label: 'Огляд', icon: Home },
		{ href: '/docs/architecture', label: 'Архітектура', icon: GitBranch },
		{ href: '/docs/frontend', label: 'Frontend', icon: Layout },
		{ href: '/docs/backend', label: 'Backend', icon: Server },
		{ href: '/docs/database', label: 'База даних', icon: Database },
		{ href: '/docs/auth-security', label: 'Auth та безпека', icon: Shield },
		{ href: '/docs/api', label: 'API (Markdown)', icon: Code },
		{ href: '/docs/api-spec', label: 'API (Swagger)', icon: FileJson },
		{ href: '/docs/components', label: 'Компоненти', icon: Puzzle },
		{ href: '/docs/deployment', label: 'Деплой', icon: Rocket },
		{ href: '/docs/env', label: 'Змінні середовища', icon: Settings },
		{ href: '/docs/todo-refactor', label: 'TODO та рефакторинг', icon: ListTodo },
		{ href: '/docs/features-summary', label: 'Зведення можливостей', icon: FileCheck },
		{ href: '/admin', label: 'Back to Admin Panel', icon: ArrowLeft, separatorBefore: true },
	],
	getIsActive(href, pathname) {
		return pathname === href || (pathname === '/docs' && href === '/docs/overview')
	},
}
