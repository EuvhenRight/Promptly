'use client'

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase'
import { collection } from 'firebase/firestore'
import React, { createContext, useContext, useEffect, useState } from 'react'

export type TagItem = { id: string; name: string }

type TagsContextValue = {
	tags: TagItem[]
	nameById: Record<string, string>
	getNames: (ids: string[] | string | undefined) => string[]
	isLoading: boolean
}

const TagsContext = createContext<TagsContextValue | null>(null)

export function TagsProvider({ children }: { children: React.ReactNode }) {
	const firestore = useFirestore()
	const [nameById, setNameById] = useState<Record<string, string>>({})

	const tagsQuery = useMemoFirebase(
		() => (firestore ? collection(firestore, 'tags') : null),
		[firestore],
	)
	const { data: tags, isLoading } = useCollection<TagItem>(tagsQuery)

	useEffect(() => {
		if (tags) {
			setNameById(Object.fromEntries(tags.map(t => [t.id, t.name])))
		}
	}, [tags])

	const getNames = (ids: string[] | string | undefined): string[] => {
		if (ids == null) return []
		const arr = Array.isArray(ids) ? ids : [ids]
		return arr.map(id => nameById[id.trim()] ?? id)
	}

	const value: TagsContextValue = {
		tags: tags ?? [],
		nameById,
		getNames,
		isLoading,
	}
	return <TagsContext.Provider value={value}>{children}</TagsContext.Provider>
}

/**
 * Resolve tag IDs to display names. Uses tags from a client-side context.
 * Falls back to raw ID if not in map.
 */
export function useTags(): TagsContextValue {
	const ctx = useContext(TagsContext)
	if (ctx) return ctx
	return {
		tags: [],
		nameById: {},
		getNames: (ids: string[] | string | undefined) => {
			if (ids == null) return []
			const arr = Array.isArray(ids) ? ids : [ids]
			return arr.map(id => String(id).trim())
		},
		isLoading: true,
	}
}
