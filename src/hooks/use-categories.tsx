'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export type CategoryItem = { id: string; name: string }

type CategoriesContextValue = {
	categories: CategoryItem[]
	nameById: Record<string, string>
	getNames: (ids: string[] | string | undefined) => string[]
	isLoading: boolean
}

const CategoriesContext = createContext<CategoriesContextValue | null>(null)

export function CategoriesProvider({
	children,
}: {
	children: React.ReactNode
}) {
	const [nameById, setNameById] = useState<Record<string, string>>({})
	const [categories, setCategories] = useState<CategoryItem[]>([])
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		setIsLoading(true)
		fetch('/api/categories')
			.then(res => (res.ok ? res.json() : []))
			.then((data: CategoryItem[]) => {
				const list = Array.isArray(data) ? data : []
				setCategories(list)
				setNameById(Object.fromEntries(list.map(c => [c.id, c.name])))
			})
			.catch(() => {
				setCategories([])
				setNameById({})
			})
			.finally(() => setIsLoading(false))
	}, [])

	const getNames = (ids: string[] | string | undefined): string[] => {
		if (ids == null) return []
		const arr = Array.isArray(ids) ? ids : [ids]
		return arr.map(id => nameById[id.trim()] ?? id)
	}

	const value: CategoriesContextValue = {
		categories,
		nameById,
		getNames,
		isLoading,
	}
	return (
		<CategoriesContext.Provider value={value}>
			{children}
		</CategoriesContext.Provider>
	)
}

/**
 * Resolve category IDs to display names. Uses categories from API (id → name).
 * Falls back to raw ID if not in map (e.g. legacy or missing).
 */
export function useCategories(): CategoriesContextValue {
	const ctx = useContext(CategoriesContext)
	if (ctx) return ctx
	return {
		categories: [],
		nameById: {},
		getNames: (ids: string[] | string | undefined) => {
			if (ids == null) return []
			const arr = Array.isArray(ids) ? ids : [ids]
			return arr.map(id => String(id).trim())
		},
		isLoading: false,
	}
}
