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
 * It requests images that have been resized to fit within a bounding box (e.g., 400x400),
 * which preserves the original aspect ratio.
 * @param src - The original image URL from Firebase Storage.
 * @param width - The target width Next.js wants to load.
 * @returns The URL for the resized image (e.g., .../my-image_400x400.webp).
 */
export function firebaseImageLoader({ src, width }: { src: string; width: number }): string {
  // If it's not a Firebase Storage URL, return it as is.
  if (!isFirebaseStorageUrl(src)) {
    return src;
  }

  // Example: https://.../my-image.jpg?alt=media&token=...
  // We need to insert the size before the extension.
  const url = new URL(src);
  const pathname = url.pathname;
  const parts = pathname.split('/');
  const filename = parts.pop()!;
  const extIndex = filename.lastIndexOf('.');
  const baseName = extIndex > -1 ? filename.substring(0, extIndex) : filename;
  
  // The user must configure the Firebase Extension with these sizes,
  // e.g., "400x400,800x800,1200x1200".
  let sizeSuffix: string;
  if (width <= 400) {
    sizeSuffix = '_400x400';
  } else if (width <= 800) {
    sizeSuffix = '_800x800';
  } else {
    sizeSuffix = '_1200x1200';
  }

  // The Firebase Resizer extension appends the size and the new extension.
  // It also handles converting to WEBP if configured.
  const newFilename = `${baseName}${sizeSuffix}.webp`;
  const newPathname = [...parts, newFilename].join('/');
  
  // Reconstruct the URL, keeping the original query parameters (like ?alt=media&token=...)
  return `${url.origin}${newPathname}${url.search}`;
}
