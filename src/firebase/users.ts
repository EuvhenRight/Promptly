'use client'

import type { UserProfile } from '@/lib/types'
import { getAuth, updateProfile } from 'firebase/auth'
import {
	Firestore,
	arrayRemove,
	arrayUnion,
	doc,
	getDoc,
	updateDoc,
} from 'firebase/firestore'
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage'

export type UpdateUserData = Pick<
	UserProfile,
	'displayName' | 'role' | 'photoURL' | 'coverImageURL' | 'description'
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
 */
export async function updateUserProfile(
	firestore: Firestore,
	userId: string,
	data: UpdateUserData,
): Promise<void> {
	if (!userId) throw new Error('User ID is required.')

	const userRef = doc(firestore, 'users', userId)

	try {
		const firestoreData: Record<string, unknown> = {}
		if (data.displayName !== undefined)
			firestoreData.displayName = data.displayName
		if (data.role !== undefined) firestoreData.role = data.role
		if (data.photoURL !== undefined) firestoreData.photoURL = data.photoURL
		if (data.description !== undefined)
			firestoreData.description = data.description
		if (data.coverImageURL !== undefined)
			firestoreData.coverImageURL = data.coverImageURL

		if (Object.keys(firestoreData).length > 0) {
			await updateDoc(userRef, firestoreData)
		}

		// Sync displayName and photoURL to Firebase Auth
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
 * Adds or removes a prompt from the user's favorites.
 */
export async function toggleFavoritePrompt(
	firestore: Firestore,
	userId: string,
	promptId: string,
	isFavorite: boolean,
): Promise<void> {
	if (!userId) throw new Error('User ID is required.')
	const userRef = doc(firestore, 'users', userId)
	const userSnap = await getDoc(userRef)
	if (!userSnap.exists()) throw new Error('User profile not found.')

	await updateDoc(userRef, {
		favoritePrompts: isFavorite ? arrayRemove(promptId) : arrayUnion(promptId),
	})
}
