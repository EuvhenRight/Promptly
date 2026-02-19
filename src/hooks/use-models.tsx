'use client'

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase'
import { collection } from 'firebase/firestore'
import React, { createContext, useContext, useEffect, useState } from 'react'

export type ModelItem = { id: string; name: string }

type ModelsContextValue = {
	models: ModelItem[]
	nameById: Record<string, string>
	getNames: (ids: string[] | string | undefined) => string[]
	isLoading: boolean
}

const ModelsContext = createContext<ModelsContextValue | null>(null)

export function ModelsProvider({ children }: { children: React.ReactNode }) {
	const firestore = useFirestore()
	const [nameById, setNameById] = useState<Record<string, string>>({})

	const modelsQuery = useMemoFirebase(
		() => (firestore ? collection(firestore, 'models') : null),
		[firestore],
	)
	const { data: models, isLoading } = useCollection<ModelItem>(modelsQuery)

	useEffect(() => {
		if (models) {
			setNameById(Object.fromEntries(models.map(m => [m.id, m.name])))
		}
	}, [models])

	const getNames = (ids: string[] | string | undefined): string[] => {
		if (ids == null) return []
		const arr = Array.isArray(ids) ? ids : [ids]
		return arr.map(id => nameById[id.trim()] ?? id)
	}

	const value: ModelsContextValue = {
		models: models ?? [],
		nameById,
		getNames,
		isLoading,
	}
	return <ModelsContext.Provider value={value}>{children}</ModelsContext.Provider>
}

/**
 * Resolve model IDs to display names. Uses models from API (id → name).
 * Falls back to raw ID if not in map.
 */
export function useModels(): ModelsContextValue {
	const ctx = useContext(ModelsContext)
	if (ctx) return ctx
	return {
		models: [],
		nameById: {},
		getNames: (ids: string[] | string | undefined) => {
			if (ids == null) return []
			const arr = Array.isArray(ids) ? ids : [ids]
			return arr.map(id => String(id).trim())
		},
		isLoading: false,
	}
}
