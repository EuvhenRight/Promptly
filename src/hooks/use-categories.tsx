'use client'

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase'
import { collection } from 'firebase/firestore'
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
	const firestore = useFirestore()
	const [nameById, setNameById] = useState<Record<string, string>>({})

	const categoriesQuery = useMemoFirebase(
		() => (firestore ? collection(firestore, 'categories') : null),
		[firestore],
	)
	const { data: categories, isLoading } =
		useCollection<CategoryItem>(categoriesQuery)

	useEffect(() => {
		if (categories) {
			setNameById(Object.fromEntries(categories.map(c => [c.id, c.name])))
		}
	}, [categories])

	const getNames = (ids: string[] | string | undefined): string[] => {
		if (ids == null) return []
		const arr = Array.isArray(ids) ? ids : [ids]
		return arr.map(id => nameById[id.trim()] ?? id)
	}

	const value: CategoriesContextValue = {
		categories: categories ?? [],
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
