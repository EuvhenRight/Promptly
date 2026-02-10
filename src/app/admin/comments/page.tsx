'use client'

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { useFirestore } from '@/firebase'
import { AdminComment, PromptComment } from '@/lib/types'
import {
	collectionGroup,
	onSnapshot,
	orderBy,
	query,
} from 'firebase/firestore'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CommentsTable } from './comments-table'

export default function AdminCommentsPage() {
	const firestore = useFirestore()
	const [comments, setComments] = useState<AdminComment[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<Error | null>(null)

	useEffect(() => {
		if (!firestore) return

		const q = query(
			collectionGroup(firestore, 'comments'),
			orderBy('rating', 'asc'),
			orderBy('timestamp', 'desc'),
		)

		const unsubscribe = onSnapshot(
			q,
			snapshot => {
				const fetchedComments = snapshot.docs.map(doc => {
					const promptId = doc.ref.parent.parent!.id
					return {
						...(doc.data() as PromptComment),
						id: doc.id,
						promptId: promptId,
					}
				})
				setComments(fetchedComments)
				setLoading(false)
				setError(null)
			},
			err => {
				console.error('Failed to fetch comments:', err)
				setError(err)
				setLoading(false)
			},
		)

		return () => unsubscribe()
	}, [firestore])

	const renderContent = () => {
		if (loading) {
			return (
				<div className='flex justify-center items-center h-64'>
					<Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
				</div>
			)
		}

		if (error) {
			return (
				<p className='text-destructive'>Error loading comments: {error.message}</p>
			)
		}

		if (comments.length === 0) {
			return <p>No comments found.</p>
		}

		return <CommentsTable comments={comments} />
	}

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between gap-4'>
				<h1 className='text-lg font-semibold md:text-2xl'>Comment Manager</h1>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>All Comments</CardTitle>
					<CardDescription>
						Manage user feedback. Reviews are sorted by rating (lowest first).
					</CardDescription>
				</CardHeader>
				<CardContent>{renderContent()}</CardContent>
			</Card>
		</div>
	)
}