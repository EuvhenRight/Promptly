'use client';

import {
	doc,
	setDoc,
	updateDoc,
	arrayUnion,
	arrayRemove,
	serverTimestamp,
	Firestore,
} from 'firebase/firestore';
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError } from './errors';
import { getAuth } from 'firebase/auth';

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
	const cartRef = doc(db, 'users', userId, 'carts', 'active');

	// We use setDoc with merge:true.
	// On first add, it creates the doc and we can set `createdAt`.
	// On subsequent adds, it merges, and arrayUnion prevents duplicates.
	const cartData = {
		id: 'active',
		userId: userId,
		promptIds: arrayUnion(promptId),
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp(),
	};

	setDoc(cartRef, cartData, { merge: true }).catch(error => {
		console.error('Error adding to cart: ', error);
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
		);
	});
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
	const cartRef = doc(db, 'users', userId, 'carts', 'active');

	updateDoc(cartRef, {
		promptIds: arrayRemove(promptId),
		updatedAt: serverTimestamp(),
	}).catch(error => {
		console.error('Error removing from cart: ', error);
		errorEmitter.emit(
			'permission-error',
			new FirestorePermissionError({
				path: cartRef.path,
				operation: 'write',
				requestResourceData: { promptId, userId },
			}),
		);
	});
}

/**
 * Purchases all items in the cart using the user's credit balance by calling a secure API endpoint.
 */
export async function purchaseCartWithCredits(
	firestore: Firestore, // firestore is kept for API consistency but not used in the new flow
	userId: string,
	promptIds: string[],
): Promise<void> {
	const auth = getAuth();
	const user = auth.currentUser;
	if (!user || user.uid !== userId) {
		throw new Error('You must be signed in to purchase.');
	}
	if (!promptIds || promptIds.length === 0) {
		throw new Error('Your cart is empty.');
	}

	const idToken = await user.getIdToken();

	const response = await fetch('/api/purchase', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${idToken}`,
		},
		body: JSON.stringify({ type: 'cart', promptIds: promptIds }),
	});

	if (!response.ok) {
		const result = await response.json();
		throw new Error(result.error || 'An unknown error occurred during purchase.');
	}
}
