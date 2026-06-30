
'use server';

import * as cheerio from 'cheerio';
import { adminStorage, adminDb } from '@/firebase/admin';
import type { ScrapeResult, UserProfile } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';

async function uploadImageToAdminStorage(buffer: Buffer, fileName: string): Promise<string> {
  if (!adminStorage) {
    throw new Error(
      'Firebase Admin Storage is not initialized. Check server logs for details. Ensure service-account.json is present.'
    );
  }
  const bucket = adminStorage.bucket();
  const filePath = `prompts/${fileName}`;
  const file = bucket.file(filePath);

  await file.save(buffer, {
    metadata: {
      contentType: 'image/jpeg', // Assuming jpeg, can be made more dynamic
    },
  });

  // Make the file publicly readable
  await file.makePublic();

  // Return the public URL
  return file.publicUrl();
}

export async function rehostImage(
  imageUrl: string,
  sourceId: string
): Promise<string> {
  if (!adminStorage) {
    throw new Error('Firebase Admin Storage is not initialized.');
  }
  if (!imageUrl || !imageUrl.startsWith('http')) {
    throw new Error('Invalid image URL provided for re-hosting.');
  }
  try {
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image from ${imageUrl}`);
    }
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const fileExtension = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
    const newFileName = `${sourceId}.${fileExtension}`;

    return await uploadImageToAdminStorage(imageBuffer, newFileName);
  } catch (error: any) {
    console.error('Image re-hosting failed:', error);
    throw new Error('Could not re-host the scraped image.');
  }
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

  const promptSlug = urlParts[1].split('?')[0];
  const sourceId = promptSlug.split('-')[0];
  if (!sourceId) {
    return { error: 'Could not extract a unique ID from the URL.' };
  }

  try {
    // 1. Check for duplicates FIRST to avoid unnecessary scraping
    if (adminDb) {
      const scrapedRef = adminDb.collection('scraped_prompts').doc(sourceId);
      const docSnap = await scrapedRef.get();
      if (docSnap.exists) {
        return {
          error: 'This prompt has already been scraped.',
          duplicate: true,
        };
      }
    } else {
      console.warn('Admin DB not initialized, skipping duplicate check.');
    }

    // 2. Fetch the HTML content of the page
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

    // --- 3. Extract data using user-provided logic ---

    // A. Extract Prompt Text
    let privateContent = '';
    $('div.font-semibold').each((i, el) => {
        const element = $(el);
        const isDivWithLinks = element.is('div') && element.find('a').length > 0;
        const isNotInHeading = element.closest('h2, h3, h4').length === 0;

        if (isDivWithLinks && isNotInHeading && !privateContent) {
            const promptParts: string[] = [];
            element.find('a').each((i, a) => {
                const text = $(a).text().trim();
                if (text) promptParts.push(text);
            });
            if (promptParts.length > 0) {
                privateContent = promptParts.join(' ');
            }
        }
    });

    // B. Extract Image URL
    let imageUrl = '';
    $('main img, article img').each((i, img) => {
        if (imageUrl) return; // Stop if we've already found a good image
        const imageElement = $(img);
        
        // Try srcset first
        const srcset = imageElement.attr('srcset');
        if (srcset) {
            const sources = srcset.split(',');
            const lastSource = sources[sources.length - 1].trim().split(' ')[0];
            if (lastSource && !lastSource.includes('data:image')) {
                imageUrl = lastSource;
                return; // Found it, exit .each loop for images
            }
        }

        // Fallback to src
        const src = imageElement.attr('src');
        if (!imageUrl && src && !src.includes('data:image')) {
             imageUrl = src;
        }
    });
    
    // Decode _next/image URLs
    if (imageUrl.includes('_next/image?url=')) {
        const urlParams = new URLSearchParams(imageUrl.split('?')[1]);
        const decodedUrl = urlParams.get('url');
        if (decodedUrl) imageUrl = decodeURIComponent(decodedUrl);
    }
    
    // C. Extract Title
    const title = $('h1').first().text().trim() || $('meta[property="og:title"]').attr('content')?.trim() || 'Untitled';


    // 4. Validate extracted content
    if (!privateContent || !imageUrl) {
        let missing = [];
        if (!privateContent) missing.push('prompt content');
        if (!imageUrl) missing.push('image');
        return {
            error: `Scraping failed. Could not extract: ${missing.join(', ')}.`,
            // Optional: return a snippet for debugging if needed
            // htmlSnippet: html.substring(0, 1000) 
        };
    }
    
    // --- 5. Return the original image URL ---
    // The image will be downloaded and re-hosted when the admin saves the prompt.
    // This makes the initial scraping step much faster.
    const result: ScrapeResult = {
      title,
      privateContent,
      categories: 'images',
      tags: title.split(' ')[0] || '',
      imageUrl: imageUrl, // Pass the original URL
      sourceId: sourceId,
    };

    return result;

  } catch (error: any) {
    console.error('Scraping failed:', error);
    return {
      error: error.message || 'An unexpected error occurred during scraping.',
    };
  }
}

// --- NEW CODE STARTS HERE ---

// Copied from src/firebase/prompts.ts
function getSearchTerms(title: string): string[] {
    const titleLower = title.toLowerCase();
    const terms = new Set(titleLower.split(/\s+/).filter(Boolean));
    return Array.from(terms);
}

type CreatePromptData = {
    title: string;
    description: string;
    price: number;
    isPrivate: boolean;
    imageUrl?: string;
    privateContent: string;
    categoryId: string;
    typeId: string;
    modelId: string;
    tags: string; // This is a comma-separated string of IDs
    sourceId?: string | null;
};

async function adminCreatePrompt(
    adminId: string,
    data: CreatePromptData,
): Promise<{ success: boolean; error?: string; promptId?: string }> {
    if (!adminDb) {
        return { success: false, error: 'Admin DB not initialized' };
    }
    const newPromptRef = adminDb.collection('prompts').doc();
    const privateContentRef = newPromptRef.collection('private').doc('content');

    const batch = adminDb.batch();

    try {
        const authorRef = adminDb.collection('users').doc(adminId);
        const authorSnap = await authorRef.get();
        if (!authorSnap.exists) {
            throw new Error('Could not create prompt: author profile not found.');
        }
        const authorData = authorSnap.data() as UserProfile;

        const publicData = {
            authorId: adminId,
            authorDisplayName: authorData.displayName,
            authorPhotoURL: authorData.photoURL,
            authorUsername: authorData.username,
            authorPlanId: authorData.planId ?? 'free',
            title: data.title,
            titleLowercase: data.title.toLowerCase(),
            searchTerms: getSearchTerms(data.title),
            description: data.description || '',
            price: data.price,
            isPrivate: data.isPrivate ?? false,
            images: data.imageUrl ? [data.imageUrl] : [],
            rating: { average: 0, count: 0 },
            tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
            categoryId: data.categoryId || '',
            categories: data.categoryId ? [data.categoryId] : [],
            typeId: data.typeId || '',
            modelId: data.modelId || '',
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            stats: { views: 0, sales: 0, likes: 0 },
        };

        const privateData = {
            text: data.privateContent,
        };

        batch.set(newPromptRef, publicData);
        batch.set(privateContentRef, privateData);

        if (data.sourceId) {
            const scrapedPromptRef = adminDb.collection('scraped_prompts').doc(data.sourceId);
            batch.set(scrapedPromptRef, {
                promptId: newPromptRef.id,
                createdAt: FieldValue.serverTimestamp(),
            });
        }

        await batch.commit();

        return { success: true, promptId: newPromptRef.id };
    } catch (error: any) {
        console.error('Error creating prompt:', error);
        return {
            success: false,
            error: error.message || 'Failed to create prompt.',
        };
    }
}


async function getCollectionItems(collectionName: string): Promise<{ id: string; name: string }[]> {
    if (!adminDb) return [];
    const snap = await adminDb.collection(collectionName).get();
    if (snap.empty) return [];
    return snap.docs.map(doc => ({ id: doc.id, name: doc.data().name as string }));
}

export async function scrapeAndAutoCreate(urls: string[], adminId: string): Promise<{ successCount: number; errorCount: number; errors: { url: string; reason: string }[] }> {
    if (!adminDb) {
        throw new Error('Firebase Admin not initialized.');
    }

    const [categories, tags, models, types] = await Promise.all([
        getCollectionItems('categories'),
        getCollectionItems('tags'),
        getCollectionItems('models'),
        getCollectionItems('types'),
    ]);

    const imagesTypeId = types.find(t => t.name === 'Images')?.id;

    let successCount = 0;
    let errorCount = 0;
    const errors: { url: string; reason: string }[] = [];

    for (const url of urls) {
        try {
            const scrapeResult = await scrapePromptHero(url);

            if ('error' in scrapeResult) {
                if (scrapeResult.duplicate) {
                     // Skip duplicates silently for a better UX
                    continue;
                }
                throw new Error(scrapeResult.error);
            }

            const imageUrl = await rehostImage(scrapeResult.imageUrl, scrapeResult.sourceId);

            const title = scrapeResult.title.split(' ').slice(0, 6).join(' ');
            
            const priceCredits = (() => {
                const rand = Math.random();
                if (rand < 0.1) return 0; // 10% chance of being free
                return (Math.floor(Math.random() * 10) + 1) * 100; // 100 to 1000 credits, multiple of 100
            })();
            const priceDollars = priceCredits / 100;

            const isPrivate = Math.random() < 0.1;
            const categoryId = categories.length > 0 ? categories[Math.floor(Math.random() * categories.length)].id : '';
            const modelId = models.length > 0 ? models[Math.floor(Math.random() * models.length)].id : '';
            
            const numTags = tags.length > 1 ? Math.floor(Math.random() * 3) + 1 : tags.length;
            const randomTags = [...tags].sort(() => 0.5 - Math.random()).slice(0, numTags).map(t => t.id).join(', ');


            const promptData: CreatePromptData = {
                title,
                description: '',
                price: priceDollars,
                isPrivate,
                categoryId,
                typeId: imagesTypeId || '',
                modelId,
                tags: randomTags,
                privateContent: scrapeResult.privateContent,
                imageUrl,
                sourceId: scrapeResult.sourceId,
            };

            const createResult = await adminCreatePrompt(adminId, promptData);

            if (createResult.success) {
                successCount++;
            } else {
                throw new Error(createResult.error || 'Failed to save prompt.');
            }
        } catch (e: any) {
            errorCount++;
            errors.push({ url, reason: e.message });
        }
    }

    return { successCount, errorCount, errors };
}
