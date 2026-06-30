import {
	collection,
	type CollectionReference,
	type Firestore,
} from 'firebase/firestore'

export type TagDoc = { id: string; name: string }

export type TagItem = TagDoc

export function getTagsCollection(
	firestore: Firestore,
): CollectionReference<TagDoc> {
	return collection(firestore, 'tags') as CollectionReference<TagDoc>
}
