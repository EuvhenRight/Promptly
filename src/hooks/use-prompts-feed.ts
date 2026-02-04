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
	getCountFromServer,
} from 'firebase/firestore'
import { useCallback, useEffect, useState } from 'react'

const PAGE_SIZE = 10

export type SortByOption =
	| 'createdAt:desc'
	| 'price:asc'
	| 'price:desc'
	| 'rating.average:desc'
	| 'stats.views:desc'

export function usePromptsFeed({
	categoryId,
	typeId,
	tagId,
	sortBy,
}: {
	categoryId: string | null
	typeId: string | null
	tagId: string | null
	sortBy: SortByOption
}) {
	const firestore = useFirestore()
	const [prompts, setPrompts] = useState<Prompt[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<Error | null>(null)
	const [lastVisible, setLastVisible] =
		useState<QueryDocumentSnapshot<DocumentData> | null>(null)
	const [hasMore, setHasMore] = useState(true)
	const [totalCount, setTotalCount] = useState<number | null>(null)

	const fetchPrompts = useCallback(
		async (initialLoad = false) => {
			if (loading && !initialLoad) return
			setLoading(true)
			setError(null)

			try {
				const promptsCollection = collection(firestore, 'prompts')
				const queryConstraints: QueryConstraint[] = []
				const countConstraints: QueryConstraint[] = []

				if (categoryId) {
					const constraint = where('categoryId', '==', categoryId)
					queryConstraints.push(constraint)
					countConstraints.push(constraint)
				}
				if (tagId) {
					const constraint = where('tags', 'array-contains', tagId)
					queryConstraints.push(constraint)
					countConstraints.push(constraint)
				}
				if (typeId) {
					const constraint = where('typeId', '==', typeId)
					queryConstraints.push(constraint)
					countConstraints.push(constraint)
				}

				if (initialLoad) {
					const countQuery = query(promptsCollection, ...countConstraints)
					const snapshot = await getCountFromServer(countQuery)
					setTotalCount(snapshot.data().count)
				}

				const [sortField, sortDirection] = sortBy.split(':') as [
					string,
					'asc' | 'desc',
				]

				const finalConstraints = [
					...queryConstraints,
					orderBy(sortField, sortDirection),
				]

				if (sortField !== 'createdAt') {
					finalConstraints.push(orderBy('createdAt', 'desc'))
				}

				let q
				if (initialLoad) {
					q = query(promptsCollection, ...finalConstraints, limit(PAGE_SIZE))
				} else if (lastVisible) {
					q = query(
						promptsCollection,
						...finalConstraints,
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
		[firestore, loading, lastVisible, categoryId, typeId, tagId, sortBy],
	)

	useEffect(() => {
		setPrompts([])
		setLastVisible(null)
		setHasMore(true)
		setTotalCount(null)
		fetchPrompts(true)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [firestore, categoryId, typeId, tagId, sortBy])

	const loadMore = useCallback(() => {
		if (hasMore && !loading) {
			fetchPrompts(false)
		}
	}, [hasMore, loading, fetchPrompts])

	return { prompts, loading, error, hasMore, loadMore, totalCount }
}
