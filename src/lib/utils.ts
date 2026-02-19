import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function isFirebaseStorageUrl(url: string | undefined): boolean {
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
        // Universal parser for both firebasestorage.googleapis.com and storage.googleapis.com URLs
        let pathComponent = ''
        if (src.includes('/o/')) {
            // New format: firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media...
            pathComponent = src.split('/o/')[1]?.split('?')[0] ?? ''
        } else if (src.includes('storage.googleapis.com')) {
            // Old format: storage.googleapis.com/{bucket}/{path}
            const url = new URL(src)
            // Path is /{bucket}/{path}, so we find the first slash and take the rest.
            const pathAfterBucket = url.pathname.substring(url.pathname.indexOf('/', 1) + 1)
            pathComponent = pathAfterBucket
        }

        if (!pathComponent) return src // Fallback if parsing fails

		const decodedPath = decodeURIComponent(pathComponent)

		const lastSlash = decodedPath.lastIndexOf('/')
		const directory = lastSlash > -1 ? decodedPath.substring(0, lastSlash) : ''
		const filename = decodedPath.substring(lastSlash + 1)

		const lastDot = filename.lastIndexOf('.')
		const nameWithoutExt = lastDot > -1 ? filename.substring(0, lastDot) : filename
		const extension = lastDot > -1 ? filename.substring(lastDot) : ''

		let sizeSuffix: string
		if (width <= 400) sizeSuffix = '_400x400'
		else if (width <= 800) sizeSuffix = '_800x800'
		else sizeSuffix = '_1200x1200'

		const newFilename = `${nameWithoutExt}${sizeSuffix}${extension}`
		const resizedPath = directory
			? `${directory}/thumbnails/${newFilename}`
			: `thumbnails/${newFilename}`

		// Reconstruct the URL in the modern format with alt=media
		const originalUrl = new URL(src)
        const bucket = originalUrl.hostname.split('.')[0];
        
        // Ensure we are not using the bucket name from the path for reconstruction.
        const newUrlString = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(resizedPath)}?alt=media`
		
		return newUrlString
	} catch (error) {
		console.error('firebaseImageLoader error:', error)
		return src // Fallback to original src on any parsing error
	}
}

// Re-export isFirebaseStorageUrl for use in prompt-card
export { isFirebaseStorageUrl };