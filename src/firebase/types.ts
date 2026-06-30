import {
	collection,
	type CollectionReference,
	type Firestore,
} from 'firebase/firestore'

export type TypeDoc = { id: string; name: string }

export type TypeItem = TypeDoc

export function getTypesCollection(
	firestore: Firestore,
): CollectionReference<TypeDoc> {
	return collection(firestore, 'types') as CollectionReference<TypeDoc>
}
