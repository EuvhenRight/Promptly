import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Use unoptimized for Firebase Storage URLs to avoid Next.js image API timeouts */
export function isFirebaseStorageUrl(url: string | undefined): boolean {
  if (!url) return false
  return (
    url.includes('storage.googleapis.com') ||
    url.includes('firebasestorage.googleapis.com')
  )
}

/**
 * Custom loader for Next/Image that constructs URLs for resized images from Firebase Storage.
 * It follows the pattern logged by the Resize Images extension, where resized images
 * are in a 'thumbnails' subfolder.
 */
export function firebaseImageLoader({
	src,
	width,
}: {
	src: string
	width: number
}): string {
	if (!isFirebaseStorageUrl(src)) {
		return src
	}

	try {
		// 1. Isolate the path part of the URL, e.g., "prompts%2Fmy-image.jpeg"
		const urlObject = new URL(src)
		const pathEncodedWithBucket = urlObject.pathname.split('/o/')[1]
		if (!pathEncodedWithBucket) return src // Not a standard Firebase Storage URL

		// 2. Decode the path to get a clean file path: "prompts/my-image.jpeg"
		const fullPath = decodeURIComponent(pathEncodedWithBucket)

		// 3. Separate directory and filename
		const lastSlash = fullPath.lastIndexOf('/')
		const directory = lastSlash > -1 ? fullPath.substring(0, lastSlash) : ''
		const filename = fullPath.substring(lastSlash + 1)

		// 4. Separate filename and extension
		const lastDot = filename.lastIndexOf('.')
		const nameWithoutExt = lastDot > -1 ? filename.substring(0, lastDot) : filename
		const extension = lastDot > -1 ? filename.substring(lastDot) : '' // e.g., ".jpeg"

		// 5. Determine the size suffix
		let sizeSuffix: string
		if (width <= 400) sizeSuffix = '_400x400'
		else if (width <= 800) sizeSuffix = '_800x800'
		else sizeSuffix = '_1200x1200'

		// 6. Construct the new path for the thumbnail
		const newFilename = `${nameWithoutExt}${sizeSuffix}${extension}`
		const resizedPath = directory
			? `${directory}/thumbnails/${newFilename}`
			: `thumbnails/${newFilename}`

		// 7. Rebuild the URL
		const newUrl = new URL(src)
		newUrl.pathname = `${
			newUrl.pathname.split('/o/')[0]
		}/o/${encodeURIComponent(resizedPath)}`
		newUrl.searchParams.set('alt', 'media')

		return newUrl.toString()
	} catch (error) {
		console.error('firebaseImageLoader error:', error)
		return src // Fallback to original src on any parsing error
	}
}
