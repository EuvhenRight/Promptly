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

  // Example src: https://storage.googleapis.com/bucket/o/prompts%2Fmy-image.jpg?alt=media&token=...
  // We need to transform it to: https://storage.googleapis.com/bucket/o/prompts%2Fmy-image_400x400.jpg?alt=media&token=...

  const url = new URL(src);
  const pathname = decodeURIComponent(url.pathname); // Decodes '%2F' to '/' -> /bucket/o/prompts/my-image.jpg

  const lastSlashIndex = pathname.lastIndexOf('/');
  const lastDotIndex = pathname.lastIndexOf('.');

  if (lastDotIndex <= lastSlashIndex) {
      // No extension found or path is unusual, return original src
      return src;
  }

  const pathWithoutFilename = pathname.substring(0, lastSlashIndex);
  const filename = pathname.substring(lastSlashIndex + 1, lastDotIndex);
  const extension = pathname.substring(lastDotIndex); // e.g., '.jpg'

  // Determine the correct size suffix based on requested width
  let sizeSuffix: string;
  if (width <= 400) {
    sizeSuffix = '_400x400';
  } else if (width <= 800) {
    sizeSuffix = '_800x800';
  } else {
    sizeSuffix = '_1200x1200';
  }

  const newFilename = `${filename}${sizeSuffix}${extension}`;
  const newPath = `${pathWithoutFilename}/${newFilename}`;

  // Re-encode the pathname for the URL
  url.pathname = encodeURIComponent(newPath).replace(/%2F/g, '/');

  return url.toString();
}