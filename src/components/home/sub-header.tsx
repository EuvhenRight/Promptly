'use client'

import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { useCategories } from '@/hooks/use-categories'
import { useModels } from '@/hooks/use-models'
import { useTags } from '@/hooks/use-tags'
import { cn } from '@/lib/utils'
import { Cpu, Crown, FolderOpen, Tag } from 'lucide-react'
import Link from 'next/link'
import type { UserProfile } from '@/lib/types'

interface SubHeaderProps {
	activeFilter: string
	onFilterChange: (
		id: string,
		name?: string,
		type?: 'category' | 'tag' | 'main' | 'model' | 'pro',
	) => void
	mainLinks: string[]
	userProfile: UserProfile | null
	isHeaderVisible: boolean
}

export default function SubHeader({
	activeFilter,
	onFilterChange,
	mainLinks,
	userProfile,
	isHeaderVisible,
}: SubHeaderProps) {
	const { categories, isLoading: categoriesLoading } = useCategories()
	const { tags, isLoading: tagsLoading } = useTags()
	const { models, isLoading: modelsLoading } = useModels()
	const isProOrAdmin =
		userProfile?.planId === 'pro' || userProfile?.role === 'admin'

	const isLoading = categoriesLoading || tagsLoading || modelsLoading

	return (
		<div
			className={cn(
				'sticky z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300',
				isHeaderVisible ? 'top-16' : 'top-0',
			)}
		>
			<div className='container mx-auto px-4 sm:px-6 lg:px-8'>
				<div className='flex items-center gap-4'>
					<nav className='hidden sm:flex items-center gap-2'>
						{mainLinks.map(link => (
							<Link
								key={link}
								href='#'
								onClick={e => {
									e.preventDefault()
									onFilterChange(link, link, 'main')
								}}
								className={cn(
									'py-3 px-2 text-sm font-semibold whitespace-nowrap',
									activeFilter === link
										? 'border-b-2 border-primary text-primary'
										: 'text-muted-foreground hover:text-primary',
								)}
							>
								{link}
							</Link>
						))}
					</nav>
					<div className='hidden sm:block h-6 border-l' />
					<ScrollArea className='w-full whitespace-nowrap -mx-4 sm:mx-0'>
						<div className='flex w-max items-center space-x-1 py-2 px-4 sm:px-0'>
							{isProOrAdmin && (
								<Button
									variant='ghost'
									size='sm'
									onClick={() => onFilterChange('pro-prompts', 'PRO', 'pro')}
									className={cn(
										'rounded-full px-3 h-9 gap-2',
										activeFilter === 'pro-prompts'
											? 'bg-primary/10 text-primary font-semibold ring-1 ring-primary/50'
											: 'hover:bg-muted',
									)}
								>
									<Crown className='h-4 w-4 text-amber-500' />
									PRO
								</Button>
							)}
							{isLoading ? (
								<span className='text-sm text-muted-foreground'>Loading…</span>
							) : (
								<>
									{categories.map(cat => (
										<Button
											key={cat.id}
											variant='ghost'
											size='sm'
											onClick={() => onFilterChange(cat.id, cat.name, 'category')}
											className={cn(
												'rounded-full px-3 h-9 gap-2',
												activeFilter === cat.id
													? 'bg-muted text-primary font-semibold'
													: 'hover:bg-muted',
											)}
										>
											<FolderOpen className='h-4 w-4' />
											{cat.name}
										</Button>
									))}
									<div className='h-6 border-l mx-2' />
									{tags.map(tag => (
										<Button
											key={tag.id}
											variant='ghost'
											size='sm'
											onClick={() => onFilterChange(tag.id, tag.name, 'tag')}
											className={cn(
												'rounded-full px-3 h-9 gap-2',
												activeFilter === tag.id
													? 'bg-muted text-primary font-semibold'
													: 'hover:bg-muted',
											)}
										>
											<Tag className='h-4 w-4' />
											{tag.name}
										</Button>
									))}
									<div className='h-6 border-l mx-2' />
									{models.map(model => (
										<Button
											key={model.id}
											variant='ghost'
											size='sm'
											onClick={() =>
												onFilterChange(model.id, model.name, 'model')
											}
											className={cn(
												'rounded-full px-3 h-9 gap-2',
												activeFilter === model.id
													? 'bg-muted text-primary font-semibold'
													: 'hover:bg-muted',
											)}
										>
											<Cpu className='h-4 w-4' />
											{model.name}
										</Button>
									))}
								</>
							)}
						</div>
						<ScrollBar orientation='horizontal' className='sm:hidden' />
					</ScrollArea>
				</div>
			</div>
		</div>
	)
}
