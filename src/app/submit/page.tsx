'use client'

import Footer from '@/components/layout/footer'
import Header from '@/components/layout/header'
import {
	PromptForm,
	type PromptFormValues,
} from '@/app/admin/prompts/new/prompt-form'
import { useFirestore, useUser } from '@/firebase'
import {
	createPrompt,
	uploadPromptImage,
	type CreatePromptData,
} from '@/firebase/prompts'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function SubmitPromptPage() {
	const router = useRouter()
	const { user, isUserLoading } = useUser()
	const firestore = useFirestore()
	const { toast } = useToast()
	const [isSubmitting, setIsSubmitting] = useState(false)

	// Redirect if not logged in
	useEffect(() => {
		if (!isUserLoading && !user) {
			router.replace('/')
			toast({
				variant: 'destructive',
				title: 'Authentication Required',
				description: 'You need to be signed in to submit a prompt.',
			})
		}
	}, [user, isUserLoading, router, toast])

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
			let imageUrl: string | undefined = undefined

			if (data.image) {
				toast({ title: 'Uploading image...', description: 'Please wait.' })
				imageUrl = await uploadPromptImage(data.image)
			} else {
				toast({
					variant: 'destructive',
					title: 'Image Required',
					description: 'An image is required to submit a prompt.',
				})
				setIsSubmitting(false)
				return
			}

			const promptData: CreatePromptData = {
				title: data.title,
				description: data.description,
				price: data.price,
				categoryId: data.categoryId,
				typeId: data.typeId,
				modelId: data.modelId,
				tags: data.tags,
				privateContent: data.privateContent,
				imageUrl: imageUrl,
			}

			toast({ title: 'Submitting prompt...', description: 'Just a moment.' })
			const result = await createPrompt(firestore, user.uid, promptData)

			if (result.success && result.promptId) {
				toast({
					title: 'Prompt Submitted!',
					description: 'Your new prompt has been successfully created.',
				})
				router.push(`/prompt/${result.promptId}`)
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

	if (isUserLoading || !user) {
		return (
			<div className='flex min-h-screen flex-col'>
				<Header />
				<main className='flex-grow container mx-auto px-4 py-8'>
					<div className='max-w-4xl mx-auto'>
						<Skeleton className='h-24 w-1/2 mb-8' />
						<Skeleton className='h-[500px] w-full' />
					</div>
				</main>
				<Footer />
			</div>
		)
	}

	return (
		<div className='flex min-h-screen flex-col'>
			<Header />
			<main className='flex-grow container mx-auto px-4 py-8'>
				<div className='max-w-4xl mx-auto'>
					<header className='mb-8'>
						<h1 className='text-4xl font-bold font-headline'>
							Submit a Prompt
						</h1>
						<p className='mt-2 text-muted-foreground'>
							Share your creativity with the community. Fill out the details
							below to publish your prompt.
						</p>
					</header>
					<Card>
						<CardContent className='p-6'>
							<PromptForm
								onSubmit={handleSubmit}
								isSubmitting={isSubmitting}
							/>
						</CardContent>
					</Card>
				</div>
			</main>
			<Footer />
		</div>
	)
}
