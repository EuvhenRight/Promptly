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
 * This relies on the official Firebase "Resize Images" extension being installed.
 * If the URL is not a Firebase Storage URL, it returns the original source.
 */
export function firebaseImageLoader({ src, width }: { src: string; width: number }): string {
  if (!isFirebaseStorageUrl(src)) {
    return src; // Not a Firebase Storage URL, use default loader
  }

  try {
    // Find the position of the '?' to separate the base URL from query parameters
    const queryIndex = src.indexOf('?');
    const baseUrl = queryIndex === -1 ? src : src.substring(0, queryIndex);
    const queryParams = queryIndex === -1 ? '' : src.substring(queryIndex);

    // Find the last dot in the base URL to insert the size suffix
    const lastDotIndex = baseUrl.lastIndexOf('.');
    if (lastDotIndex === -1) {
      return src; // No extension found
    }

    const pathWithoutExtension = baseUrl.substring(0, lastDotIndex);
    const extension = baseUrl.substring(lastDotIndex);

    let sizeSuffix: string;
    if (width <= 400) {
      sizeSuffix = '_400x400';
    } else if (width <= 800) {
      sizeSuffix = '_800x800';
    } else {
      sizeSuffix = '_1200x1200';
    }

    // Based on the user's logs, the extension preserves the original file type.
    // If WebP conversion were enabled, we would change the extension to '.webp'.
    const newUrl = `${pathWithoutExtension}${sizeSuffix}${extension}${queryParams}`;

    return newUrl;
  } catch (e) {
    console.error("Error in firebaseImageLoader:", e);
    return src; // Return original on error
  }
}
