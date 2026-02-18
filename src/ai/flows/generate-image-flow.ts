'use server';

/**
 * @fileOverview A flow to generate images using Replicate.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import Replicate from 'replicate';
import { AVAILABLE_MODELS } from '@/lib/ai-models';

const GenerateImageInputSchema = z.object({
  modelId: z.string().describe('The ID of the model to use from ai-models.ts.'),
  prompt: z.string().describe('The text prompt for image generation.'),
  // Optional reference image as a data URI
  referenceImageUrl: z.string().optional().describe("A reference image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  aspectRatio: z.string().optional().describe('The aspect ratio of the generated image.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrl: z.string().describe('The URL of the generated image.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (input) => {
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error('REPLICATE_API_TOKEN environment variable not set.');
    }

    const selectedModel = AVAILABLE_MODELS.find(m => m.id === input.modelId);
    if (!selectedModel) {
        throw new Error(`Model with ID "${input.modelId}" not found.`);
    }

    const replicate = new Replicate();

    const replicateInput: any = {
        prompt: input.prompt,
    };

    if (input.aspectRatio) {
      if (selectedModel.supportsAspectRatio) {
          replicateInput.aspect_ratio = input.aspectRatio;
      } else {
          // Calculate width and height for models that don't support aspect_ratio directly
          const [w, h] = input.aspectRatio.split(':').map(Number);
          const baseSize = 1024; // A common base size for models like SDXL
          if (w > h) {
              replicateInput.width = baseSize;
              replicateInput.height = Math.round((baseSize * h) / w);
          } else {
              replicateInput.height = baseSize;
              replicateInput.width = Math.round((baseSize * w) / h);
          }
      }
    }
    
    // If a reference image is provided, add it to the input.
    if (input.referenceImageUrl) {
        replicateInput.image = input.referenceImageUrl;
    }

    // --- DEBUG LOGGING ---
    console.log('[Flow: generateImage] Calling Replicate with model version:', selectedModel.ref);
    console.log('[Flow: generateImage] Input parameters:', JSON.stringify(replicateInput, null, 2));
    // --- END DEBUG LOGGING ---

    try {
      const output = (await replicate.run(
        selectedModel.ref,
        {
          input: replicateInput,
        }
      )) as string[] | string;

      // Replicate output can be an array of URLs or a single URL string
      const imageUrl = Array.isArray(output) ? output[0] : output;

      if (!imageUrl) {
        throw new Error('Image generation failed to produce a URL.');
      }

      return { imageUrl };
    } catch (error: any) {
      // Improved error logging as suggested
      const errorMessage = error.detail ? `${error.title}: ${error.detail}` : error.message || 'An unknown error occurred with the AI model.';
      console.error('[Flow: generateImage] Error calling Replicate API:', errorMessage);
      console.error('Full Replicate Error:', JSON.stringify(error, null, 2));
      throw new Error(errorMessage);
    }
  }
);
