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
 * are in the same directory but with a size suffix (e.g., _400x400).
 */
export function firebaseImageLoader({ src, width }: { src: string; width: number }): string {
	if (!isFirebaseStorageUrl(src)) {
		return src
	}

	try {
		const url = new URL(src)
		const decodedPath = decodeURIComponent(url.pathname)
		const pathParts = decodedPath.split('/o/')

		if (pathParts.length < 2 || !pathParts[1]) {
			return src // Not a standard Firebase Storage URL format
		}
		const fullPath = pathParts[1]

		const lastSlashIndex = fullPath.lastIndexOf('/')
		const directory = lastSlashIndex > -1 ? fullPath.substring(0, lastSlashIndex) : ''
		const filename = lastSlashIndex > -1 ? fullPath.substring(lastSlashIndex + 1) : fullPath

		// Determine the size suffix based on the requested width.
		let sizeSuffix: string
		if (width <= 400) {
			sizeSuffix = '_400x400'
		} else if (width <= 800) {
			sizeSuffix = '_800x800'
		} else {
			sizeSuffix = '_1200x1200'
		}

		// Append suffix before the file extension, preserving the original extension.
		const extensionIndex = filename.lastIndexOf('.')
		const nameWithoutExt =
			extensionIndex > -1 ? filename.substring(0, extensionIndex) : filename
		const extension =
			extensionIndex > -1 ? filename.substring(extensionIndex) : ''

		const newFilename = `${nameWithoutExt}${sizeSuffix}${extension}`
		const resizedPath = directory ? `${directory}/${newFilename}` : newFilename

		// Re-construct the pathname. The first part contains the bucket info.
		url.pathname = `${pathParts[0]}/o/${encodeURIComponent(resizedPath)}`
		
		// Ensure the 'alt=media' parameter is present to serve the image content
		url.searchParams.set('alt', 'media')

		return url.toString()
	} catch (e) {
		console.error("Error in firebaseImageLoader:", e)
		return src
	}
}
