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
	collection,
	getDocs,
	query,
	where,
	limit,
	increment,
	writeBatch,
	serverTimestamp,
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
 * Checks if a username is already taken by another user.
 * @param firestore Firestore instance.
 * @param username The username to check.
 * @param userIdToExclude The current user's ID to exclude from the search.
 * @returns A promise that resolves to true if the username is taken, false otherwise.
 */
export async function checkUsernameExists(
	firestore: Firestore,
	username: string,
	userIdToExclude: string,
): Promise<boolean> {
	const q = query(
		collection(firestore, 'public-profiles'),
		where('username', '==', username),
		limit(1),
	)
	const snapshot = await getDocs(q)
	if (snapshot.empty) {
		return false // Username does not exist, so it's available.
	}
	// Username exists, check if it belongs to a different user.
	return snapshot.docs[0].id !== userIdToExclude
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
			const publicDoc = await transaction.get(publicProfileRef)
			if (!userDoc.exists()) {
				throw new Error('User profile does not exist.')
			}

			const userProfileData = userDoc.data() as UserProfile
			const publicProfileDataOld = publicDoc.exists()
				? (publicDoc.data() as PublicProfile)
				: null

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

			// Prepare and update the public profile document, preserving counters
			const publicProfileData: PublicProfile = {
				uid: userId,
				displayName: data.displayName ?? userProfileData.displayName,
				username: data.username ?? userProfileData.username ?? '',
				photoURL: data.photoURL ?? userProfileData.photoURL,
				description: data.description ?? userProfileData.description ?? '',
				coverImageURL:
					data.coverImageURL ?? userProfileData.coverImageURL ?? '',
				// Preserve existing counters from public profile, or default from private if public doesn't exist yet
				followers:
					publicProfileDataOld?.followers ?? userProfileData.followers ?? 0,
				following:
					publicProfileDataOld?.following ?? userProfileData.following ?? 0,
				views: publicProfileDataOld?.views ?? userProfileData.views ?? 0,
				xProfile: data.xProfile ?? userProfileData.xProfile ?? '',
				instagramProfile:
					data.instagramProfile ?? userProfileData.instagramProfile ?? '',
				facebookProfile:
					data.facebookProfile ?? userProfileData.facebookProfile ?? '',
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

	// Two separate non-atomic writes. This is necessary because a client-side
	// transaction cannot update two separate documents with granular field-level
	// security rules like ours.
	const userUpdate = updateDoc(userRef, {
		favoritePrompts: isFavorite ? arrayRemove(promptId) : arrayUnion(promptId),
	})

	const promptUpdate = updateDoc(promptRef, {
		'stats.likes': increment(isFavorite ? -1 : 1),
	})

	// Run them in parallel for better performance.
	await Promise.all([userUpdate, promptUpdate])
}


/**
 * Increments the view count of a user's profile.
 * Non-blocking "fire and forget" operation.
 */
export function incrementProfileView(firestore: Firestore, userId: string) {
	if (!userId) return
	const publicProfileRef = doc(firestore, 'public-profiles', userId)

	// Increment public profile views. This is a non-blocking "fire and forget" operation.
	updateDoc(publicProfileRef, {
		views: increment(1),
	}).catch(err => {
		// We don't want to bother the user if this fails. Log it for monitoring.
		console.warn(`Failed to increment profile view count for ${userId}:`, err)
	})
}

/**
 * Makes the current user follow a target user.
 * Creates documents in subcollections to represent the relationship.
 * Also updates the follower/following counts on the main profile documents.
 */
export async function followUser(
	firestore: Firestore,
	currentUserId: string,
	targetUserId: string,
) {
	if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
		throw new Error('Invalid user IDs provided.')
	}

	const batch = writeBatch(firestore)

	// Add target to current user's 'following' list (subcollection)
	const followingRef = doc(
		firestore,
		'users',
		currentUserId,
		'following',
		targetUserId,
	)
	batch.set(followingRef, { followedAt: serverTimestamp() })

	// Add current user to target's 'followers' list (subcollection)
	const followerRef = doc(
		firestore,
		'users',
		targetUserId,
		'followers',
		currentUserId,
	)
	batch.set(followerRef, { followedAt: serverTimestamp() })

	// Increment counts on public profiles
	const currentUserPublicRef = doc(firestore, 'public-profiles', currentUserId)
	const targetUserPublicRef = doc(firestore, 'public-profiles', targetUserId)

	batch.update(currentUserPublicRef, { following: increment(1) })
	batch.update(targetUserPublicRef, { followers: increment(1) })

	await batch.commit()
}

/**
 * Makes the current user unfollow a target user.
 * Removes documents from subcollections.
 * Also updates the follower/following counts on the main profile documents.
 */
export async function unfollowUser(
	firestore: Firestore,
	currentUserId: string,
	targetUserId: string,
) {
	if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
		throw new Error('Invalid user IDs provided.')
	}

	const batch = writeBatch(firestore)

	// Remove target from current user's 'following' list
	const followingRef = doc(
		firestore,
		'users',
		currentUserId,
		'following',
		targetUserId,
	)
	batch.delete(followingRef)

	// Remove current user from target's 'followers' list
	const followerRef = doc(
		firestore,
		'users',
		targetUserId,
		'followers',
		currentUserId,
	)
	batch.delete(followerRef)

	// Decrement counts on public profiles
	const currentUserPublicRef = doc(firestore, 'public-profiles', currentUserId)
	const targetUserPublicRef = doc(firestore, 'public-profiles', targetUserId)

	batch.update(currentUserPublicRef, { following: increment(-1) })
	batch.update(targetUserPublicRef, { followers: increment(-1) })

	await batch.commit()
}
