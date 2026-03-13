
'use server';
/**
 * @fileOverview An AI flow to prioritize news articles based on user preferences and recency.
 *
 * - prioritizeNewsFlow - A function that re-ranks news articles.
 * - PrioritizeNewsInput - The input type for the prioritizeNewsFlow function.
 * - PrioritizeNewsOutput - The return type for the prioritizeNewsFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define a schema for the article data needed by the AI
const ArticleForAISchema = z.object({
  id: z.string().describe("Unique identifier for the article."),
  title: z.string().describe("The title of the news article."),
  summary: z.string().describe("A brief summary of the news article."),
  category: z.string().describe("The original category of the news article (e.g., technology, sports)."),
  publishedAt: z.string().describe("The publication date of the article in ISO 8601 format."),
});
export type ArticleForAI = z.infer<typeof ArticleForAISchema>;

const PrioritizeNewsInputSchema = z.object({
  articles: z.array(ArticleForAISchema).describe("A list of news articles to be prioritized. These are already sorted by newest first."),
  userCategoryClicks: z.record(z.string(), z.number()).describe(
    "A map of news categories to the number of times the user has clicked on them. Higher numbers indicate stronger preference. Example: {'technology': 10, 'sports': 5}"
  ),
});
export type PrioritizeNewsInput = z.infer<typeof PrioritizeNewsInputSchema>;

const PrioritizeNewsOutputSchema = z.object({
  prioritizedArticleIds: z.array(z.string()).describe(
    "An array of article IDs, re-ordered from most to least relevant for the user. Recency of articles should be a very strong factor in prioritization. The list should contain all original article IDs."
  ),
  reasoning: z.string().describe("A brief explanation of how the prioritization was done, if possible."),
});
export type PrioritizeNewsOutput = z.infer<typeof PrioritizeNewsOutputSchema>;

export async function prioritizeNews(input: PrioritizeNewsInput): Promise<PrioritizeNewsOutput> {
  // Basic validation: if no articles or no preferences, return original order (or handle as needed)
  if (input.articles.length === 0) {
    return { prioritizedArticleIds: [], reasoning: "No articles provided to prioritize." };
  }
  if (Object.keys(input.userCategoryClicks).length === 0) {
    return { 
        prioritizedArticleIds: input.articles.map(a => a.id), 
        reasoning: "No user preferences available; returning original (time-sorted) order." 
    };
  }
  return prioritizeNewsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'prioritizeNewsPrompt',
  input: {schema: PrioritizeNewsInputSchema},
  output: {schema: PrioritizeNewsOutputSchema},
  prompt: `You are an expert news curator AI. Your task is to re-rank a list of news articles for a user based on their expressed category preferences.
The articles provided are already sorted with the newest articles first.

User's Category Click History (higher number means stronger interest):
{{{json userCategoryClicks}}}

Articles to re-rank (already sorted by newest first):
{{#each articles}}
- ID: {{id}}
  Title: {{title}}
  Summary: {{summary}}
  Category: {{category}}
  Published: {{publishedAt}}
{{/each}}

Please re-order the article IDs based on the user's preferences.
**Crucially, recency is very important.** Prioritize articles that are both recent AND relevant to the user's interests.
Do not simply put all articles from preferred categories at the top if they are old. A slightly less relevant but very recent article might still be more important than an older, more relevant one.
Ensure your output list 'prioritizedArticleIds' contains ALL the IDs from the input 'articles' list, just in a new order.
Provide a brief reasoning for your prioritization strategy.
`,
});

const prioritizeNewsFlow = ai.defineFlow(
  {
    name: 'prioritizeNewsFlow',
    inputSchema: PrioritizeNewsInputSchema,
    outputSchema: PrioritizeNewsOutputSchema,
  },
  async (input: PrioritizeNewsInput) => {
    // Handle edge case where AI might not return full list or fails
    try {
      const {output} = await prompt(input);
      if (output && output.prioritizedArticleIds && output.prioritizedArticleIds.length === input.articles.length) {
        // Basic check to ensure all IDs are present (more robust validation could be added)
        const inputIds = new Set(input.articles.map(a => a.id));
        const outputIds = new Set(output.prioritizedArticleIds);
        if (inputIds.size === outputIds.size && [...inputIds].every(id => outputIds.has(id))) {
          return output;
        }
      }
      // Fallback if AI output is not as expected
      console.warn("AI prioritization did not return a valid reordering. Falling back to original order.");
      return {
        prioritizedArticleIds: input.articles.map(a => a.id),
        reasoning: "AI prioritization failed or returned incomplete data. Defaulting to time-sorted order."
      };
    } catch (error) {
      console.error("Error in prioritizeNewsFlow:", error);
      return {
        prioritizedArticleIds: input.articles.map(a => a.id),
        reasoning: "An error occurred during AI prioritization. Defaulting to time-sorted order."
      };
    }
  }
);
