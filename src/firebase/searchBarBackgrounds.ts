import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage'

/**
 * Uploads a background image for the search bar section to Firebase Storage.
 * @param file The image file to upload.
 * @returns The public URL of the uploaded image.
 */
export async function uploadSearchBarBackground(file: File): Promise<string> {
	if (!file) throw new Error('No file provided for upload.')

	const storage = getStorage()
	const fileName = `${Date.now()}-${file.name}`
	const storageRef = ref(storage, `searchBarBackgrounds/${fileName}`)

	const uploadResult = await uploadBytes(storageRef, file)
	const downloadURL = await getDownloadURL(uploadResult.ref)

	return downloadURL
}
