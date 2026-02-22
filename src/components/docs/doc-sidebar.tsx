'use client'

import { Button } from '@/components/ui/button'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import {
	BarChart3,
	BookOpen,
	Code,
	Database,
	FileJson,
	FileText,
	GitBranch,
	Home,
	Layout,
	ListTodo,
	PanelLeft,
	PanelRight,
	Puzzle,
	Rocket,
	Server,
	Settings,
	Shield,
	Users,
} from 'lucide-react'
import Link from 'next/link'
import { createContext, useContext } from 'react'
import { usePathname } from 'next/navigation'

export const DocsSidebarContext = createContext<{
	isCollapsed: boolean
	setIsCollapsed: (v: boolean) => void
}>({ isCollapsed: false, setIsCollapsed: () => {} })

const DOCS_NAV = [
	{ slug: 'overview', label: 'Огляд', icon: Home },
	{ slug: 'dashboard', label: 'Дашборд планів', icon: BarChart3 },
	{ slug: 'strategy-2026', label: 'Стратегія 2026', icon: FileText },
	{ slug: 'team-plan', label: 'Повний план команди', icon: Users },
	{ slug: 'architecture', label: 'Архітектура', icon: GitBranch },
	{ slug: 'frontend', label: 'Frontend', icon: Layout },
	{ slug: 'backend', label: 'Backend', icon: Server },
	{ slug: 'database', label: 'База даних', icon: Database },
	{ slug: 'auth-security', label: 'Auth та безпека', icon: Shield },
	{ slug: 'api', label: 'API (Markdown)', icon: Code },
	{ slug: 'api-spec', label: 'API (Swagger)', icon: FileJson },
	{ slug: 'components', label: 'Компоненти', icon: Puzzle },
	{ slug: 'deployment', label: 'Деплой', icon: Rocket },
	{ slug: 'env', label: 'Змінні середовища', icon: Settings },
	{ slug: 'todo-refactor', label: 'TODO та рефакторинг', icon: ListTodo },
] as const

function DocNavLink({
	href,
	label,
	icon: Icon,
	isCollapsed,
	onNavigate,
}: {
	href: string
	label: string
	icon: React.ElementType
	isCollapsed: boolean
	onNavigate?: () => void
}) {
	const pathname = usePathname()
	const isActive = href !== '/' && (pathname === href || (pathname === '/docs' && href === '/docs/overview'))

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

export function NavContent({
	onNavigate,
	isCollapsed,
}: {
	onNavigate?: () => void
	isCollapsed: boolean
}) {
	return (
		<>
			{DOCS_NAV.map(({ slug, label, icon }) => {
				const href = `/docs/${slug}`
				return (
					<DocNavLink
						key={slug}
						href={href}
						label={label}
						icon={icon}
						isCollapsed={isCollapsed}
						onNavigate={onNavigate}
					/>
				)
			})}
		</>
	)
}

export function DocSidebar() {
	const { isCollapsed, setIsCollapsed } = useContext(DocsSidebarContext)

	return (
		<>
			{/* Desktop: collapsible sidebar (admin-style); hidden on mobile/tablet (use DocsMobileHeader) */}
			<aside className='hidden border-r bg-muted/40 lg:block sticky top-0 h-full max-h-[calc(100vh-4rem)] w-full shrink-0 self-start'>
				<div className='flex h-full min-h-0 flex-col gap-2 overflow-hidden'>
					<div
						className={cn(
							'flex h-14 items-center border-b lg:h-[60px]',
							isCollapsed ? 'justify-center px-2' : 'px-4 lg:px-6',
						)}
					>
						<Link
							href='/docs'
							className='flex items-center gap-2 font-semibold'
						>
							<BookOpen className='h-6 w-6 text-primary' />
							{!isCollapsed && <span>Docs</span>}
						</Link>
					</div>
					<div className='flex-1 overflow-auto py-2'>
						<nav
							className={cn(
								'grid items-start text-sm font-medium',
								isCollapsed ? 'px-2' : 'px-4',
							)}
						>
							<NavContent isCollapsed={isCollapsed} />
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
		</>
	)
}
