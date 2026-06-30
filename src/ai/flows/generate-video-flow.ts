'use server';

/**
 * @fileOverview A flow to generate video from a text prompt using Replicate.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getReplicateClient } from '@/lib/replicate';
import { AVAILABLE_MODELS } from '@/lib/ai-models';

const GenerateVideoInputSchema = z.object({
  modelId: z.string().describe('The ID of the video model to use from ai-models.ts.'),
  prompt: z.string().describe('The text prompt for video generation.'),
  duration: z.number().optional().default(8).describe('Duration of the video in seconds.'),
  aspectRatio: z.string().optional().describe('The aspect ratio of the video.'),
});
export type GenerateVideoInput = z.infer<typeof GenerateVideoInputSchema>;

const GenerateVideoOutputSchema = z.object({
  videoUrl: z.string().describe('The URL of the generated video.'),
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
    const selectedModel = AVAILABLE_MODELS.find(m => m.id === input.modelId && m.type === 'video');
    if (!selectedModel) {
        throw new Error(`Video model with ID "${input.modelId}" not found.`);
    }

    const replicate = await getReplicateClient();

    const replicateInput: any = {
        prompt: input.prompt,
        duration: input.duration,
        resolution: "720p", // Hardcode for now, can be an option later
    };

    if (input.aspectRatio) {
        replicateInput.aspect_ratio = input.aspectRatio;
    }

    console.log('[Flow: generateVideo] Calling Replicate with model version:', selectedModel.ref);
    console.log('[Flow: generateVideo] Input parameters:', JSON.stringify(replicateInput, null, 2));

    try {
      const output = (await replicate.run(
        selectedModel.ref,
        {
          input: replicateInput,
        }
      )) as { url: () => string } | string; // The output can be an object with a url method or a direct string

      let videoUrl: string;

      if (typeof output === 'string') {
        videoUrl = output;
      } else if (typeof output === 'object' && output !== null && typeof (output as any).url === 'function') {
        videoUrl = (output as { url: () => string }).url();
      } else if (Array.isArray(output)) {
        videoUrl = output[0] as string; // Take the first URL if it's an array
      } else {
         throw new Error('Unexpected output format from Replicate API.');
      }
      
      if (!videoUrl) {
        throw new Error('Video generation failed to produce a URL.');
      }

      return { videoUrl };

    } catch (error: any) {
      const errorMessage = error.detail ? `${error.title}: ${error.detail}` : error.message || 'An unknown error occurred with the AI model.';
      console.error('[Flow: generateVideo] Error calling Replicate API:', errorMessage);
      console.error('Full Replicate Error:', JSON.stringify(error, null, 2));
      throw new Error(errorMessage);
    }
  }
);
