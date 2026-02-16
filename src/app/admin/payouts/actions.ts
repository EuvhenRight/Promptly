'use server'

import { adminDb } from '@/firebase/admin'
import type { PayoutRequest } from '@/lib/types'
import { FieldValue } from 'firebase-admin/firestore'

/**
 * Updates the status of a payout request and the corresponding user's profile.
 *
 * @param payoutId The ID of the payout request document.
 * @param newStatus The new status for the payout ('approved', 'rejected', or 'paid').
 * @returns An object indicating success or an error message.
 */
export async function updatePayoutStatus(
	payoutId: string,
	newStatus: 'approved' | 'rejected' | 'paid',
): Promise<{ success: boolean; error?: string }> {
	if (!adminDb) {
		return {
			success: false,
			error: 'Firebase Admin not initialized. Cannot process payout.',
		}
	}

	const payoutRef = adminDb.collection('payouts').doc(payoutId)

	try {
		await adminDb.runTransaction(async transaction => {
			const payoutDoc = await transaction.get(payoutRef)
			if (!payoutDoc.exists) {
				throw new Error('Payout request not found.')
			}

			const payoutData = payoutDoc.data() as PayoutRequest
			const userRef = adminDb!.collection('users').doc(payoutData.userId)
			const userDoc = await transaction.get(userRef)
			if (!userDoc.exists) {
				throw new Error(
					`User profile for user ID ${payoutData.userId} not found.`,
				)
			}

			// Define updates for the payout document
			const payoutUpdate: { status: string; processedAt?: FieldValue } = {
				status: newStatus,
			}
			if (newStatus === 'paid' || newStatus === 'rejected') {
				payoutUpdate.processedAt = FieldValue.serverTimestamp()
			}
			transaction.update(payoutRef, payoutUpdate)

			// Define updates for the user document
			let userUpdate: { payoutStatus: string; credits?: FieldValue } = {
				payoutStatus: newStatus,
			}

			if (newStatus === 'rejected') {
				// Refund the credits that were deducted on request.
				userUpdate = {
					payoutStatus: 'none',
					credits: FieldValue.increment(payoutData.amountCredits),
				}
			} else if (newStatus === 'paid') {
				// The payout is successful. The balances were already deducted. Just reset the status.
				userUpdate = {
					payoutStatus: 'none',
				}
			}

			transaction.update(userRef, userUpdate)

			// Create a notification for the user
			if (newStatus === 'paid' || newStatus === 'rejected') {
				const notificationRef = adminDb
					.collection('users')
					.doc(payoutData.userId)
					.collection('notifications')
					.doc()
				const title = newStatus === 'paid' ? 'Payout Sent' : 'Payout Rejected'
				const body =
					newStatus === 'paid'
						? `Your payout of €${payoutData.amountCurrency.toFixed(2)} has been sent.`
						: 'There was an issue with your payout request. Please contact support.'
				transaction.set(notificationRef, {
					userId: payoutData.userId,
					type: 'payout',
					title,
					body,
					link: '/account/wallet',
					isRead: false,
					createdAt: FieldValue.serverTimestamp(),
				})
			}
		})

		return { success: true }
	} catch (error: any) {
		console.error('Error updating payout status:', error)
		return { success: false, error: error.message }
	}
}
