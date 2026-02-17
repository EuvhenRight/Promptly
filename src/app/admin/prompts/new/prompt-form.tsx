'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

const promptFormSchema = z.object({
	title: z.string().min(3, 'Title must be at least 3 characters long.'),
	description: z.string().optional(),
	price: z.coerce
		.number({ invalid_type_error: 'Price must be a number.' })
		.min(0, 'Price cannot be negative.')
		.default(1),
	isPrivate: z.boolean().default(false),
	categoryId: z.string().min(1, 'Please select a category.'),
	typeId: z.string().optional(),
	modelId: z.string().optional(),
	tags: z.string().optional(), // Comma-separated tag IDs from Tags collection
	privateContent: z.string().min(10, 'The private prompt content is required.'),
	image: z
		.instanceof(File, { message: 'Image is required.' })
		.refine(file => file.size < 4 * 1024 * 1024, 'Max file size is 4MB.')
		.optional(),
})

export type PromptFormValues = z.infer<typeof promptFormSchema>
export { promptFormSchema }

interface PromptFormProps {
	onSubmit: (values: PromptFormValues) => Promise<void>
	initialData?: Partial<PromptFormValues & { imageUrl?: string }>
	isEditing?: boolean
	isSubmitting?: boolean
}

export function PromptForm({
	onSubmit,
	initialData,
	isEditing = false,
	isSubmitting = false,
}: PromptFormProps) {
	const router = useRouter()
	const form = useForm<PromptFormValues>({
		resolver: zodResolver(promptFormSchema),
		defaultValues: {
			title: '',
			description: '',
			price: 1,
			isPrivate: false,
			categoryId: '',
			typeId: '',
			modelId: '',
			tags: '',
			privateContent: '',
			...initialData,
		},
	})

	const [imagePreview, setImagePreview] = useState<string | undefined>(
		initialData?.imageUrl,
	)
	const [categoryOptions, setCategoryOptions] = useState<
		{ id: string; name: string }[]
	>([])
	const [tagOptions, setTagOptions] = useState<{ id: string; name: string }[]>(
		[],
	)
	const [typeOptions, setTypeOptions] = useState<
		{ id: string; name: string }[]
	>([])
	const [modelOptions, setModelOptions] = useState<
		{ id: string; name: string }[]
	>([])
	const fileInputRef = React.useRef<HTMLInputElement>(null)

	useEffect(() => {
		fetch('/api/categories')
			.then(res => (res.ok ? res.json() : []))
			.then(data => setCategoryOptions(Array.isArray(data) ? data : []))
			.catch(() => setCategoryOptions([]))
	}, [])

	useEffect(() => {
		fetch('/api/tags')
			.then(res => (res.ok ? res.json() : []))
			.then(data => setTagOptions(Array.isArray(data) ? data : []))
			.catch(() => setTagOptions([]))
	}, [])

	useEffect(() => {
		fetch('/api/types')
			.then(res => (res.ok ? res.json() : []))
			.then(data => setTypeOptions(Array.isArray(data) ? data : []))
			.catch(() => setTypeOptions([]))
	}, [])

	useEffect(() => {
		fetch('/api/models')
			.then(res => (res.ok ? res.json() : []))
			.then(data => setModelOptions(Array.isArray(data) ? data : []))
			.catch(() => setModelOptions([]))
	}, [])

	useEffect(() => {
		if (initialData) {
			// Use reset to update the entire form state when initialData changes
			form.reset({
				title: initialData.title || '',
				description: initialData.description || '',
				price: initialData.price ?? 1,
				isPrivate: initialData.isPrivate ?? false,
				categoryId: initialData.categoryId || '',
				typeId: initialData.typeId || '',
				modelId: initialData.modelId || '',
				tags: initialData.tags || '',
				privateContent: initialData.privateContent || '',
			})
			setImagePreview(initialData.imageUrl)
		}
	}, [initialData, form])

	const handleFormSubmit = async (values: PromptFormValues) => {
		await onSubmit(values)
	}

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(handleFormSubmit)}
				className='space-y-8 mt-6'
			>
				<div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
					<div className='lg:col-span-2 space-y-6'>
						<Card>
							<CardHeader>
								<CardTitle>Prompt Details</CardTitle>
							</CardHeader>
							<CardContent className='space-y-4'>
								<FormField
									control={form.control}
									name='title'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Title</FormLabel>
											<FormControl>
												<Input
													placeholder='e.g., Cyberpunk Cityscape'
													{...field}
													disabled={isSubmitting}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name='description'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Public Description</FormLabel>
											<FormControl>
												<Textarea
													placeholder='A detailed description of what this prompt generates.'
													className='min-h-[120px]'
													{...field}
													disabled={isSubmitting}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name='privateContent'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Private Prompt Content</FormLabel>
											<FormControl>
												<Textarea
													placeholder='The actual prompt text that users will purchase.'
													className='min-h-[150px] font-mono'
													{...field}
													disabled={isSubmitting}
												/>
											</FormControl>
											<FormDescription>
												This content is hidden until a user purchases the
												prompt.
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</CardContent>
						</Card>
					</div>

					<div className='space-y-6'>
						<Card>
							<CardHeader>
								<CardTitle>Properties</CardTitle>
							</CardHeader>
							<CardContent className='space-y-6'>
								<FormField
									control={form.control}
									name='image'
									render={({ field: { value, onChange, ...fieldProps } }) => (
										<FormItem>
											<FormLabel>
												{imagePreview ? 'Replace Image' : 'Display Image'}
											</FormLabel>
											{imagePreview && (
												<div className='w-full overflow-hidden rounded-md border bg-muted aspect-video relative mt-2'>
													<Image
														src={imagePreview}
														alt='Current image preview'
														fill
														className='object-contain'
														unoptimized
													/>
												</div>
											)}
											<FormControl>
												<Input
													{...fieldProps}
													ref={fileInputRef}
													type='file'
													accept='image/png, image/jpeg, image/gif, image/webp'
													disabled={isSubmitting}
													onChange={event => {
														const file = event.target.files?.[0]
														onChange(file)
														if (file) {
															setImagePreview(URL.createObjectURL(file))
														}
													}}
												/>
											</FormControl>
											<FormDescription>
												Upload an example image. Max 4MB.
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name='price'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Price ($)</FormLabel>
											<FormControl>
												<Input
													type='number'
													step='0.01'
													placeholder='4.99'
													{...field}
													disabled={isSubmitting}
												/>
											</FormControl>
											<FormDescription>
												Enter 0 for a free prompt.
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name='isPrivate'
									render={({ field }) => (
										<FormItem>
											<div className='flex items-center space-x-2'>
												<Checkbox
													id='isPrivate'
													checked={field.value}
													onCheckedChange={field.onChange}
													disabled={isSubmitting}
												/>
												<label
													htmlFor='isPrivate'
													className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
												>
													Make this prompt private
												</label>
											</div>
											<FormDescription>
												Only users with a PRO plan will be able to see this
												prompt.
											</FormDescription>
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name='categoryId'
									render={({ field }) => {
										const selectedCategory = categoryOptions.find(
											cat => cat.id === field.value,
										)
										return (
											<FormItem>
												<FormLabel>Category</FormLabel>
												<Select
													onValueChange={field.onChange}
													value={field.value}
													disabled={isSubmitting}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder='Select a category'>
																{selectedCategory?.name || 'Select a category'}
															</SelectValue>
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{categoryOptions.length === 0 ? (
															<div className='py-2 text-center text-sm text-muted-foreground'>
																Loading categories…
															</div>
														) : (
															categoryOptions.map(cat => (
																<SelectItem key={cat.id} value={cat.id}>
																	{cat.name}
																</SelectItem>
															))
														)}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)
									}}
								/>
								<FormField
									control={form.control}
									name='typeId'
									render={({ field }) => {
										const selectedType = typeOptions.find(
											t => t.id === field.value,
										)
										return (
											<FormItem>
												<FormLabel>Type</FormLabel>
												<Select
													onValueChange={v =>
														field.onChange(v === '__none__' ? '' : v)
													}
													value={field.value || '__none__'}
													disabled={isSubmitting}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder='Select a type'>
																{field.value
																	? selectedType?.name || 'Select a type'
																	: 'None'}
															</SelectValue>
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value='__none__'>None</SelectItem>
														{typeOptions.length === 0 ? (
															<div className='py-2 text-center text-sm text-muted-foreground'>
																Loading types…
															</div>
														) : (
															typeOptions.map(t => (
																<SelectItem key={t.id} value={t.id}>
																	{t.name}
																</SelectItem>
															))
														)}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)
									}}
								/>
								<FormField
									control={form.control}
									name='modelId'
									render={({ field }) => {
										const selectedModel = modelOptions.find(
											t => t.id === field.value,
										)
										return (
											<FormItem>
												<FormLabel>Model</FormLabel>
												<Select
													onValueChange={v =>
														field.onChange(v === '__none__' ? '' : v)
													}
													value={field.value || '__none__'}
													disabled={isSubmitting}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder='Select a model'>
																{field.value
																	? selectedModel?.name || 'Select a model'
																	: 'None'}
															</SelectValue>
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value='__none__'>None</SelectItem>
														{modelOptions.length === 0 ? (
															<div className='py-2 text-center text-sm text-muted-foreground'>
																Loading models…
															</div>
														) : (
															modelOptions.map(t => (
																<SelectItem key={t.id} value={t.id}>
																	{t.name}
																</SelectItem>
															))
														)}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)
									}}
								/>
								<FormField
									control={form.control}
									name='tags'
									render={({ field }) => {
										const selectedIds = field.value
											? field.value
													.split(',')
													.map(s => s.trim())
													.filter(Boolean)
											: []
										const toggleTag = (tagId: string) => {
											const next = selectedIds.includes(tagId)
												? selectedIds.filter(id => id !== tagId)
												: [...selectedIds, tagId]
											field.onChange(next.join(','))
										}
										return (
											<FormItem>
												<FormLabel>Tags</FormLabel>
												<div className='space-y-2 rounded-md border p-3'>
													{tagOptions.length === 0 ? (
														<p className='text-sm text-muted-foreground'>
															Loading tags…
														</p>
													) : (
														<div className='flex flex-wrap gap-4'>
															{tagOptions.map(tag => (
																<div
																	key={tag.id}
																	className='flex items-center space-x-2'
																>
																	<Checkbox
																		id={`tag-${tag.id}`}
																		checked={selectedIds.includes(tag.id)}
																		onCheckedChange={() => toggleTag(tag.id)}
																		disabled={isSubmitting}
																	/>
																	<label
																		htmlFor={`tag-${tag.id}`}
																		className='text-sm font-normal cursor-pointer'
																	>
																		{tag.name}
																	</label>
																</div>
															))}
														</div>
													)}
												</div>
												<FormMessage />
											</FormItem>
										)
									}}
								/>
							</CardContent>
						</Card>
					</div>
				</div>

				<div className='flex justify-end gap-4'>
					<Button
						type='button'
						variant='outline'
						onClick={() => router.back()}
						disabled={isSubmitting}
					>
						Cancel
					</Button>
					<Button type='submit' disabled={isSubmitting}>
						{isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
						{isEditing ? 'Save Changes' : 'Create Prompt'}
					</Button>
				</div>
			</form>
		</Form>
	)
}
