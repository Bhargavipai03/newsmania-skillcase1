'use server';

/**
 * @fileOverview A news category suggestion AI agent.
 *
 * - suggestNewsCategory - A function that suggests a news category to the user.
 * - SuggestNewsCategoryInput - The input type for the suggestNewsCategory function.
 * - SuggestNewsCategoryOutput - The return type for the suggestNewsCategory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestNewsCategoryInputSchema = z.object({
  categoryClicks: z
    .record(z.number())
    .describe(
      'A map of news categories to the number of times the user has clicked on them.'
    ),
});
export type SuggestNewsCategoryInput = z.infer<typeof SuggestNewsCategoryInputSchema>;

const SuggestNewsCategoryOutputSchema = z.object({
  suggestedCategory: z.string().describe('The suggested news category.'),
  reason: z.string().describe('The reason for the suggestion.'),
});
export type SuggestNewsCategoryOutput = z.infer<typeof SuggestNewsCategoryOutputSchema>;

export async function suggestNewsCategory(input: SuggestNewsCategoryInput): Promise<SuggestNewsCategoryOutput> {
  return suggestNewsCategoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestNewsCategoryPrompt',
  input: {schema: SuggestNewsCategoryInputSchema},
  output: {schema: SuggestNewsCategoryOutputSchema},
  prompt: `You are a news recommendation expert. Given the user's past category viewing history, suggest a news category they might be interested in.

  Category Click History: {{{categoryClicks}}}

  Based on this information, suggest a news category and explain why you are suggesting it.`,
});

const suggestNewsCategoryFlow = ai.defineFlow(
  {
    name: 'suggestNewsCategoryFlow',
    inputSchema: SuggestNewsCategoryInputSchema,
    outputSchema: SuggestNewsCategoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
