'use client'

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCategories } from '@/hooks/use-categories'
import { useTags } from '@/hooks/use-tags'
import { cn } from '@/lib/utils'

type FilterSidebarProps = {
	className?: string
	selectedCategoryId: string | null
	onCategoryChange: (id: string | null) => void
	selectedTagId: string | null
	onTagChange: (id: string | null) => void
}

export default function FilterSidebar({
	className,
	selectedCategoryId,
	onCategoryChange,
	selectedTagId,
	onTagChange,
}: FilterSidebarProps) {
	const { categories, isLoading: categoriesLoading } = useCategories()
	const { tags, isLoading: tagsLoading } = useTags()

	return (
		<aside className={cn('space-y-6', className)}>
			<div className='sticky top-24'>
				<Card>
					<CardHeader>
						<CardTitle className='font-headline text-2xl'>Filters</CardTitle>
					</CardHeader>
					<CardContent>
						<Accordion
							type='multiple'
							defaultValue={['categories', 'tags']}
							className='w-full'
						>
							<AccordionItem value='categories'>
								<AccordionTrigger className='font-semibold'>
									Categories
								</AccordionTrigger>
								<AccordionContent>
									<div className='space-y-2 pt-2'>
										{categoriesLoading ? (
											<p className='text-sm text-muted-foreground'>
												Loading categories…
											</p>
										) : categories.length === 0 ? (
											<p className='text-sm text-muted-foreground'>
												No categories yet.
											</p>
										) : (
											categories.map(category => (
												<button
													key={category.id}
													onClick={() =>
														onCategoryChange(
															selectedCategoryId === category.id
																? null
																: category.id,
														)
													}
													className={cn(
														'block w-full text-left text-sm rounded-md p-2 transition-colors',
														selectedCategoryId === category.id
															? 'bg-muted font-semibold text-primary'
															: 'hover:bg-muted/50',
													)}
												>
													{category.name}
												</button>
											))
										)}
									</div>
								</AccordionContent>
							</AccordionItem>
							<AccordionItem value='tags'>
								<AccordionTrigger className='font-semibold'>Tags</AccordionTrigger>
								<AccordionContent>
									<div className='space-y-2 pt-2'>
										{tagsLoading ? (
											<p className='text-sm text-muted-foreground'>
												Loading tags…
											</p>
										) : tags.length === 0 ? (
											<p className='text-sm text-muted-foreground'>
												No tags yet.
											</p>
										) : (
											tags.map(tag => (
												<button
													key={tag.id}
													onClick={() =>
														onTagChange(selectedTagId === tag.id ? null : tag.id)
													}
													className={cn(
														'block w-full text-left text-sm rounded-md p-2 transition-colors',
														selectedTagId === tag.id
															? 'bg-muted font-semibold text-primary'
															: 'hover:bg-muted/50',
													)}
												>
													{tag.name}
												</button>
											))
										)}
									</div>
								</AccordionContent>
							</AccordionItem>
						</Accordion>
					</CardContent>
				</Card>
			</div>
		</aside>
	)
}
