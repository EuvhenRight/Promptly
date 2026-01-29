'use client'

import { useFirestore } from '@/firebase'
import {
	getPromptWithContent,
	updatePrompt,
	uploadPromptImage,
	type UpdatePromptData,
} from '@/firebase/prompts'
import { useToast } from '@/hooks/use-toast'
import type { Prompt } from '@/lib/types'
import { Loader2 } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { PromptForm, type PromptFormValues } from '../../new/prompt-form'

type FullPromptData = Prompt & { privateContent: string }

export default function EditPromptPage() {
	const router = useRouter()
	const params = useParams<{ id: string }>()
	const firestore = useFirestore()
	const { toast } = useToast()
	const [promptData, setPromptData] = useState<FullPromptData | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [isSubmitting, setIsSubmitting] = useState(false)

	useEffect(() => {
		if (!params.id || !firestore) return

		const fetchPrompt = async () => {
			setIsLoading(true)
			try {
				const data = await getPromptWithContent(firestore, params.id as string)
				if (data) {
					setPromptData(data)
				} else {
					toast({
						variant: 'destructive',
						title: 'Not Found',
						description: 'The requested prompt does not exist.',
					})
					router.replace('/admin/prompts')
				}
			} catch (error) {
				console.error('Failed to fetch prompt:', error)
				toast({
					variant: 'destructive',
					title: 'Error',
					description: 'Failed to fetch prompt data.',
				})
			} finally {
				setIsLoading(false)
			}
		}

		fetchPrompt()
	}, [params.id, firestore, router, toast])

	const handleSubmit = async (data: PromptFormValues) => {
		if (!firestore || !promptData) return

		setIsSubmitting(true)
		try {
			let newImageUrl: string | undefined = undefined

			if (data.image) {
				toast({ title: 'Uploading new image...' })
				newImageUrl = await uploadPromptImage(data.image)
			}

			const promptUpdateData: UpdatePromptData = {
				title: data.title,
				description: data.description,
				price: data.price,
				categories: data.categories,
				tags: data.tags,
				privateContent: data.privateContent,
				imageUrl: newImageUrl, // Only pass if a new one was uploaded
			}

			toast({ title: 'Saving changes...' })
			await updatePrompt(firestore, promptData.id, promptUpdateData)

			toast({
				title: 'Prompt Updated',
				description: 'Your changes have been saved.',
			})
			router.push('/admin/prompts')
			router.refresh() // To ensure the list on the previous page is up-to-date
		} catch (error: any) {
			console.error('Failed to update prompt:', error)
			toast({
				variant: 'destructive',
				title: 'Error Updating Prompt',
				description: error.message,
			})
		} finally {
			setIsSubmitting(false)
		}
	}

	if (isLoading) {
		return (
			<div className='flex h-full w-full items-center justify-center p-8'>
				<Loader2 className='h-8 w-8 animate-spin' />
			</div>
		)
	}

	if (!promptData) {
		return null // Or a more explicit "not found" message
	}

	// Form expects string fields; Prompt may store categories/tags as string[] or string.
	const toFormList = (v: string[] | string | undefined): string =>
		Array.isArray(v) ? v.join(', ') : typeof v === 'string' ? v : ''

	const initialDataForForm: Partial<PromptFormValues & { imageUrl?: string }> =
		{
			title: promptData.title,
			description: promptData.description,
			price: promptData.price,
			categories: toFormList(promptData.categories),
			tags: toFormList(promptData.tags),
			privateContent: promptData.privateContent,
			imageUrl: promptData.images?.[0],
		}

	return (
		<>
			<div className='flex items-center justify-between gap-4'>
				<h1 className='text-lg font-semibold md:text-2xl'>Edit Prompt</h1>
			</div>
			<PromptForm
				onSubmit={handleSubmit}
				isSubmitting={isSubmitting}
				initialData={initialDataForForm}
				isEditing={true}
			/>
		</>
	)
}
