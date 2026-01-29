
'use server';

import * as cheerio from 'cheerio';
import { z } from 'zod';
import { adminStorage, adminDb } from '@/firebase/admin';
import type { ScrapeResult } from '@/lib/types';
import { collection, query, where, getDocs } from 'firebase/firestore';

const ScrapeResultSchema = z.object({
  title: z.string(),
  privateContent: z.string(),
  categories: z.string(),
  imageUrl: z.string(),
  tags: z.string(),
  sourceId: z.string(),
});

async function uploadImageToAdminStorage(buffer: Buffer, fileName: string): Promise<string> {
    if (!adminStorage) {
        throw new Error('Firebase Admin Storage is not initialized. Check server logs for details. Ensure service-account.json is present.');
    }
    const bucket = adminStorage.bucket();
    const filePath = `prompts/${fileName}`;
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
  
  // Extract sourceId from URL for duplicate checking and file naming
  const urlParts = url.split('/prompt/');
  if (urlParts.length < 2) {
    return { error: 'Invalid PromptHero URL format. Could not find prompt ID.' };
  }
  const promptSlug = urlParts[1];
  const sourceId = promptSlug.split('-')[0];
  if (!sourceId) {
    return { error: 'Could not extract a unique ID from the URL.' };
  }


  try {
    // --- New Duplicate Check using sourceId ---
    if (adminDb) {
      const scrapedRef = adminDb.collection('scraped_prompts').doc(sourceId);
      const docSnap = await scrapedRef.get();
      if (docSnap.exists) {
        return { 
          error: 'This prompt has already been scraped.',
          duplicate: true 
        };
      }
    } else {
      console.warn("Admin DB not initialized, skipping duplicate check.");
    }
    
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
    let originalImageUrl: string | undefined;

    // --- Title Parsing ---
    title = $('h1').first().text().trim();
    
    // --- Private Content Parsing ---
    privateContent = $('div.text-white.break-words').first().text().trim();
    
    // --- Image Parsing ---
    let imageUrl: string | undefined;
    
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
    
    if (!imageUrl) {
        imageUrl = $('meta[property="og:image"]').attr('content');
    }
    
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
    
    if (!title || !privateContent || !originalImageUrl) {
        let missing = [];
        if (!title) missing.push('title');
        if (!privateContent) missing.push('prompt content');
        if (!originalImageUrl) missing.push('image URL');
        
        if (missing.includes('prompt content')) {
            const bodyHtml = $('body').html() || '';
            const snippet = bodyHtml.replace(/\s\s+/g, ' ').substring(0, 500);
            return { error: `Scraping failed. Could not extract: prompt content. HTML snippet received: ${snippet}...` };
        }

        return { error: `Scraping failed. Could not extract: ${missing.join(', ')}.` };
    }

    // --- Image Processing ---
    const imageResponse = await fetch(originalImageUrl);
    if (!imageResponse.ok) {
      return { error: 'Failed to download the prompt image.' };
    }
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const fileExtension = originalImageUrl.split('.').pop()?.split('?')[0] || 'jpg';
    const newFileName = `${sourceId}.${fileExtension}`;


    const finalImageUrl = await uploadImageToAdminStorage(imageBuffer, newFileName);

    const result: ScrapeResult = {
      title,
      privateContent,
      categories: 'images',
      tags: title.split(' ')[0] || '',
      imageUrl: finalImageUrl,
      sourceId: sourceId,
    };
    
    ScrapeResultSchema.parse(result);

    return result;
  } catch (error: any) {
    console.error('Scraping failed:', error);
    return {
      error: error.message || 'An unexpected error occurred during scraping.',
    };
  }
}

