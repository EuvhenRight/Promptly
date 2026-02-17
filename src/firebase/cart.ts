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

const LOCAL_CART_KEY = 'promptly_local_cart';

type LocalCart = {
	promptIds: string[];
};

/**
 * Adds a prompt to the user's active shopping cart.
 * If the user is not logged in, it uses localStorage.
 *
 * @param db The Firestore instance.
 * @param userId The ID of the user, or null if not logged in.
 * @param promptId The ID of the prompt to add.
 */
export function addPromptToCart(
	db: Firestore | null,
	userId: string | null,
	promptId: string,
) {
	if (userId && db) {
		// Logged-in user: use Firestore
		const cartRef = doc(db, 'users', userId, 'carts', 'active');
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
					requestResourceData: { promptId, userId },
				}),
			);
		});
	} else {
		// Guest user: use localStorage
		try {
			const localCartRaw = localStorage.getItem(LOCAL_CART_KEY);
			const localCart: LocalCart = localCartRaw
				? JSON.parse(localCartRaw)
				: { promptIds: [] };

			if (!localCart.promptIds.includes(promptId)) {
				localCart.promptIds.push(promptId);
				localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(localCart));
				// Dispatch a storage event so other components (like Header) can update
				window.dispatchEvent(new Event('storage'));
			}
		} catch (error) {
			console.error('Error updating local cart:', error);
		}
	}
}

/**
 * Removes a prompt from the user's active cart.
 * If the user is not logged in, it uses localStorage.
 */
export function removePromptFromCart(
	db: Firestore | null,
	userId: string | null,
	promptId: string,
) {
	if (userId && db) {
		// Logged-in user
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
	} else {
		// Guest user
		try {
			const localCartRaw = localStorage.getItem(LOCAL_CART_KEY);
			if (!localCartRaw) return;

			const localCart: LocalCart = JSON.parse(localCartRaw);
			const updatedIds = localCart.promptIds.filter(id => id !== promptId);

			if (updatedIds.length !== localCart.promptIds.length) {
				localCart.promptIds = updatedIds;
				localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(localCart));
				window.dispatchEvent(new Event('storage'));
			}
		} catch (error) {
			console.error('Error removing from local cart:', error);
		}
	}
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
