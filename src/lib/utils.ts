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
 * @param src - The original image URL from Firebase Storage.
 * @param width - The target width Next.js wants to load.
 * @returns The URL for the resized image (e.g., _800x800.webp).
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
  const filename = parts.pop()!; // e.g., my-image.jpg
  const extIndex = filename.lastIndexOf('.');
  const baseName = extIndex > -1 ? filename.substring(0, extIndex) : filename;
  const extension = extIndex > -1 ? filename.substring(extIndex) : '.jpg';
  
  // Choose the size suffix based on the requested width.
  // The sizes (e.g., _400x400) must match what's configured in the Firebase Extension.
  let sizeSuffix: string;
  if (width <= 400) {
    sizeSuffix = '_400x400';
  } else if (width <= 800) {
    sizeSuffix = '_800x800';
  } else {
    sizeSuffix = '_1200x1200';
  }

  const newFilename = `${baseName}${sizeSuffix}.webp`; // Always request .webp
  const newPathname = [...parts, newFilename].join('/');
  
  // Reconstruct the URL, keeping the original query parameters (like ?alt=media&token=...)
  return `${url.origin}${newPathname}${url.search}`;
}
