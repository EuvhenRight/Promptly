'use client';

import {
	doc,
	setDoc,
	updateDoc,
	arrayUnion,
	arrayRemove,
	serverTimestamp,
	Firestore,
	runTransaction,
	getDocs,
	collection,
	query,
	where,
	documentId,
	increment,
} from 'firebase/firestore'
import { errorEmitter } from './error-emitter'
import { FirestorePermissionError } from './errors'
import type { Prompt, UserProfile } from '@/lib/types'

/**
 * Adds a prompt to the user's active shopping cart.
 * If the cart doesn't exist, it will be created.
 * This operation is non-blocking.
 *
 * @param db The Firestore instance.
 * @param userId The ID of the user.
 * @param promptId The ID of the prompt to add.
 */
export function addPromptToCart(db: Firestore, userId: string, promptId: string) {
	const cartRef = doc(db, 'users', userId, 'carts', 'active')

	// We use setDoc with merge:true.
	// On first add, it creates the doc and we can set `createdAt`.
	// On subsequent adds, it merges, and arrayUnion prevents duplicates.
	const cartData = {
		id: 'active',
		userId: userId,
		promptIds: arrayUnion(promptId),
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp(),
	}

	setDoc(cartRef, cartData, { merge: true }).catch(error => {
		console.error('Error adding to cart: ', error)
		errorEmitter.emit(
			'permission-error',
			new FirestorePermissionError({
				path: cartRef.path,
				operation: 'write',
				requestResourceData: {
					promptId: promptId,
					userId: userId,
				},
			}),
		)
	})
}

/**
 * Removes a prompt from the user's active cart.
 *
 * @param db The Firestore instance.
 * @param userId The ID of the user.
 * @param promptId The ID of the prompt to remove.
 */
export function removePromptFromCart(
	db: Firestore,
	userId: string,
	promptId: string,
) {
	const cartRef = doc(db, 'users', userId, 'carts', 'active')

	updateDoc(cartRef, {
		promptIds: arrayRemove(promptId),
		updatedAt: serverTimestamp(),
	}).catch(error => {
		console.error('Error removing from cart: ', error)
		errorEmitter.emit(
			'permission-error',
			new FirestorePermissionError({
				path: cartRef.path,
				operation: 'write',
				requestResourceData: { promptId, userId },
			}),
		)
	})
}

/**
 * Purchases all items in the cart using the user's credit balance.
 */
export async function purchaseCartWithCredits(
	firestore: Firestore,
	userId: string,
	promptIds: string[],
): Promise<void> {
	if (promptIds.length === 0) {
		throw new Error('Cart is empty.')
	}

	const userRef = doc(firestore, 'users', userId)
	const cartRef = doc(firestore, 'users', userId, 'carts', 'active')

	await runTransaction(firestore, async transaction => {
		// 1. Get user data and prompt data
		const userDoc = await transaction.get(userRef)
		if (!userDoc.exists()) throw new Error('User not found.')
		const userData = userDoc.data() as UserProfile

		const promptsQuery = query(
			collection(firestore, 'prompts'),
			where(documentId(), 'in', promptIds),
		)
		const promptsSnapshot = await getDocs(promptsQuery)

		if (promptsSnapshot.docs.length !== promptIds.length) {
			throw new Error('One or more prompts in the cart could not be found.')
		}

		// 2. Calculate total cost and check balance
		let totalCost = 0
		promptsSnapshot.docs.forEach(doc => {
			const promptData = doc.data() as Prompt
			totalCost += Math.round(promptData.price * 100)
		})

		const userCredits = userData.credits ?? 0
		if (userCredits < totalCost) {
			throw new Error('Insufficient credits.')
		}

		// 3. Update user's credits and purchased prompts
		transaction.update(userRef, {
			credits: increment(-totalCost),
			purchasedPrompts: arrayUnion(...promptIds),
		})

		// 4. Update sales count for each prompt
		promptsSnapshot.docs.forEach(doc => {
			transaction.update(doc.ref, {
				'stats.sales': increment(1),
			})
		})

		// 5. Clear the user's cart
		transaction.update(cartRef, {
			promptIds: [],
			updatedAt: serverTimestamp(),
		})
	})
}
