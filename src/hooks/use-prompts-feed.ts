'use client'

import { useFirestore } from '@/firebase'
import type { Prompt } from '@/lib/types'
import { messageForLog } from '@/lib/error-log'
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
import { useCallback, useEffect, useRef, useState } from 'react'

const PAGE_SIZE = 10

function isTimeoutOrAbort(err: unknown): boolean {
	if (err instanceof Error) {
		const code = (err as Error & { code?: number }).code
		return code === 23 || err.name === 'TimeoutError' || err.name === 'AbortError'
	}
	return !!(err && typeof err === 'object' && 'code' in err && (err as { code?: number }).code === 23)
}

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
	privateOnly,
	excludeAuthorId,
}: {
	categoryId: string | null
	typeId: string | null
	tagId: string | null
	modelId: string | null
	sortBy: SortByOption
	searchTerm: string | null
	privateOnly?: boolean
	excludeAuthorId?: string | null
}) {
	const firestore = useFirestore()
	const [prompts, setPrompts] = useState<Prompt[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<Error | null>(null)
	const [lastVisible, setLastVisible] =
		useState<QueryDocumentSnapshot<DocumentData> | null>(null)
	const [hasMore, setHasMore] = useState(true)
	const [totalCount, setTotalCount] = useState<number | null>(null)
	const initialRetryRef = useRef(0)

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

				if (privateOnly) {
					firestoreQueryConstraints.push(where('isPrivate', '==', true))
				}

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

				if (excludeAuthorId) {
					newPrompts = newPrompts.filter(p => p.authorId !== excludeAuthorId)
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
			} catch (err: unknown) {
				// Retry initial load once on timeout so first load can succeed
				if (initialLoad && isTimeoutOrAbort(err) && initialRetryRef.current < 1) {
					initialRetryRef.current += 1
					console.warn('Prompts fetch timed out, retrying once...')
					setLoading(false)
					setTimeout(() => fetchPrompts(true), 1500)
					return
				}
				console.error('Error fetching prompts:', messageForLog(err))
				setError(err instanceof Error ? err : new Error(String(err)))
			} finally {
				setLoading(false)
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[
			firestore,
			loading,
			lastVisible,
			categoryId,
			typeId,
			tagId,
			modelId,
			sortBy,
			searchTerm,
			privateOnly,
			excludeAuthorId,
		],
	)

	useEffect(() => {
		// Don't clear prompts here: keep previous list visible so FormKit Auto Animate
		// can animate the reorder when new data arrives (same parent, children move).
		initialRetryRef.current = 0
		setLastVisible(null)
		setHasMore(true)
		setTotalCount(null)
		fetchPrompts(true)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		firestore,
		categoryId,
		typeId,
		tagId,
		modelId,
		sortBy,
		searchTerm,
		privateOnly,
		excludeAuthorId,
	])

	const loadMore = useCallback(() => {
		fetchPrompts(false)
	}, [fetchPrompts])

	return { prompts, loading, error, hasMore, loadMore, totalCount }
}

function getNestedValue(obj: any, path: string): any {
	return path.split('.').reduce((acc, part) => acc && acc[part], obj)
}
