'use server';

/**
 * @fileOverview A flow to suggest relevant tags for a prompt based on its title and description.
 *
 * - suggestRelevantTags - A function that suggests relevant tags for a prompt.
 * - SuggestRelevantTagsInput - The input type for the suggestRelevantTags function.
 * - SuggestRelevantTagsOutput - The return type for the suggestRelevantTags function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import Replicate from 'replicate';

const SuggestRelevantTagsInputSchema = z.object({
  title: z.string().describe('The title of the prompt.'),
  description: z.string().describe('The description of the prompt.'),
});
export type SuggestRelevantTagsInput = z.infer<typeof SuggestRelevantTagsInputSchema>;

const SuggestRelevantTagsOutputSchema = z.object({
  tags: z.array(z.string()).describe('An array of relevant tags for the prompt.'),
});
export type SuggestRelevantTagsOutput = z.infer<typeof SuggestRelevantTagsOutputSchema>;

export async function suggestRelevantTags(input: SuggestRelevantTagsInput): Promise<SuggestRelevantTagsOutput> {
  return suggestRelevantTagsFlow(input);
}

const suggestRelevantTagsFlow = ai.defineFlow(
  {
    name: 'suggestRelevantTagsFlow',
    inputSchema: SuggestRelevantTagsInputSchema,
    outputSchema: SuggestRelevantTagsOutputSchema,
  },
  async input => {
    // Ensure the API token is set, otherwise Replicate will throw an error
    if (!process.env.REPLICATE_API_TOKEN) {
      console.error('REPLICATE_API_TOKEN environment variable not set.');
      return { tags: [] };
    }

    const replicate = new Replicate();

    const prompt = `Based on the following title and description for an AI prompt, generate a list of 5 to 7 relevant tags. These tags will be used to categorize and find the prompt on a marketplace. The tags should be short, relevant, and in English. Output ONLY a comma-separated list of tags. For example: cyberpunk, futuristic, neon, city, character design.

Title: "${input.title}"
Description: "${input.description}"`;

    try {
      const output = (await replicate.run(
        "meta/meta-llama-3-8b-instruct",
        {
          input: {
            prompt: prompt,
            temperature: 0.5,
            max_new_tokens: 50,
          },
        }
      )) as string[];

      const tagString = output.join('');
      const tags = tagString.split(',').map(tag => tag.trim()).filter(Boolean);

      return { tags };
    } catch (error) {
      console.error('[Flow: suggestRelevantTags] Error calling Replicate API:', error);
      // Return an empty array on error to avoid breaking the calling code
      return { tags: [] };
    }
  }
);
