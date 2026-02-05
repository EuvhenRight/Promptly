'use client'

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { useCategories } from '@/hooks/use-categories'
import { useTags } from '@/hooks/use-tags'
import { cn } from '@/lib/utils'

type FilterSidebarProps = {
	className?: string
}

export default function FilterSidebar({ className }: FilterSidebarProps) {
	const { categories, isLoading: categoriesLoading } = useCategories()
	const { tags, isLoading: tagsLoading } = useTags()
	// Hydrate the categories and tags

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
							defaultValue={['categories', 'models', 'price']}
							className='w-full'
						>
							<AccordionItem value='categories'>
								<AccordionTrigger className='font-semibold'>
									Categories
								</AccordionTrigger>
								<AccordionContent>
									<div className='space-y-3'>
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
												<div
													key={category.id}
													className='flex items-center space-x-2'
												>
													<Checkbox id={`cat-${category.id}`} />
													<Label
														htmlFor={`cat-${category.id}`}
														className='font-normal'
													>
														{category.name}
													</Label>
												</div>
											))
										)}
									</div>
								</AccordionContent>
							</AccordionItem>
							<AccordionItem value='models'>
								<AccordionTrigger className='font-semibold'>
									Tags
								</AccordionTrigger>
								<AccordionContent>
									<div className='space-y-3'>
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
												<div
													key={tag.id}
													className='flex items-center space-x-2'
												>
													<Checkbox id={`tag-${tag.id}`} />
													<Label
														htmlFor={`tag-${tag.id}`}
														className='font-normal'
													>
														{tag.name}
													</Label>
												</div>
											))
										)}
									</div>
								</AccordionContent>
							</AccordionItem>
							<AccordionItem value='price'>
								<AccordionTrigger className='font-semibold'>
									Price Range
								</AccordionTrigger>
								<AccordionContent>
									<div className='px-1 pt-2'>
										<Slider defaultValue={[0, 50]} max={100} step={1} />
										<div className='mt-2 flex justify-between text-sm text-muted-foreground'>
											<span>$0</span>
											<span>$100+</span>
										</div>
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
