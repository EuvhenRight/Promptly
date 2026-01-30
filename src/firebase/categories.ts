'use client'

import {
	Firestore,
	collection,
	getDocs,
	addDoc,
	updateDoc,
	deleteDoc,
	doc,
} from 'firebase/firestore'

export const CATEGORIES_COLLECTION = 'categories'

export type CategoryDoc = { name: string }

export type CategoryItem = { id: string; name: string }

/**
 * Returns a reference to the Firestore `categories` collection.
 */
export function getCategoriesCollection(firestore: Firestore) {
	return collection(firestore, CATEGORIES_COLLECTION)
}

/**
 * Fetches all categories from Firestore (one-time read).
 */
export async function getCategories(
	firestore: Firestore,
): Promise<CategoryItem[]> {
	const snap = await getDocs(getCategoriesCollection(firestore))
	return snap.docs.map((d) => ({
		id: d.id,
		name: (d.data().name as string) ?? d.id,
	}))
}

/**
 * Creates a new category. Firestore auto-generates the document ID.
 * Requires write permission on the categories collection (e.g. admin).
 */
export async function createCategory(
	firestore: Firestore,
	name: string,
): Promise<CategoryItem> {
	const col = getCategoriesCollection(firestore)
	const ref = await addDoc(col, { name: name.trim() })
	return { id: ref.id, name: name.trim() }
}

/**
 * Updates a category's name by id.
 */
export async function updateCategory(
	firestore: Firestore,
	id: string,
	name: string,
): Promise<void> {
	const ref = doc(firestore, CATEGORIES_COLLECTION, id)
	await updateDoc(ref, { name: name.trim() })
}

/**
 * Deletes a category by id.
 */
export async function deleteCategory(
	firestore: Firestore,
	id: string,
): Promise<void> {
	const ref = doc(firestore, CATEGORIES_COLLECTION, id)
	await deleteDoc(ref)
}
