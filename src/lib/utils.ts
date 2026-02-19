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
 *
 * This version correctly handles resized images being placed in a 'thumbnails' subdirectory.
 *
 * @param src - The original image URL from Firebase Storage.
 * @param width - The target width Next.js wants to load.
 * @returns The URL for the resized image (e.g., .../prompts/thumbnails/my-image_400x400.webp?alt=media...).
 */
export function firebaseImageLoader({ src, width }: { src: string; width: number }): string {
  if (!isFirebaseStorageUrl(src)) {
    return src;
  }

  // The path part of a Firebase URL is encoded, e.g., "images%2Fhello.jpg"
  // We need to find this part and modify it to point to the resized version.
  const urlParts = src.split('?');
  const baseUrl = urlParts[0];
  const queryParams = urlParts.length > 1 ? `?${urlParts[1]}` : '';

  const objectPathSegment = '/o/';
  const objectPathStartIndex = baseUrl.indexOf(objectPathSegment);

  if (objectPathStartIndex === -1) {
    // If the URL format is unexpected, return the original source.
    return src;
  }

  // Extract the encoded path of the original image (e.g., "prompts%2Fmy-image.jpg")
  const prefix = baseUrl.substring(0, objectPathStartIndex + objectPathSegment.length);
  const encodedFullPath = baseUrl.substring(objectPathStartIndex + objectPathSegment.length);
  const fullPath = decodeURIComponent(encodedFullPath); // Decodes to "prompts/my-image.jpg"

  // Deconstruct the path into directory and filename
  const lastSlashIndex = fullPath.lastIndexOf('/');
  const directory = lastSlashIndex > -1 ? fullPath.substring(0, lastSlashIndex) : ''; // "prompts"
  const filename = lastSlashIndex > -1 ? fullPath.substring(lastSlashIndex + 1) : fullPath; // "my-image.jpg"

  const filenameExtIndex = filename.lastIndexOf('.');
  const baseFilename = filenameExtIndex > -1 ? filename.substring(0, filenameExtIndex) : filename; // "my-image"

  // Determine the size suffix based on the requested width
  let sizeSuffix: string;
  if (width <= 400) {
    sizeSuffix = '_400x400';
  } else if (width <= 800) {
    sizeSuffix = '_800x800';
  } else {
    sizeSuffix = '_1200x1200';
  }

  // Construct the new path pointing to the resized image inside the "thumbnails" subfolder
  // Example: "prompts/thumbnails/my-image_400x400.webp"
  const newFullPath = `${directory}/thumbnails/${baseFilename}${sizeSuffix}.webp`;
  const encodedNewFullPath = encodeURIComponent(newFullPath);

  // Reconstruct the final URL
  return `${prefix}${encodedNewFullPath}${queryParams}`;
}
