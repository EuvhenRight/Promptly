'use server';

import * as cheerio from 'cheerio';
import { z } from 'zod';
import { adminStorage, adminDb } from '@/firebase/admin';
import type { ScrapeResult } from '@/lib/types';

const ScrapeResultSchema = z.object({
  title: z.string(),
  privateContent: z.string(),
  categories: z.string(),
  imageUrl: z.string(),
});

async function uploadImageToAdminStorage(buffer: Buffer, fileName: string): Promise<string> {
    if (!adminStorage) {
        throw new Error('Firebase Admin Storage is not initialized. Check server logs for details. Ensure service-account.json is present.');
    }
    const bucket = adminStorage.bucket();
    const filePath = `prompts/${Date.now()}-${fileName}`;
    const file = bucket.file(filePath);

    await file.save(buffer, {
        metadata: {
            contentType: 'image/jpeg', // Assuming jpeg, could be more dynamic
        },
    });

    // Make the file publicly readable
    await file.makePublic();

    // Return the public URL
    return file.publicUrl();
}


export async function scrapePromptHero(
  url: string
): Promise<ScrapeResult | { error: string; duplicate?: boolean }> {

  if (!url || !url.includes('prompthero.com')) {
    return { error: 'Invalid URL. Please provide a valid PromptHero URL.' };
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      return { error: `Failed to fetch URL. Status: ${response.status}` };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    let title: string | undefined;
    let privateContent: string | undefined;
    let categories: string | undefined;
    let originalImageUrl: string | undefined;

    // --- Title Parsing ---
    title = $('h1').first().text().trim();
    
    // --- Private Content Parsing ---
    // Method 1: Robust selector (Primary)
    privateContent = $('div.text-white.break-words').first().text().trim();
    
    // Method 2: User's provided logic (Fallback)
    if (!privateContent) {
        const elements = $('.font-semibold');
        const promptParts: string[] = [];
        
        elements.each((i, el) => {
            const element = $(el);
            if (element.is('div') && element.find('a').length > 0 && !element.closest('h2, h3, h4').length) {
                element.find('a').each((j, a) => {
                    const text = $(a).text().trim();
                    if (text) promptParts.push(text);
                });
                if (promptParts.length > 0) {
                    privateContent = promptParts.join(' ');
                    return false; // Break the loop
                }
            }
        });
    }
    
    // --- Category Parsing ---
    categories = $('a[href^="/model/"]').first().text().trim() || 'Unknown';
    
    // --- Image Parsing ---
    let imageUrl: string | undefined;
    
    // 1. Prioritize a specific structure
    const mainImage = $('div[data-testid="prompt-image-0"]').find('img').first();
    if (mainImage.length) {
        const srcset = mainImage.attr('srcset');
        if (srcset) {
            const sources = srcset.split(',').map(s => s.trim().split(' ')[0]);
            imageUrl = sources[sources.length - 1]; // Get highest resolution
        } else {
            imageUrl = mainImage.attr('src');
        }
    }
    
    // 2. Fallback to broad search in main/article
    if (!imageUrl) {
         $('main img, article img').each((i, el) => {
            const img = $(el);
            const width = parseInt(img.attr('width') || '0', 10);
            const height = parseInt(img.attr('height') || '0', 10);
            
            // Heuristic to ignore small icons/avatars
            if (width > 200 || height > 200) {
               const srcset = img.attr('srcset');
               if (srcset) {
                   const sources = srcset.split(',').map(s => s.trim().split(' ')[0]);
                   imageUrl = sources[sources.length - 1];
                   return false; // Found one, break loop
               }
            }
        });
    }
    
    // 3. Final fallback to og:image meta tag
    if (!imageUrl) {
        imageUrl = $('meta[property="og:image"]').attr('content');
    }
    
    // Process the found URL
    if (imageUrl) {
        if (imageUrl.includes('_next/image?url=')) {
            try {
                const urlObj = new URL(imageUrl, url);
                const encodedUrl = urlObj.searchParams.get('url');
                if (encodedUrl) {
                    originalImageUrl = decodeURIComponent(encodedUrl);
                } else {
                     originalImageUrl = imageUrl;
                }
            } catch (e) {
               originalImageUrl = imageUrl;
            }
        } else {
            originalImageUrl = imageUrl;
        }
    }
    
    if (originalImageUrl && originalImageUrl.startsWith('/')) {
        try {
            originalImageUrl = new URL(originalImageUrl, new URL(url).origin).href;
        } catch (e) { /* ignore */ }
    }
    
    // --- Final Validation, Duplicate Check & Debugging ---
    if (!title) {
        return { error: 'Scraping failed. Could not extract title.' };
    }

    // --- Duplicate Check ---
    if (adminDb) {
      const promptsRef = adminDb.collection('prompts');
      const snapshot = await promptsRef.where('title', '==', title).limit(1).get();
      if (!snapshot.empty) {
        return { 
          error: 'A prompt with this title already exists in the database.',
          duplicate: true 
        };
      }
    } else {
      console.warn("Admin DB not initialized, skipping duplicate check.");
    }
    
    if (!privateContent || !originalImageUrl) {
        let missing = [];
        if (!privateContent) missing.push('prompt content');
        if (!originalImageUrl) missing.push('image URL');

        // Add a snippet of the HTML to the error message for debugging
        const bodyHtml = $('body').html() || 'Could not get body HTML.';
        const debugHtml = bodyHtml.substring(0, 2000).replace(/</g, '&lt;').replace(/>/g, '&gt;');

        return { 
            error: `Scraping failed. Could not extract: ${missing.join(', ')}. The website structure may have changed. \n\n--- DEBUG: Start of HTML received by server ---\n\n${debugHtml}\n\n--- END OF DEBUG ---` 
        };
    }

    // --- Image Processing ---
    const imageResponse = await fetch(originalImageUrl);
    if (!imageResponse.ok) {
      return { error: 'Failed to download the prompt image.' };
    }
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const originalFilename = originalImageUrl.split('/').pop()?.split('?')[0] || 'image.jpg';

    const finalImageUrl = await uploadImageToAdminStorage(imageBuffer, originalFilename);

    const result: ScrapeResult = {
      title,
      privateContent,
      categories: categories || 'Unknown',
      imageUrl: finalImageUrl,
    };
    
    // Validate with Zod before returning
    ScrapeResultSchema.parse(result);

    return result;
  } catch (error: any) {
    console.error('Scraping failed:', error);
    return {
      error: error.message || 'An unexpected error occurred during scraping.',
    };
  }
}
