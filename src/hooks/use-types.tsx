'use client'

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
	const [nameById, setNameById] = useState<Record<string, string>>({})
	const [types, setTypes] = useState<TypeItem[]>([])
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		setIsLoading(true)
		fetch('/api/types')
			.then(res => (res.ok ? res.json() : []))
			.then((data: TypeItem[]) => {
				const list = Array.isArray(data) ? data : []
				setTypes(list)
				setNameById(Object.fromEntries(list.map(t => [t.id, t.name])))
			})
			.catch(() => {
				setTypes([])
				setNameById({})
			})
			.finally(() => setIsLoading(false))
	}, [])

	const getNames = (ids: string[] | string | undefined): string[] => {
		if (ids == null) return []
		const arr = Array.isArray(ids) ? ids : [ids]
		return arr.map(id => nameById[id.trim()] ?? id)
	}

	const value: TypesContextValue = { types, nameById, getNames, isLoading }
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
