'use client'

import type { PublicProfile, UserProfile } from '@/lib/types'
import { getAuth, updateProfile } from 'firebase/auth'
import {
	Firestore,
	arrayRemove,
	arrayUnion,
	doc,
	getDoc,
	updateDoc,
	runTransaction,
	setDoc,
} from 'firebase/firestore'
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage'

export type UpdateUserData = Partial<
	Pick<
		UserProfile,
		| 'displayName'
		| 'username'
		| 'role'
		| 'photoURL'
		| 'coverImageURL'
		| 'description'
		| 'headline'
		| 'aiTools'
		| 'xProfile'
		| 'instagramProfile'
		| 'facebookProfile'
	>
>

/**
 * Uploads an avatar image to Firebase Storage.
 * @param userId The user's ID.
 * @param file The image file to upload.
 * @returns The public URL of the uploaded avatar.
 */
export async function uploadAvatar(
	userId: string,
	file: File,
): Promise<string> {
	if (!file) throw new Error('No file provided for upload.')
	if (!/^image\//.test(file.type)) {
		throw new Error('File must be an image (jpeg, png, gif, webp).')
	}

	const storage = getStorage()
	const ext = file.name.split('.').pop() || 'jpg'
	const storageRef = ref(storage, `users/${userId}/avatar/avatar.${ext}`)

	const uploadResult = await uploadBytes(storageRef, file)
	const downloadURL = await getDownloadURL(uploadResult.ref)
	return downloadURL
}

/**
 * Uploads a cover/banner image to Firebase Storage.
 */
export async function uploadCoverImage(
	userId: string,
	file: File,
): Promise<string> {
	if (!file) throw new Error('No file provided for upload.')
	if (!/^image\//.test(file.type)) {
		throw new Error('File must be an image (jpeg, png, gif, webp).')
	}

	const storage = getStorage()
	const ext = file.name.split('.').pop() || 'jpg'
	const storageRef = ref(storage, `users/${userId}/cover/cover.${ext}`)

	const uploadResult = await uploadBytes(storageRef, file)
	const downloadURL = await getDownloadURL(uploadResult.ref)
	return downloadURL
}

/**
 * Updates a user's profile in Firestore and optionally Firebase Auth.
 * Also syncs public data to the `public-profiles` collection.
 */
export async function updateUserProfile(
	firestore: Firestore,
	userId: string,
	data: UpdateUserData,
): Promise<void> {
	if (!userId) throw new Error('User ID is required.')

	const userRef = doc(firestore, 'users', userId)
	const publicProfileRef = doc(firestore, 'public-profiles', userId)

	try {
		// Run as a transaction to ensure both private and public profiles are updated together
		await runTransaction(firestore, async transaction => {
			const userDoc = await transaction.get(userRef)
			if (!userDoc.exists()) {
				throw new Error('User profile does not exist.')
			}

			const userProfileData = userDoc.data() as UserProfile

			const firestoreData: Record<string, unknown> = {}
			if (data.displayName !== undefined)
				firestoreData.displayName = data.displayName
			if (data.username !== undefined) firestoreData.username = data.username
			if (data.role !== undefined) firestoreData.role = data.role
			if (data.photoURL !== undefined) firestoreData.photoURL = data.photoURL
			if (data.description !== undefined)
				firestoreData.description = data.description
			if (data.coverImageURL !== undefined)
				firestoreData.coverImageURL = data.coverImageURL
			if (data.headline !== undefined) firestoreData.headline = data.headline
			if (data.aiTools !== undefined) firestoreData.aiTools = data.aiTools
			if (data.xProfile !== undefined) firestoreData.xProfile = data.xProfile
			if (data.instagramProfile !== undefined)
				firestoreData.instagramProfile = data.instagramProfile
			if (data.facebookProfile !== undefined)
				firestoreData.facebookProfile = data.facebookProfile

			// Update the main user profile document
			if (Object.keys(firestoreData).length > 0) {
				transaction.update(userRef, firestoreData)
			}

			// Prepare and update the public profile document
			const publicProfileData: PublicProfile = {
				uid: userId,
				displayName: data.displayName ?? userProfileData.displayName,
				username: data.username ?? userProfileData.username ?? '',
				photoURL: data.photoURL ?? userProfileData.photoURL,
				description: data.description ?? userProfileData.description ?? '',
				coverImageURL:
					data.coverImageURL ?? userProfileData.coverImageURL ?? '',
			}
			transaction.set(publicProfileRef, publicProfileData, { merge: true })
		})

		// Sync displayName and photoURL to Firebase Auth (can be done outside the transaction)
		const auth = getAuth()
		const currentUser = auth.currentUser
		if (currentUser && currentUser.uid === userId) {
			const authUpdates: { displayName?: string; photoURL?: string } = {}
			if (data.displayName !== undefined)
				authUpdates.displayName = data.displayName
			if (data.photoURL !== undefined) authUpdates.photoURL = data.photoURL
			if (Object.keys(authUpdates).length > 0) {
				await updateProfile(currentUser, authUpdates)
			}
		}
	} catch (error: unknown) {
		console.error('Error updating user profile:', error)
		throw new Error(
			error instanceof Error ? error.message : 'Failed to update user profile.',
		)
	}
}

/**
 * Adds or removes a prompt from the user's favorites and updates the prompt's like count.
 */
export async function toggleFavoritePrompt(
	firestore: Firestore,
	userId: string,
	promptId: string,
	isFavorite: boolean,
): Promise<void> {
	if (!userId) throw new Error('User ID is required.')

	const userRef = doc(firestore, 'users', userId)
	const promptRef = doc(firestore, 'prompts', promptId)

	await runTransaction(firestore, async transaction => {
		const userDoc = await transaction.get(userRef)
		const promptDoc = await transaction.get(promptRef)

		if (!userDoc.exists()) {
			throw new Error('User profile not found.')
		}
		if (!promptDoc.exists()) {
			throw new Error('Prompt not found.')
		}

		// Update user's favorite prompts array
		transaction.update(userRef, {
			favoritePrompts: isFavorite ? arrayRemove(promptId) : arrayUnion(promptId),
		})

		// Update prompt's like count
		const currentLikes = promptDoc.data()?.stats?.likes ?? 0
		const newLikes = isFavorite ? currentLikes - 1 : currentLikes + 1

		transaction.update(promptRef, {
			'stats.likes': Math.max(0, newLikes),
		})
	})
}
