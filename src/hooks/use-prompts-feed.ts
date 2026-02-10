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
	endAt,
	startAt,
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
	modelId,
	sortBy,
	searchTerm,
}: {
	categoryId: string | null
	typeId: string | null
	tagId: string | null
	modelId: string | null
	sortBy: SortByOption
	searchTerm: string | null
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
				let firestoreQueryConstraints: QueryConstraint[] = []
				let clientSideFilter: (prompt: Prompt) => boolean = () => true
				let clientSideSort: ((a: Prompt, b: Prompt) => number) | undefined =
					undefined

				// If there's a search term, we perform a text search in Firestore
				// and do the rest of the filtering/sorting on the client-side.
				if (searchTerm) {
					const searchTermLower = searchTerm.toLowerCase()
					firestoreQueryConstraints.push(
						where('searchTerms', 'array-contains', searchTermLower),
					)

					const filters: ((p: Prompt) => boolean)[] = []
					if (categoryId) filters.push(p => p.categoryId === categoryId)
					if (typeId) filters.push(p => p.typeId === typeId)
					if (tagId) filters.push(p => p.tags.includes(tagId))
					if (modelId) filters.push(p => p.modelId === modelId)
					if (filters.length > 0) {
						clientSideFilter = p => filters.every(f => f(p))
					}

					const [sortField, sortDirection] = sortBy.split(':') as [
						keyof Prompt,
						'asc' | 'desc',
					]

					clientSideSort = (a, b) => {
						const valA = getNestedValue(a, sortField) ?? 0
						const valB = getNestedValue(b, sortField) ?? 0
						if (valA < valB) return sortDirection === 'asc' ? -1 : 1
						if (valA > valB) return sortDirection === 'asc' ? 1 : -1
						return 0
					}
				} else {
					// No search term, so we can use Firestore for all filtering and sorting.
					if (categoryId)
						firestoreQueryConstraints.push(
							where('categoryId', '==', categoryId),
						)
					if (tagId)
						firestoreQueryConstraints.push(where('tags', 'array-contains', tagId))
					if (typeId)
						firestoreQueryConstraints.push(where('typeId', '==', typeId))
					if (modelId)
						firestoreQueryConstraints.push(where('modelId', '==', modelId))

					const [sortField, sortDirection] = sortBy.split(':') as [
						string,
						'asc' | 'desc',
					]
					firestoreQueryConstraints.push(orderBy(sortField, sortDirection))
					if (sortField !== 'createdAt') {
						firestoreQueryConstraints.push(orderBy('createdAt', 'desc'))
					}
				}

				if (initialLoad && !searchTerm) {
					const countQuery = query(promptsCollection, ...firestoreQueryConstraints)
					try {
						const snapshot = await getCountFromServer(countQuery)
						setTotalCount(snapshot.data().count)
					} catch (e) {
						console.warn('Count query failed, possibly needs index:', e)
						setTotalCount(null)
					}
				}

				let q
				if (initialLoad) {
					q = query(
						promptsCollection,
						...firestoreQueryConstraints,
						limit(PAGE_SIZE),
					)
				} else if (lastVisible && !searchTerm) {
					// Pagination only works for Firestore queries
					q = query(
						promptsCollection,
						...firestoreQueryConstraints,
						startAfter(lastVisible),
						limit(PAGE_SIZE),
					)
				} else {
					setLoading(false)
					setHasMore(false)
					return // No more pages to load
				}

				const documentSnapshots = await getDocs(q)
				let newPrompts = documentSnapshots.docs.map(
					doc => ({ id: doc.id, ...doc.data() } as Prompt),
				)

				if (searchTerm) {
					newPrompts = newPrompts.filter(clientSideFilter)
					if (clientSideSort) {
						newPrompts.sort(clientSideSort)
					}
					if (initialLoad) {
						setTotalCount(newPrompts.length)
					}
					// For client-side search, we fetch all results at once and disable pagination.
					setHasMore(false)
				}

				const lastDoc =
					documentSnapshots.docs[documentSnapshots.docs.length - 1]
				setLastVisible(lastDoc || null)

				if (documentSnapshots.docs.length < PAGE_SIZE && !searchTerm) {
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[firestore, loading, lastVisible, categoryId, typeId, tagId, modelId, sortBy, searchTerm],
	)

	useEffect(() => {
		setPrompts([])
		setLastVisible(null)
		setHasMore(true)
		setTotalCount(null)
		fetchPrompts(true)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [firestore, categoryId, typeId, tagId, modelId, sortBy, searchTerm])

	const loadMore = useCallback(() => {
		if (hasMore && !loading) {
			fetchPrompts(false)
		}
	}, [hasMore, loading, fetchPrompts])

	return { prompts, loading, error, hasMore, loadMore, totalCount }
}

function getNestedValue(obj: any, path: string): any {
	return path.split('.').reduce((acc, part) => acc && acc[part], obj)
}
