
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
  
  const urlParts = url.split('/prompt/');
  if (urlParts.length < 2) {
    return { error: 'Invalid PromptHero URL format. Could not find prompt ID.' };
  }

  // Use the full slug for the API call, and the first part as the unique ID
  const promptSlug = urlParts[1].split('?')[0]; // Clean any query params
  const sourceId = promptSlug.split('-')[0];
  if (!sourceId) {
    return { error: 'Could not extract a unique ID from the URL.' };
  }

  try {
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
    
    // --- New API-based Scraping Logic ---

    // STEP 1: Fetch initial HTML to get the Build ID from the __NEXT_DATA__ script
    const pageResponse = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!pageResponse.ok) {
      return { error: `Failed to fetch URL. Status: ${pageResponse.status}` };
    }
    const html = await pageResponse.text();
    const $ = cheerio.load(html);

    const nextDataScript = $('#__NEXT_DATA__').html();
    if (!nextDataScript) {
        return { error: 'Could not find __NEXT_DATA__ script to get build ID. The site structure may have changed.' };
    }
    const nextData = JSON.parse(nextDataScript);
    const buildId = nextData.buildId;
    if (!buildId) {
        return { error: 'Could not extract buildId from __NEXT_DATA__.' };
    }

    // STEP 2: Construct the JSON API URL and fetch the prompt data directly
    const apiUrl = `https://prompthero.com/_next/data/${buildId}/en/prompt/${sourceId}.json`;
    const apiResponse = await fetch(apiUrl);
     if (!apiResponse.ok) {
      return { error: `Failed to fetch data from API. Status: ${apiResponse.status}` };
    }
    const promptData = await apiResponse.json();

    // STEP 3: Extract data from the JSON response
    const promptDetails = promptData?.pageProps?.prompt;
    if (!promptDetails) {
        return { error: 'Could not find prompt data in the API response. The API structure may have changed.' };
    }
    
    const title = promptDetails.title || promptDetails.slug.replace(/-/g, ' ');
    const privateContent = promptDetails.prompt;
    const originalImageUrl = promptDetails.images?.[0]?.url;

    if (!title || !privateContent || !originalImageUrl) {
        let missing = [];
        if (!title) missing.push('title');
        if (!privateContent) missing.push('prompt content');
        if (!originalImageUrl) missing.push('image URL');
        return { error: `API response was incomplete. Missing: ${missing.join(', ')}.` };
    }

    // --- STEP 4: Process image and return result (same logic as before) ---
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
