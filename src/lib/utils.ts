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
 * Custom loader for Next/Image that constructs URLs for resized images from Firebase Storage,
 * assuming the "Resize Images" extension is configured to save resized images in a 'thumbnails' subdirectory.
 * This version points to a specific resized version (e.g., _400x400.webp).
 */
export function firebaseImageLoader({ src, width }: { src: string; width: number }): string {
  if (!isFirebaseStorageUrl(src)) {
    return src;
  }

  try {
    const url = new URL(src);
    const pathName = decodeURIComponent(url.pathname); // Decode to get a clean path like '/v0/b/...'

    const objectPathMatch = pathName.match(/\/o\/(.+)/);
    if (!objectPathMatch || !objectPathMatch[1]) return src;

    const fullPath = objectPathMatch[1];
    const lastSlashIndex = fullPath.lastIndexOf('/');
    const directory = fullPath.substring(0, lastSlashIndex);
    const filename = fullPath.substring(lastSlashIndex + 1);

    // Determine the size suffix based on requested width
    let sizeSuffix: string;
    if (width <= 400) {
      sizeSuffix = '_400x400';
    } else if (width <= 800) {
      sizeSuffix = '_800x800';
    } else {
      sizeSuffix = '_1200x1200';
    }

    // It's better to request WebP if the extension is configured to convert.
    // Assuming WebP conversion is on.
    const newFilename = filename.replace(/(\.[\w\d_-]+)$/i, `${sizeSuffix}.webp`);

    // Prepend 'thumbnails/' to the filename
    const resizedPath = `${directory}/thumbnails/${newFilename}`;

    // Reconstruct the URL for the resized image
    url.pathname = `/o/${encodeURIComponent(resizedPath)}`;
    
    return url.toString();
  } catch (e) {
    console.error("Error in firebaseImageLoader:", e);
    return src; // Return original on error
  }
}
