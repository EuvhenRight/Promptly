'use client'

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase'
import { collection } from 'firebase/firestore'
import React, { createContext, useContext, useEffect, useState } from 'react'

export type TypeItem = { id: string; name: string }

type TypesContextValue = {
	types: TypeItem[]
	nameById: Record<string, string>
	getNames: (ids: string[] | string | undefined) => string[]
	isLoading: boolean
}

const TypesContext = createContext<TypesContextValue | null>(null)

export function TypesProvider({ children }: { children: React.ReactNode }) {
	const firestore = useFirestore()
	const [nameById, setNameById] = useState<Record<string, string>>({})

	const typesQuery = useMemoFirebase(
		() => (firestore ? collection(firestore, 'types') : null),
		[firestore],
	)
	const { data: types, isLoading } = useCollection<TypeItem>(typesQuery)

	useEffect(() => {
		if (types) {
			setNameById(Object.fromEntries(types.map(t => [t.id, t.name])))
		}
	}, [types])

	const getNames = (ids: string[] | string | undefined): string[] => {
		if (ids == null) return []
		const arr = Array.isArray(ids) ? ids : [ids]
		return arr.map(id => nameById[id.trim()] ?? id)
	}

	const value: TypesContextValue = {
		types: types ?? [],
		nameById,
		getNames,
		isLoading,
	}
	return <TypesContext.Provider value={value}>{children}</TypesContext.Provider>
}

/**
 * Resolve type IDs to display names. Uses types from API (id → name).
 * Falls back to raw ID if not in map.
 */
export function useTypes(): TypesContextValue {
	const ctx = useContext(TypesContext)
	if (ctx) return ctx
	return {
		types: [],
		nameById: {},
		getNames: (ids: string[] | string | undefined) => {
			if (ids == null) return []
			const arr = Array.isArray(ids) ? ids : [ids]
			return arr.map(id => String(id).trim())
		},
		isLoading: false,
	}
}
