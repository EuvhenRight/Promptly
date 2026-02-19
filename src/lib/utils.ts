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
export function firebaseImageLoader({ src, width }: { src: string; width: number }): string {
  if (!isFirebaseStorageUrl(src)) {
    return src;
  }

  try {
    const url = new URL(src);
    const pathParts = url.pathname.split('/o/');
    if (pathParts.length < 2 || !pathParts[1]) {
      return src; // Not a standard Firebase Storage URL format
    }

    const fullPath = decodeURIComponent(pathParts[1]); // 'prompts/image.png'

    const lastSlashIndex = fullPath.lastIndexOf('/');
    const directory = lastSlashIndex > -1 ? fullPath.substring(0, lastSlashIndex) : ''; // 'prompts'
    const filename = lastSlashIndex > -1 ? fullPath.substring(lastSlashIndex + 1) : fullPath; // 'image.png'

    // Determine the size suffix based on the requested width.
    let sizeSuffix: string;
    if (width <= 400) {
      sizeSuffix = '_400x400';
    } else if (width <= 800) {
      sizeSuffix = '_800x800';
    } else {
      sizeSuffix = '_1200x1200';
    }

    const extensionIndex = filename.lastIndexOf('.');
    const nameWithoutExt = extensionIndex > -1 ? filename.substring(0, extensionIndex) : filename;
    const extension = extensionIndex > -1 ? filename.substring(extensionIndex) : '';

    // Construct the new filename, preserving the original extension
    const newFilename = `${nameWithoutExt}${sizeSuffix}${extension}`;

    // Construct the new path including the 'thumbnails' subfolder
    const resizedPath = directory ? `${directory}/thumbnails/${newFilename}` : `thumbnails/${newFilename}`;

    // Re-construct the pathname.
    url.pathname = `${pathParts[0]}/o/${encodeURIComponent(resizedPath)}`;
    
    // IMPORTANT: Ensure 'alt=media' is present.
    url.searchParams.set('alt', 'media');

    return url.toString();
  } catch (e) {
    console.error("Error in firebaseImageLoader, falling back to original src:", e);
    return src; // Fallback to original src if any part of the logic fails
  }
}
