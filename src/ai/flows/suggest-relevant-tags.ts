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

const prompt = ai.definePrompt({
  name: 'suggestRelevantTagsPrompt',
  input: {schema: SuggestRelevantTagsInputSchema},
  output: {schema: SuggestRelevantTagsOutputSchema},
  prompt: `You are an AI prompt tag suggestion assistant.

  Given the title and description of a prompt, you will suggest relevant tags that can be used to improve the discoverability of the prompt.
  The tags should be relevant to the content of the prompt and should be commonly used terms.
  Return a JSON array of strings.

  Title: {{{title}}}
  Description: {{{description}}}`,
});

const suggestRelevantTagsFlow = ai.defineFlow(
  {
    name: 'suggestRelevantTagsFlow',
    inputSchema: SuggestRelevantTagsInputSchema,
    outputSchema: SuggestRelevantTagsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
