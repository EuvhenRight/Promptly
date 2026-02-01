'use client'

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
	const [nameById, setNameById] = useState<Record<string, string>>({})
	const [tags, setTags] = useState<TagItem[]>([])
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		setIsLoading(true)
		fetch('/api/tags')
			.then(res => (res.ok ? res.json() : []))
			.then((data: TagItem[]) => {
				const list = Array.isArray(data) ? data : []
				setTags(list)
				setNameById(Object.fromEntries(list.map(t => [t.id, t.name])))
			})
			.catch(() => {
				setTags([])
				setNameById({})
			})
			.finally(() => setIsLoading(false))
	}, [])

	const getNames = (ids: string[] | string | undefined): string[] => {
		if (ids == null) return []
		const arr = Array.isArray(ids) ? ids : [ids]
		return arr.map(id => nameById[id.trim()] ?? id)
	}

	const value: TagsContextValue = { tags, nameById, getNames, isLoading }
	return <TagsContext.Provider value={value}>{children}</TagsContext.Provider>
}

/**
 * Resolve tag IDs to display names. Uses tags from API (id → name).
 * Falls back to raw ID if not in map (e.g. legacy or missing).
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
		isLoading: false,
	}
}
