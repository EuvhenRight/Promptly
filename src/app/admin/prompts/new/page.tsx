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
			let imageUrl = initialData.imageUrl // Use scraped image URL by default

			// If user uploaded a new image, it takes precedence
			if (data.image) {
				toast({ title: 'Uploading image...', description: 'Please wait.' })
				imageUrl = await uploadPromptImage(data.image)
			}

			const promptData: CreatePromptData = {
				title: data.title,
				description: data.description,
				price: data.price,
				categoryId: data.categoryId,
				typeId: data.typeId,
				tags: data.tags,
				privateContent: data.privateContent,
				imageUrl: imageUrl,
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
