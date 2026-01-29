'use client';

import { Firestore, doc, updateDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

export type UpdateUserData = Pick<UserProfile, 'displayName' | 'role'>;

/**
 * Updates a user's profile in Firestore.
 * @param firestore The Firestore instance.
 * @param userId The ID of the user to update.
 * @param data The data to update.
 */
export async function updateUserProfile(
  firestore: Firestore,
  userId: string,
  data: UpdateUserData
): Promise<void> {
  if (!userId) throw new Error('User ID is required.');

  const userRef = doc(firestore, 'users', userId);

  try {
    await updateDoc(userRef, {
      ...data,
    });
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    throw new Error(error.message || 'Failed to update user profile.');
  }
}
