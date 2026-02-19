'use server';

/**
 * @fileOverview A flow to generate video from a text prompt using Google's Veo model.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';
import { MediaPart } from 'genkit';

const GenerateVideoInputSchema = z.object({
  prompt: z.string().describe('The text prompt for video generation.'),
  durationSeconds: z.number().min(2).max(8).optional().default(5).describe('Length of the video in seconds.'),
});
export type GenerateVideoInput = z.infer<typeof GenerateVideoInputSchema>;

const GenerateVideoOutputSchema = z.object({
  videoUrl: z.string().describe('The data URI of the generated video.'), // data:video/mp4;base64,...
  contentType: z.string().describe('The MIME type of the video.'),
});
export type GenerateVideoOutput = z.infer<typeof GenerateVideoOutputSchema>;

export async function generateVideo(input: GenerateVideoInput): Promise<GenerateVideoOutput> {
  return generateVideoFlow(input);
}

const generateVideoFlow = ai.defineFlow(
  {
    name: 'generateVideoFlow',
    inputSchema: GenerateVideoInputSchema,
    outputSchema: GenerateVideoOutputSchema,
  },
  async (input) => {
    // Note: Video generation is slow and can take up to a minute.
    // Ensure serverless function timeouts are configured appropriately (e.g., > 60 seconds).
    let { operation } = await ai.generate({
      model: googleAI.model('veo-2.0-generate-001'),
      prompt: input.prompt,
      config: {
        durationSeconds: input.durationSeconds,
        aspectRatio: '16:9',
      },
    });

    if (!operation) {
      throw new Error('Expected the model to return an operation for video generation.');
    }

    // Poll the operation status. Timeout after 55 seconds to stay within typical serverless limits.
    const startTime = Date.now();
    const timeout = 55000;

    while (!operation.done && Date.now() - startTime < timeout) {
      // Wait for 5 seconds before checking again.
      await new Promise((resolve) => setTimeout(resolve, 5000));
      operation = await ai.checkOperation(operation);
    }

    if (!operation.done) {
        throw new Error('Video generation timed out. Please try again with a shorter duration or simpler prompt.');
    }

    if (operation.error) {
      throw new Error(`Video generation failed: ${operation.error.message}`);
    }

    const videoPart = operation.output?.message?.content.find((p) => !!p.media && p.media.contentType?.startsWith('video/'));
    if (!videoPart || !videoPart.media?.url) {
      throw new Error('Failed to find the generated video in the operation output.');
    }

    // The returned URL is temporary and needs an API key. We must fetch it on the server.
    const fetch = (await import('node-fetch')).default;
    // The GEMINI_API_KEY is automatically used by the google-genai plugin,
    // but the download URL requires it to be manually appended.
    const videoDownloadResponse = await fetch(
      `${videoPart.media.url}&key=${process.env.GEMINI_API_KEY}`
    );
    
    if (!videoDownloadResponse.ok || !videoDownloadResponse.body) {
        throw new Error(`Failed to download generated video. Status: ${videoDownloadResponse.status}`);
    }

    const videoBuffer = await videoDownloadResponse.buffer();
    const base64Video = videoBuffer.toString('base64');
    const contentType = videoPart.media.contentType || 'video/mp4';
    
    return {
      videoUrl: `data:${contentType};base64,${base64Video}`,
      contentType: contentType,
    };
  }
);
