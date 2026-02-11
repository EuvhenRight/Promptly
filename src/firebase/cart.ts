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

  setDoc(cartRef, cartData, { merge: true })
    .catch((error) => {
      console.error("Error adding to cart: ", error);
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: cartRef.path,
          operation: 'write',
          requestResourceData: {
             promptId: promptId,
             userId: userId,
          },
        })
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
export function removePromptFromCart(db: Firestore, userId: string, promptId: string) {
  const cartRef = doc(db, 'users', userId, 'carts', 'active');

  updateDoc(cartRef, {
    promptIds: arrayRemove(promptId),
    updatedAt: serverTimestamp(),
  }).catch((error) => {
    console.error("Error removing from cart: ", error);
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: cartRef.path,
        operation: 'write',
        requestResourceData: { promptId, userId },
      })
    );
  });
}
