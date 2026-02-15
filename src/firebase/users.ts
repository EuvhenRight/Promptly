'use client'

import type { PayoutRequest, PublicProfile, UserProfile, Prompt } from '@/lib/types'
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
	type Timestamp,
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

	const batch = writeBatch(firestore)

	batch.update(userRef, {
		favoritePrompts: isFavorite ? arrayRemove(promptId) : arrayUnion(promptId),
	})

	batch.update(promptRef, {
		'stats.likes': increment(isFavorite ? -1 : 1),
	})

	await batch.commit()

	// Send notification on like (not on unlike)
	if (!isFavorite) {
		try {
			const promptSnap = await getDoc(promptRef)
			const userSnap = await getDoc(doc(firestore, 'users', userId)) // The user who liked

			if (promptSnap.exists() && userSnap.exists()) {
				const promptData = promptSnap.data() as Prompt
				const likingUser = userSnap.data() as UserProfile
				const authorId = promptData.authorId

				if (authorId && authorId !== userId) {
					const notificationRef = doc(
						collection(firestore, 'users', authorId, 'notifications'),
					)
					await setDoc(notificationRef, {
						type: 'like',
						title: 'New Like!',
						body: `${likingUser.displayName} liked your prompt "${promptData.title}".`,
						link: `/prompt/${promptId}`,
						isRead: false,
						createdAt: serverTimestamp(),
					})
				}
			}
		} catch (notificationError) {
			console.error("Failed to create 'like' notification:", notificationError)
			// Non-critical error, don't throw to the user
		}
	}
}

/**
 * Increments the view count of a user's profile.
 * Non-blocking "fire and forget" operation.
 */
export function incrementProfileView(firestore: Firestore, userId: string) {
	if (!userId) return
	const publicProfileRef = doc(firestore, 'public-profiles', userId)

	updateDoc(publicProfileRef, {
		views: increment(1),
	}).catch(err => {
		console.warn(`Failed to increment profile view count for ${userId}:`, err)
	})
}

/**
 * Makes the current user follow a target user.
 */
export async function followUser(
	firestore: Firestore,
	currentUserId: string,
	targetUserId: string,
) {
	if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
		throw new Error('Invalid user IDs provided.')
	}

	await runTransaction(firestore, async transaction => {
		const currentUserPublicRef = doc(firestore, 'public-profiles', currentUserId)
		const targetUserPublicRef = doc(firestore, 'public-profiles', targetUserId)
		const followingRef = doc(
			firestore,
			'users',
			currentUserId,
			'following',
			targetUserId,
		)
		const followerRef = doc(
			firestore,
			'users',
			targetUserId,
			'followers',
			currentUserId,
		)
		const notificationRef = doc(
			collection(firestore, 'users', targetUserId, 'notifications'),
		)

		const [currentUserPublicDoc] = await Promise.all([
			transaction.get(currentUserPublicRef),
			transaction.get(targetUserPublicRef),
		])

		if (!currentUserPublicDoc.exists()) {
			throw new Error('Could not find your public profile.')
		}
		const currentUserPublicProfile = currentUserPublicDoc.data() as PublicProfile

		transaction.set(followingRef, { followedAt: serverTimestamp() })
		transaction.set(followerRef, { followedAt: serverTimestamp() })
		transaction.update(currentUserPublicRef, { following: increment(1) })
		transaction.update(targetUserPublicRef, { followers: increment(1) })

		transaction.set(notificationRef, {
			type: 'follow',
			title: 'New Follower',
			body: `${currentUserPublicProfile.displayName} started following you.`,
			link: `/user/${currentUserPublicProfile.username}`,
			isRead: false,
			createdAt: serverTimestamp(),
		})
	})
}

/**
 * Makes the current user unfollow a target user.
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
	const currentUserPublicRef = doc(firestore, 'public-profiles', currentUserId)
	const targetUserPublicRef = doc(firestore, 'public-profiles', targetUserId)
	const followingRef = doc(
		firestore,
		'users',
		currentUserId,
		'following',
		targetUserId,
	)
	const followerRef = doc(
		firestore,
		'users',
		targetUserId,
		'followers',
		currentUserId,
	)

	batch.delete(followingRef)
	batch.delete(followerRef)
	batch.update(currentUserPublicRef, { following: increment(-1) })
	batch.update(targetUserPublicRef, { followers: increment(-1) })

	await batch.commit()
}

/**
 * Updates a user's subscription cancellation status.
 */
export async function manageSubscriptionCancellation(
	firestore: Firestore,
	userId: string,
	cancel: boolean,
): Promise<void> {
	if (!userId) throw new Error('User ID is required.')
	const userRef = doc(firestore, 'users', userId)
	await updateDoc(userRef, {
		planWillCancelAtPeriodEnd: cancel,
	})
}

/**
 * Creates a payout request for a user if they meet the requirements.
 */
export async function requestPayout(
	firestore: Firestore,
	userId: string,
): Promise<void> {
	if (!userId) throw new Error('User ID is required.')

	const userRef = doc(firestore, 'users', userId)
	const payoutRequestRef = doc(collection(firestore, 'payouts')) // New request with a new ID

	await runTransaction(firestore, async transaction => {
		const userDoc = await transaction.get(userRef)
		if (!userDoc.exists()) {
			throw new Error('User profile does not exist.')
		}

		const userData = userDoc.data() as UserProfile
		const earnings = userData.earnings ?? 0
		const payoutStatus = userData.payoutStatus ?? 'none'
		const MIN_PAYOUT_CREDITS = 5000 // 50 EUR in credits

		if (earnings < MIN_PAYOUT_CREDITS) {
			throw new Error(
				`You need at least ${MIN_PAYOUT_CREDITS} credits in earnings to request a payout.`,
			)
		}

		if (
			payoutStatus !== 'none' &&
			payoutStatus !== 'paid' &&
			payoutStatus !== 'rejected'
		) {
			throw new Error('You already have a pending or processing payout request.')
		}

		const payoutAmountCredits = earnings
		const payoutAmountEuros = payoutAmountCredits / 100 // 100 credits = 1 EUR

		// 1. Create the PayoutRequest document
		const newPayout: PayoutRequest = {
			id: payoutRequestRef.id,
			userId,
			amountCredits: payoutAmountCredits,
			amountCurrency: payoutAmountEuros,
			currency: 'eur',
			status: 'pending',
			requestedAt: serverTimestamp() as Timestamp,
		}
		transaction.set(payoutRequestRef, newPayout)

		// 2. Update the user's profile: subtract from both balances and set status
		transaction.update(userRef, {
			earnings: 0, // Reset earnings, but do not deduct from main credits balance
			payoutStatus: 'pending',
		})
	})
}
