'use client'

import { useFirestore } from '@/firebase'
import type { Prompt } from '@/lib/types'
import {
	collection,
	DocumentData,
	getDocs,
	limit,
	orderBy,
	query,
	QueryConstraint,
	QueryDocumentSnapshot,
	startAfter,
	where,
} from 'firebase/firestore'
import { useCallback, useEffect, useState } from 'react'

const PAGE_SIZE = 10

export function usePromptsFeed({
	categoryId,
	typeId,
}: {
	categoryId: string | null
	typeId: string | null
}) {
	const firestore = useFirestore()
	const [prompts, setPrompts] = useState<Prompt[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<Error | null>(null)
	const [lastVisible, setLastVisible] =
		useState<QueryDocumentSnapshot<DocumentData> | null>(null)
	const [hasMore, setHasMore] = useState(true)

	const fetchPrompts = useCallback(
		async (initialLoad = false) => {
			if (loading && !initialLoad) return
			setLoading(true)
			setError(null)

			try {
				const promptsCollection = collection(firestore, 'prompts')
				const baseConstraints: QueryConstraint[] = [orderBy('createdAt', 'desc')]

				if (categoryId) {
					baseConstraints.push(where('categoryId', '==', categoryId))
				}
				if (typeId) {
					baseConstraints.push(where('typeId', '==', typeId))
				}

				let q
				if (initialLoad) {
					q = query(promptsCollection, ...baseConstraints, limit(PAGE_SIZE))
				} else if (lastVisible) {
					q = query(
						promptsCollection,
						...baseConstraints,
						startAfter(lastVisible),
						limit(PAGE_SIZE),
					)
				} else {
					setLoading(false)
					setHasMore(false)
					return
				}

				const documentSnapshots = await getDocs(q)

				const newPrompts = documentSnapshots.docs.map(doc => {
					return { id: doc.id, ...doc.data() } as Prompt
				})

				const lastDoc =
					documentSnapshots.docs[documentSnapshots.docs.length - 1]
				setLastVisible(lastDoc || null)

				if (documentSnapshots.docs.length < PAGE_SIZE) {
					setHasMore(false)
				}

				setPrompts(prevPrompts =>
					initialLoad ? newPrompts : [...prevPrompts, ...newPrompts],
				)
			} catch (err: any) {
				console.error('Error fetching prompts:', err)
				setError(err)
			} finally {
				setLoading(false)
			}
		},
		[firestore, loading, lastVisible, categoryId, typeId],
	)

	useEffect(() => {
		setPrompts([])
		setLastVisible(null)
		setHasMore(true)
		fetchPrompts(true)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [firestore, categoryId, typeId])

	const loadMore = useCallback(() => {
		if (hasMore && !loading) {
			fetchPrompts(false)
		}
	}, [hasMore, loading, fetchPrompts])

	return { prompts, loading, error, hasMore, loadMore }
}
