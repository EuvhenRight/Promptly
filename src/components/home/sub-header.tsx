'use client'

import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { DUMMY_MODELS_AND_STYLES } from '@/lib/dummy-data'
import { cn } from '@/lib/utils'
import { Bot, Image as ImageIcon, Sparkles, Video } from 'lucide-react' // Example icons
import Link from 'next/link'

const mainLinks = ['Featured', 'Hot', 'New', 'Top']

// A simple mapping for demo icons
const iconMap: { [key: string]: React.ElementType } = {
	video: Video,
	'chatgpt-image': ImageIcon,
	midjourney: Sparkles,
	default: Bot,
}

interface SubHeaderProps {
	activeFilter: string
	onFilterChange: (filter: string) => void
}

export default function SubHeader({
	activeFilter,
	onFilterChange,
}: SubHeaderProps) {
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
									onFilterChange(link)
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
							{DUMMY_MODELS_AND_STYLES.map(item => {
								const Icon = iconMap[item.id] || iconMap.default
								return (
									<Button
										key={item.id}
										variant='ghost'
										size='sm'
										onClick={() => {
											onFilterChange(item.name)
										}}
										className={cn(
											'rounded-full px-3 h-9 gap-2',
											activeFilter === item.name
												? 'bg-muted text-primary font-semibold'
												: 'hover:bg-muted',
										)}
									>
										<Icon className='h-4 w-4' />
										{item.name}
									</Button>
								)
							})}
						</div>
						<ScrollBar orientation='horizontal' className='sm:hidden' />
					</ScrollArea>
				</div>
			</div>
		</div>
	)
}
