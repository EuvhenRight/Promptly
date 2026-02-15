'use client'

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase'
import type { PayoutRequest, UserProfile } from '@/lib/types'
import { collection, query, orderBy } from 'firebase/firestore'
import { Loader2 } from 'lucide-react'
import { PayoutsTable, EnrichedPayoutRequest } from './payouts-table'
import { useMemo } from 'react'

export default function AdminPayoutsPage() {
	const firestore = useFirestore()

	const payoutsQuery = useMemoFirebase(
		() =>
			firestore
				? query(collection(firestore, 'payouts'), orderBy('requestedAt', 'desc'))
				: null,
		[firestore],
	)
	const { data: payouts, isLoading: payoutsLoading } =
		useCollection<PayoutRequest>(payoutsQuery)

	const usersQuery = useMemoFirebase(
		() => (firestore ? query(collection(firestore, 'users')) : null),
		[firestore],
	)
	const { data: users, isLoading: usersLoading } =
		useCollection<UserProfile>(usersQuery)

	const usersById = useMemo(() => {
		if (!users) return new Map<string, UserProfile>()
		return new Map(users.map(u => [u.uid, u]))
	}, [users])

	const enrichedPayouts: EnrichedPayoutRequest[] | null = useMemo(() => {
		if (!payouts) return null
		return payouts.map(p => ({
			...p,
			user: usersById.get(p.userId),
		}))
	}, [payouts, usersById])

	const isLoading = payoutsLoading || usersLoading

	const renderContent = () => {
		if (isLoading) {
			return (
				<div className='flex justify-center items-center h-64'>
					<Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
				</div>
			)
		}

		if (!enrichedPayouts || enrichedPayouts.length === 0) {
			return (
				<p className='text-muted-foreground text-center py-8'>
					No payout requests found.
				</p>
			)
		}

		return <PayoutsTable payouts={enrichedPayouts} />
	}

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between gap-4'>
				<h1 className='text-lg font-semibold md:text-2xl'>Payouts</h1>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Payout Requests</CardTitle>
					<CardDescription>
						Review and process withdrawal requests from users.
					</CardDescription>
				</CardHeader>
				<CardContent>{renderContent()}</CardContent>
			</Card>
		</div>
	)
}
