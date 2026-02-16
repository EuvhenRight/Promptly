'use client'

import { useFirestore, useUser } from '@/firebase'
import {
	createPrompt,
	uploadPromptImage,
	type CreatePromptData,
} from '@/firebase/prompts'
import { useToast } from '@/hooks/use-toast'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { PromptForm, type PromptFormValues } from './prompt-form'
import { rehostImage } from '../actions'

function NewPromptContent() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const { user } = useUser()
	const firestore = useFirestore()
	const { toast } = useToast()
	const [isSubmitting, setIsSubmitting] = useState(false)

	// Read data from URL query parameters for pre-filling the form
	const initialData = {
		title: searchParams.get('title') || '',
		privateContent: searchParams.get('privateContent') || '',
		categoryId:
			searchParams.get('categoryId') || searchParams.get('categories') || '',
		typeId: searchParams.get('typeId') || '',
		modelId: searchParams.get('modelId') || '',
		tags: searchParams.get('tags') || '',
		imageUrl: searchParams.get('imageUrl') || undefined,
	}
	const sourceId = searchParams.get('sourceId')

	const handleSubmit = async (data: PromptFormValues) => {
		if (!user || !firestore) {
			toast({
				variant: 'destructive',
				title: 'Authentication Error',
				description: 'You must be logged in to create a prompt.',
			})
			return
		}

		setIsSubmitting(true)

		try {
			let finalImageUrl = initialData.imageUrl

			// If user uploaded a new image from their computer, it takes precedence.
			if (data.image) {
				toast({ title: 'Uploading new image...', description: 'Please wait.' })
				finalImageUrl = await uploadPromptImage(data.image)
			}
			// If there's a scraped URL and no new file was uploaded, re-host it now.
			else if (finalImageUrl && finalImageUrl.startsWith('http') && sourceId) {
				toast({
					title: 'Processing scraped image...',
					description:
						'Downloading from source and uploading to your storage. Please wait.',
				})
				finalImageUrl = await rehostImage(finalImageUrl, sourceId)
			}

			if (!finalImageUrl) {
				toast({
					variant: 'destructive',
					title: 'Image Required',
					description:
						'An image is required. Please upload one or scrape a prompt that has an image.',
				})
				setIsSubmitting(false)
				return
			}

			const promptData: CreatePromptData = {
				title: data.title,
				description: data.description,
				price: data.price,
				isPrivate: data.isPrivate,
				categoryId: data.categoryId,
				typeId: data.typeId,
				modelId: data.modelId,
				tags: data.tags,
				privateContent: data.privateContent,
				imageUrl: finalImageUrl,
				sourceId: sourceId,
			}

			toast({ title: 'Saving prompt...', description: 'Just a moment.' })
			const result = await createPrompt(firestore, user.uid, promptData)

			if (result.success) {
				toast({
					title: 'Prompt Created',
					description: 'Your new prompt has been successfully created.',
				})
				router.push('/admin/prompts')
			} else {
				throw new Error(
					result.error || 'An unknown error occurred while saving the prompt.',
				)
			}
		} catch (error: any) {
			console.error('Failed to create prompt:', error)
			toast({
				variant: 'destructive',
				title: 'Error Creating Prompt',
				description: error.message || 'An unknown error occurred.',
			})
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<>
			<div className='flex items-center justify-between gap-4'>
				<h1 className='text-lg font-semibold md:text-2xl'>Create New Prompt</h1>
			</div>
			<PromptForm
				onSubmit={handleSubmit}
				isSubmitting={isSubmitting}
				initialData={initialData}
			/>
		</>
	)
}

// Wrap with Suspense because useSearchParams can suspend
export default function NewPromptPage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<NewPromptContent />
		</Suspense>
	)
}
