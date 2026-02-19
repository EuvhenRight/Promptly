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
 *
 * @param src - The original image URL.
 * @param width - The target width Next.js wants to load.
 * @returns The URL for the resized image or the original URL.
 */
export function firebaseImageLoader({ src, width }: { src: string; width: number }): string {
  if (!isFirebaseStorageUrl(src)) {
    return src; // Not a Firebase Storage URL, use default loader
  }

  const urlParts = src.split('?');
  const baseUrl = urlParts[0];
  const queryParams = urlParts.length > 1 ? `?${urlParts[1]}` : '';

  const objectPathSegment = '/o/';
  const objectPathStartIndex = baseUrl.indexOf(objectPathSegment);

  if (objectPathStartIndex === -1) {
    return src; // Unexpected URL format
  }

  const prefix = baseUrl.substring(0, objectPathStartIndex + objectPathSegment.length);
  const encodedFullPath = baseUrl.substring(objectPathStartIndex + objectPathSegment.length);
  const fullPath = decodeURIComponent(encodedFullPath);

  const lastSlashIndex = fullPath.lastIndexOf('/');
  const directory = lastSlashIndex > -1 ? fullPath.substring(0, lastSlashIndex) : '';
  const filename = lastSlashIndex > -1 ? fullPath.substring(lastSlashIndex + 1) : fullPath;

  const filenameExtIndex = filename.lastIndexOf('.');
  const baseFilename = filenameExtIndex > -1 ? filename.substring(0, filenameExtIndex) : filename;

  let sizeSuffix: string;
  if (width <= 400) {
    sizeSuffix = '_400x400';
  } else if (width <= 800) {
    sizeSuffix = '_800x800';
  } else {
    sizeSuffix = '_1200x1200';
  }

  const newFullPath = `${directory}/thumbnails/${baseFilename}${sizeSuffix}.webp`;
  const encodedNewFullPath = encodeURIComponent(newFullPath);

  return `${prefix}${encodedNewFullPath}${queryParams}`;
}
