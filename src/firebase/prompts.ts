import type { PromptFormValues } from '@/app/admin/prompts/new/prompt-form'
import type {
	Prompt,
	PromptComment,
	PromptPrivateContent,
	UserProfile,
} from '@/lib/types'
import {
	Firestore,
	collection,
	doc,
	getDoc,
	increment,
	runTransaction,
	serverTimestamp,
	updateDoc,
	writeBatch,
	arrayUnion,
} from 'firebase/firestore'
import {
	deleteObject,
	getDownloadURL,
	getStorage,
	ref,
	uploadBytes,
} from 'firebase/storage'
import { getAuth } from 'firebase/auth'

/**
 * Uploads an image from a client-side File object to Firebase Storage.
 * @param file The image file to upload.
 * @returns A promise that resolves with the public URL of the uploaded image.
 */
export async function uploadPromptImage(file: File): Promise<string> {
	if (!file) throw new Error('No file provided for upload.')

	const storage = getStorage()
	const fileName = `${Date.now()}-${file.name}`
	const storageRef = ref(storage, `prompts/${fileName}`)

	const uploadResult = await uploadBytes(storageRef, file)
	const downloadURL = await getDownloadURL(uploadResult.ref)

	return downloadURL
}

/**
 * Uploads an image from a server-side Buffer to Firebase Storage.
 * @param buffer The image data as a Buffer.
 * @param fileName The desired file name for the image in storage.
 * @returns A promise that resolves with the public URL of the uploaded image.
 */
export async function uploadImageFromBuffer(
	buffer: Buffer,
	fileName: string,
): Promise<string> {
	const storage = getStorage()
	const storageRef = ref(storage, `prompts/${Date.now()}-${fileName}`)

	// Metadata can be important, especially for web clients to render correctly
	const metadata = {
		contentType: 'image/jpeg', // Adjust based on actual image type if known, e.g., image/png
	}

	const snapshot = await uploadBytes(storageRef, buffer, metadata)
	const downloadURL = await getDownloadURL(snapshot.ref)
	return downloadURL
}

export type CreatePromptData = Omit<PromptFormValues, 'image'> & {
	imageUrl?: string
	sourceId?: string | null
}

function getSearchTerms(title: string): string[] {
	const titleLower = title.toLowerCase()
	const terms = new Set(titleLower.split(/\s+/).filter(Boolean))
	return Array.from(terms)
}

export async function createPrompt(
	firestore: Firestore,
	adminId: string,
	data: CreatePromptData,
): Promise<{ success: boolean; error?: string; promptId?: string }> {
	const newPromptRef = doc(collection(firestore, 'prompts'))
	const privateContentRef = doc(newPromptRef, 'private', 'content')

	const batch = writeBatch(firestore)

	try {
		const authorRef = doc(firestore, 'users', adminId)
		const authorSnap = await getDoc(authorRef)
		if (!authorSnap.exists()) {
			throw new Error('Could not create prompt: author profile not found.')
		}
		const authorData = authorSnap.data() as UserProfile

		const publicData = {
			authorId: adminId,
			authorDisplayName: authorData.displayName,
			authorPhotoURL: authorData.photoURL,
			authorUsername: authorData.username,
			title: data.title,
			titleLowercase: data.title.toLowerCase(),
			searchTerms: getSearchTerms(data.title),
			description: data.description || '',
			price: data.price,
			isPrivate: data.isPrivate ?? false,
			images: data.imageUrl ? [data.imageUrl] : [],
			rating: {
				average: 0,
				count: 0,
			},
			tags: data.tags
				? data.tags
						.split(',')
						.map(tag => tag.trim())
						.filter(Boolean)
				: [],
			categoryId: data.categoryId || '',
			categories: data.categoryId ? [data.categoryId] : [],
			typeId: data.typeId || '',
			modelId: data.modelId || '',
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp(),
			stats: {
				views: 0,
				sales: 0,
				likes: 0,
			},
		}

		const privateData = {
			text: data.privateContent,
		}

		batch.set(newPromptRef, publicData)
		batch.set(privateContentRef, privateData)

		// Add tracking doc for scraped prompts
		if (data.sourceId) {
			const scrapedPromptRef = doc(firestore, 'scraped_prompts', data.sourceId)
			batch.set(scrapedPromptRef, {
				promptId: newPromptRef.id,
				createdAt: serverTimestamp(),
			})
		}

		await batch.commit()

		return { success: true, promptId: newPromptRef.id }
	} catch (error: any) {
		console.error('Error creating prompt:', error)
		return {
			success: false,
			error: error.message || 'Failed to create prompt.',
		}
	}
}

/**
 * Deletes a prompt and its associated private content and storage files.
 */
export async function deletePrompt(
	firestore: Firestore,
	promptId: string,
): Promise<void> {
	const promptRef = doc(firestore, 'prompts', promptId)
	const privateContentRef = doc(promptRef, 'private', 'content')
	const storage = getStorage()

	const batch = writeBatch(firestore)

	try {
		const promptSnap = await getDoc(promptRef)
		if (!promptSnap.exists()) {
			throw new Error('Prompt not found.')
		}

		const promptData = promptSnap.data() as Prompt

		// Delete image from storage if it exists
		if (promptData.images && promptData.images[0]) {
			try {
				const imageRef = ref(storage, promptData.images[0])
				await deleteObject(imageRef)
			} catch (storageError: any) {
				// Log storage error but don't block firestore deletion
				if (storageError.code !== 'storage/object-not-found') {
					console.error(
						'Could not delete prompt image from storage:',
						storageError,
					)
				}
			}
		}

		batch.delete(promptRef)
		batch.delete(privateContentRef)

		await batch.commit()
	} catch (error: any) {
		console.error('Error deleting prompt:', error)
		throw new Error(error.message || 'Failed to delete prompt.')
	}
}

/**
 * Fetches a single prompt along with its private content.
 */
export async function getPromptWithContent(
	firestore: Firestore,
	promptId: string,
): Promise<(Prompt & { privateContent: string }) | null> {
	const promptRef = doc(firestore, 'prompts', promptId)
	const privateContentRef = doc(promptRef, 'private', 'content')

	const [promptSnap, privateContentSnap] = await Promise.all([
		getDoc(promptRef),
		getDoc(privateContentRef),
	])

	if (!promptSnap.exists()) {
		return null
	}

	const promptData = promptSnap.data() as Prompt
	const privateContent =
		(privateContentSnap.data() as PromptPrivateContent)?.text || ''

	const tags = Array.isArray(promptData.tags) ? promptData.tags : []
	const categoryId =
		promptData.categoryId ??
		(Array.isArray(promptData.categories) ? promptData.categories[0] : '')

	return {
		...promptData,
		tags,
		categoryId: categoryId || '',
		privateContent,
	}
}

export type UpdatePromptData = Omit<PromptFormValues, 'image'> & {
	imageUrl?: string
}

/**
 * Updates a prompt and its private content.
 */
export async function updatePrompt(
	firestore: Firestore,
	promptId: string,
	data: UpdatePromptData,
) {
	const promptRef = doc(firestore, 'prompts', promptId)
	const privateContentRef = doc(promptRef, 'private', 'content')

	const batch = writeBatch(firestore)

	const publicDataToUpdate: any = {
		title: data.title,
		titleLowercase: data.title.toLowerCase(),
		searchTerms: getSearchTerms(data.title),
		description: data.description || '',
		price: data.price,
		isPrivate: data.isPrivate ?? false,
		tags: data.tags
			? data.tags
					.split(',')
					.map(tag => tag.trim())
					.filter(Boolean)
			: [],
		categoryId: data.categoryId || '',
		categories: data.categoryId ? [data.categoryId] : [],
		typeId: data.typeId || '',
		modelId: data.modelId || '',
		updatedAt: serverTimestamp(),
	}

	if (data.imageUrl) {
		publicDataToUpdate.images = [data.imageUrl]
	}

	const privateDataToUpdate = {
		text: data.privateContent,
	}

	batch.update(promptRef, publicDataToUpdate)
	batch.set(privateContentRef, privateDataToUpdate, { merge: true }) // Use set with merge to be safe

	await batch.commit()
}

/**
 * Increments the view count of a prompt.
 * This is a non-blocking "fire and forget" operation.
 */
export function incrementPromptView(firestore: Firestore, promptId: string) {
	const promptRef = doc(firestore, 'prompts', promptId)
	updateDoc(promptRef, {
		'stats.views': increment(1),
	}).catch(err => {
		// We don't want to bother the user if this fails. Log it for monitoring.
		console.warn('Failed to increment prompt view count:', err)
	})
}

export type CommentSubmitData = {
	firestore: Firestore
	promptId: string
	userId: string
	rating: number
	text: string
}

/**
 * Adds a comment and updates the prompt's average rating in a transaction.
 * A user can only add one comment per prompt.
 */
export async function addPromptCommentAndRating({
	firestore,
	promptId,
	userId,
	rating,
	text,
}: CommentSubmitData): Promise<void> {
	if (rating < 1 || rating > 5) {
		throw new Error('Rating must be between 1 and 5.')
	}

	const promptRef = doc(firestore, 'prompts', promptId)
	const commentRef = doc(firestore, 'prompts', promptId, 'comments', userId) // Use userId as comment ID
	const userRef = doc(firestore, 'users', userId)

	await runTransaction(firestore, async transaction => {
		const [promptDoc, userDoc, commentDoc] = await Promise.all([
			transaction.get(promptRef),
			transaction.get(userRef),
			transaction.get(commentRef),
		])

		if (commentDoc.exists()) {
			throw new Error('You have already submitted a review for this prompt.')
		}
		if (!promptDoc.exists()) {
			throw new Error('Prompt does not exist.')
		}
		if (!userDoc.exists()) {
			throw new Error('User profile not found.')
		}

		const promptData = promptDoc.data() as Prompt
		const userData = userDoc.data() as UserProfile

		// 1. Create the new comment document
		transaction.set(commentRef, {
			userId,
			rating,
			text,
			authorDisplayName: userData.displayName,
			authorPhotoURL: userData.photoURL,
			timestamp: serverTimestamp(),
		})

		// 2. Calculate the new average rating
		const oldRatingCount = promptData.rating.count || 0
		const oldRatingAverage = promptData.rating.average || 0
		const newRatingCount = oldRatingCount + 1
		const newRatingAverage =
			(oldRatingAverage * oldRatingCount + rating) / newRatingCount

		// 3. Update the prompt document with the new rating
		transaction.update(promptRef, {
			'rating.count': newRatingCount,
			'rating.average': newRatingAverage,
		})
	})
}

/**
 * Updates an existing comment and recalculates the prompt's average rating.
 */
export async function updatePromptComment({
	firestore,
	promptId,
	userId,
	rating,
	text,
}: CommentSubmitData): Promise<void> {
	if (rating < 1 || rating > 5) {
		throw new Error('Rating must be between 1 and 5.')
	}

	const promptRef = doc(firestore, 'prompts', promptId)
	const commentRef = doc(firestore, 'prompts', promptId, 'comments', userId)

	await runTransaction(firestore, async transaction => {
		const [promptDoc, commentDoc] = await Promise.all([
			transaction.get(promptRef),
			transaction.get(commentRef),
		])

		if (!promptDoc.exists()) throw new Error('Prompt does not exist.')
		if (!commentDoc.exists())
			throw new Error('Comment does not exist. Cannot update.')

		const promptData = promptDoc.data() as Prompt
		const oldCommentData = commentDoc.data() as PromptComment
		const oldRating = oldCommentData.rating

		// Recalculate average rating
		const { count, average } = promptData.rating
		const newAverage =
			count > 0 ? (average * count - oldRating + rating) / count : rating

		// Update prompt rating
		transaction.update(promptRef, { 'rating.average': newAverage })

		// Update comment
		transaction.update(commentRef, {
			rating,
			text,
			timestamp: serverTimestamp(),
		})
	})
}

/**
 * Deletes a user's comment and recalculates the prompt's average rating.
 */
export async function deletePromptComment({
	firestore,
	promptId,
	userId,
}: Pick<CommentSubmitData, 'firestore' | 'promptId' | 'userId'>): Promise<void> {
	const promptRef = doc(firestore, 'prompts', promptId)
	const commentRef = doc(firestore, 'prompts', promptId, 'comments', userId)

	await runTransaction(firestore, async transaction => {
		const [promptDoc, commentDoc] = await Promise.all([
			transaction.get(promptRef),
			transaction.get(commentRef),
		])

		if (!promptDoc.exists()) throw new Error('Prompt does not exist.')
		// If comment doesn't exist, there's nothing to do.
		if (!commentDoc.exists()) return

		const promptData = promptDoc.data() as Prompt
		const oldCommentData = commentDoc.data() as PromptComment
		const oldRating = oldCommentData.rating

		// Recalculate average rating
		const { count, average } = promptData.rating
		const newCount = count - 1
		const newAverage =
			newCount > 0 ? (average * count - oldRating) / newCount : 0

		// Update prompt rating and count
		transaction.update(promptRef, {
			'rating.average': newAverage,
			'rating.count': newCount,
		})

		// Delete comment
		transaction.delete(commentRef)
	})
}

/**
 * "Buys" a prompt using the user's credit balance by calling a secure API endpoint.
 */
export async function purchasePromptWithCredits(
	userId: string,
	promptId: string,
): Promise<void> {
	const auth = getAuth()
	const user = auth.currentUser
	if (!user || user.uid !== userId) {
		throw new Error('You must be signed in to purchase.')
	}

	const idToken = await user.getIdToken()

	const response = await fetch('/api/purchase', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${idToken}`,
		},
		body: JSON.stringify({ promptId }),
	})

	if (!response.ok) {
		const result = await response.json()
		throw new Error(result.error || 'An unknown error occurred during purchase.')
	}
}
