'use client'

import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { useCategories } from '@/hooks/use-categories'
import { cn } from '@/lib/utils'
import { FolderOpen } from 'lucide-react'
import Link from 'next/link'

const mainLinks = ['Featured', 'Hot', 'New', 'Top']

interface SubHeaderProps {
	activeFilter: string
	onFilterChange: (id: string, name?: string) => void
	mainLinks: string[]
}

export default function SubHeader({
	activeFilter,
	onFilterChange,
	mainLinks,
}: SubHeaderProps) {
	const { categories, isLoading } = useCategories()

	return (
		<div className='border-b bg-background/95'>
			<div className='container mx-auto px-4 sm:px-6 lg:px-8'>
				<div className='flex items-center gap-4'>
					<nav className='hidden sm:flex items-center gap-2'>
						{mainLinks.map(link => (
							<Link
								key={link}
								href='#'
								onClick={e => {
									e.preventDefault()
									onFilterChange(link, link)
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
							{isLoading ? (
								<span className='text-sm text-muted-foreground'>Loading…</span>
							) : (
								categories.map(cat => (
									<Button
										key={cat.id}
										variant='ghost'
										size='sm'
										onClick={() => onFilterChange(cat.id, cat.name)}
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
								))
							)}
						</div>
						<ScrollBar orientation='horizontal' className='sm:hidden' />
					</ScrollArea>
				</div>
			</div>
		</div>
	)
}
