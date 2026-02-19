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
 * This function will always point to the expected location of a resized, .webp image.
 */
export function firebaseImageLoader({ src, width }: { src: string; width: number }): string {
  if (!isFirebaseStorageUrl(src)) {
    return src;
  }

  try {
    const url = new URL(src);
    // Decode the path to handle special characters in filenames, e.g., '%2F' for '/'
    const pathName = decodeURIComponent(url.pathname);

    // Extract the object path from the full URL, e.g., "prompts%2Fimage.jpg"
    const objectPathMatch = pathName.match(/\/o\/(.+)/);
    if (!objectPathMatch || !objectPathMatch[1]) return src;

    const fullPath = objectPathMatch[1];
    const lastSlashIndex = fullPath.lastIndexOf('/');
    const directory = fullPath.substring(0, lastSlashIndex);
    const filename = fullPath.substring(lastSlashIndex + 1);

    // Determine the size suffix based on the requested width.
    let sizeSuffix: string;
    if (width <= 400) {
      sizeSuffix = '_400x400';
    } else if (width <= 800) {
      sizeSuffix = '_800x800';
    } else {
      // For any width larger than 800, use the 1200px version.
      sizeSuffix = '_1200x1200';
    }

    // Replace the original file extension with the size suffix and .webp
    const newFilename = filename.replace(/(\.[\w\d_-]+)$/i, `${sizeSuffix}.webp`);

    // Construct the path to the resized image inside the 'thumbnails' subfolder
    const resizedPath = `${directory}/thumbnails/${newFilename}`;

    // Re-encode the path and set it on the URL object
    url.pathname = `/o/${encodeURIComponent(resizedPath)}`;
    
    return url.toString();
  } catch (e) {
    console.error("Error in firebaseImageLoader:", e);
    // On any error during URL construction, return the original source
    return src;
  }
}
