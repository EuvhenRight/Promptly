
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
    const nextDataScript = $('#__NEXT_DATA__').html();

    if (!nextDataScript) {
      return { error: 'Could not find __NEXT_DATA__ script in the page.' };
    }

    const data = JSON.parse(nextDataScript);
    const promptData = data?.props?.pageProps?.prompt;

    if (!promptData) {
      return { error: 'Could not find prompt data in the JSON payload.' };
    }

    const title = promptData.displayName || 'Untitled';
    const privateContent = promptData.prompt || '';
    const categories = promptData.model || 'Unknown';
    const originalImageUrl = promptData.images?.[0]?.url;

    if (!originalImageUrl) {
      return { error: 'Could not find an image URL for the prompt.' };
    }

    // Download the image
    const imageResponse = await fetch(originalImageUrl);
    if (!imageResponse.ok) {
      return { error: 'Failed to download the prompt image.' };
    }
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const originalFilename = originalImageUrl.split('/').pop() || 'image.jpg';

    // Upload the image to our Firebase Storage
    const imageUrl = await uploadImageFromBuffer(imageBuffer, originalFilename);

    return {
      title,
      privateContent,
      categories,
      imageUrl,
    };
  } catch (error: any) {
    console.error('Scraping failed:', error);
    return {
      error: error.message || 'An unexpected error occurred during scraping.',
    };
  }
}
