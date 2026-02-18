'use server';

/**
 * @fileOverview A flow to generate images using Replicate.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import Replicate from 'replicate';

export const GenerateImageInputSchema = z.object({
  model: z.string().describe('The Replicate model version to use.'),
  prompt: z.string().describe('The text prompt for image generation.'),
  // Optional reference image as a data URI
  referenceImageUrl: z.string().optional().describe("A reference image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  aspectRatio: z.string().optional().describe('The aspect ratio of the generated image.'),
  outputFormat: z.string().optional().describe('The output format of the generated image (e.g., "jpg", "png").'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

export const GenerateImageOutputSchema = z.object({
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

    const replicate = new Replicate();

    const replicateInput: any = {
        prompt: input.prompt,
    };

    if (input.aspectRatio) {
        replicateInput.aspect_ratio = input.aspectRatio;
    }
    
    if (input.outputFormat) {
        replicateInput.output_format = input.outputFormat;
    }

    // If a reference image is provided, add it to the input.
    // Note: The exact input key (e.g., 'image', 'init_image') can vary by model.
    // We'll use 'image' as a common default.
    if (input.referenceImageUrl) {
        replicateInput.image = input.referenceImageUrl;
    }

    try {
      const output = (await replicate.run(
        input.model as `${string}/${string}:${string}`,
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
      console.error('[Flow: generateImage] Error calling Replicate API:', error);
      const errorMessage = error.detail || error.message || 'An unknown error occurred with the AI model.';
      throw new Error(errorMessage);
    }
  }
);
