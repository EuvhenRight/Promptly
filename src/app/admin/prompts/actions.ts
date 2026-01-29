
'use server';

import * as cheerio from 'cheerio';
import { uploadImageFromBuffer } from '@/firebase/prompts';
import { z } from 'zod';

const ScrapeResultSchema = z.object({
  title: z.string(),
  privateContent: z.string(),
  categories: z.string(),
  imageUrl: z.string(),
});

export type ScrapeResult = z.infer<typeof ScrapeResultSchema>;

export async function scrapePromptHero(
  url: string
): Promise<ScrapeResult | { error: string }> {
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

    const nextDataScript = $('#__NEXT_DATA__').html();

    if (nextDataScript) {
      // --- Primary Method: Use __NEXT_DATA__ ---
      try {
        const data = JSON.parse(nextDataScript);
        const promptData = data?.props?.pageProps?.prompt;

        if (promptData) {
          title = promptData.displayName;
          privateContent = promptData.prompt;
          categories = promptData.model;
          originalImageUrl = promptData.images?.[0]?.url;
        }
      } catch (e) {
        // JSON parsing failed, ignore and fall back to manual scraping
        console.warn('Could not parse __NEXT_DATA__ JSON. Falling back to manual scraping.');
      }
    }

    // --- Fallback Method: Use new advanced Cheerio selectors ---
    if (!title || !privateContent || !originalImageUrl) {
        console.log('__NEXT_DATA__ not found or incomplete. Using new fallback scraping method.');

        // Fallback for title (standard and reliable)
        if (!title) {
          title = $('h1').first().text().trim();
        }

        // Fallback for private content using a reliable container selector
        if (!privateContent) {
           // This robustly finds the main prompt block and extracts its full text content,
           // preventing data loss from partial selectors.
           privateContent = $('div.text-white.break-words').first().text().trim();
        }

        // Fallback for categories
        if (!categories) {
          categories = $('a[href^="/model/"]').first().text().trim() || 'Unknown';
        }

        // New, improved image parsing logic
        if (!originalImageUrl) {
            let imageUrl: string | undefined;

            // 1. Prioritize a specific, often-used structure for the main image
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

            // 2. If not found, fall back to a broader search in main/article
            if (!imageUrl) {
                 $('main img, article img').each((i, el) => {
                    const srcset = $(el).attr('srcset');
                    if (srcset) {
                        const sources = srcset.split(',').map(s => s.trim().split(' ')[0]);
                        imageUrl = sources[sources.length - 1];
                        return false; // Found one, break the loop
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
                        // Use original URL as base to handle relative paths correctly
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
            
            // Ensure URL is absolute
            if (originalImageUrl && originalImageUrl.startsWith('/')) {
                try {
                    originalImageUrl = new URL(originalImageUrl, new URL(url).origin).href;
                } catch (e) {
                    // Ignore if it's not a valid relative URL
                }
            }
        }
    }


    // --- Final Validation ---
    if (!title || !privateContent || !originalImageUrl) {
        let missing = [];
        if (!title) missing.push('title');
        if (!privateContent) missing.push('prompt content');
        if (!originalImageUrl) missing.push('image URL');
        return { error: `Scraping failed. Could not extract: ${missing.join(', ')}. The website structure may have changed.` };
    }


    // --- Image Processing ---
    // Download the image
    const imageResponse = await fetch(originalImageUrl);
    if (!imageResponse.ok) {
      return { error: 'Failed to download the prompt image.' };
    }
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const originalFilename = originalImageUrl.split('/').pop()?.split('?')[0] || 'image.jpg';

    // Upload the image to our Firebase Storage
    const imageUrl = await uploadImageFromBuffer(imageBuffer, originalFilename);

    return {
      title,
      privateContent,
      categories: categories || 'Unknown',
      imageUrl,
    };
  } catch (error: any) {
    console.error('Scraping failed:', error);
    return {
      error: error.message || 'An unexpected error occurred during scraping.',
    };
  }
}
