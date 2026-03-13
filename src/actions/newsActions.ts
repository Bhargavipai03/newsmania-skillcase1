
'use server';

import { NewsService, type Article, type NewsQueryParams } from '@/services/newsService';
import { prioritizeNews, type ArticleForAI, type PrioritizeNewsInput } from '@/ai/flows/prioritize-news-flow';

let newsServiceInstance: NewsService;

function getNewsServiceInstance() {
  if (!newsServiceInstance) {
    newsServiceInstance = new NewsService();
  }
  return newsServiceInstance;
}

/** Only true when a real Gemini / Google AI key is set in the environment */
function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
  return key.length > 10 && !key.toLowerCase().startsWith('your_');
}

/**
 * Fetch curated news for nurses (entertainment, health, sports, business)
 * Suitable for daily auto-updates
 */
export async function fetchCuratedNewsAction(totalArticles: number = 15): Promise<Article[]> {
  const service = getNewsServiceInstance();
  const categories = ['entertainment', 'health', 'sports', 'business'];
  
  try {
    const allArticles: Article[] = [];
    const articlesPerCategory = Math.ceil(totalArticles / categories.length);

    // Fetch from multiple categories
    const fetchPromises = categories.map((category) => {
      const params: NewsQueryParams = {
        category,
        country: 'in',
        displayCategory: category.charAt(0).toUpperCase() + category.slice(1),
        displayCountry: 'India',
      };
      
      return service
        .fetchNews(params)
        .then((articles) => articles.slice(0, articlesPerCategory))
        .catch((err) => {
          console.error(`Error fetching ${category} news:`, err);
          return [];
        });
    });

    const results = await Promise.all(fetchPromises);
    results.forEach((articles) => allArticles.push(...articles));

    // Remove duplicates and limit to total
    const uniqueArticles = Array.from(
      new Map(allArticles.map((article) => [article.id, article])).values()
    ).slice(0, totalArticles);

    console.log(`✅ Fetched ${uniqueArticles.length} curated articles for nurses`);
    return uniqueArticles;
  } catch (error) {
    console.error('Error fetching curated news:', error);
    return [];
  }
}

export async function fetchNewsArticles(
  queryOrCategory: string | null,
  countryQuery: string | null,
  displayCategory: string,
  displayCountry: string,
  userCategoryClicks?: Record<string, number> | null,
  isSearchQuery: boolean = false,
  page: number = 1
): Promise<Article[]> {
  const service = getNewsServiceInstance();

  const params: NewsQueryParams = {
    category: isSearchQuery ? null : queryOrCategory,
    query: isSearchQuery ? (queryOrCategory ?? undefined) : undefined,
    country: countryQuery,
    displayCategory,
    displayCountry,
    page,
  };

  let fetchedArticles = await service.fetchNews(params);

  // Only attempt AI prioritization when a Gemini key is actually configured.
  // Without a key, Genkit throws FAILED_PRECONDITION and crashes the request.
  if (
    isGeminiConfigured() &&
    userCategoryClicks &&
    fetchedArticles.length > 0 &&
    Object.keys(userCategoryClicks).length > 0
  ) {
    console.log('Attempting AI prioritization for news articles...');
    try {
      const articlesForAI: ArticleForAI[] = fetchedArticles.map(article => ({
        id: article.id,
        title: article.title,
        summary: article.summary,
        category: article.category,
        publishedAt: article.publishedAt,
      }));

      const aiInput: PrioritizeNewsInput = {
        articles: articlesForAI,
        userCategoryClicks,
      };

      const result = await prioritizeNews(aiInput);

      if (result?.prioritizedArticleIds?.length > 0) {
        console.log('AI prioritization successful. Reasoning:', result.reasoning);
        const articleMap = new Map(fetchedArticles.map(a => [a.id, a]));
        const prioritized: Article[] = [];

        for (const id of result.prioritizedArticleIds) {
          const a = articleMap.get(id);
          if (a) prioritized.push(a);
        }

        // Append anything the AI missed so we never lose articles
        const aiIds = new Set(prioritized.map(a => a.id));
        fetchedArticles.forEach(a => { if (!aiIds.has(a.id)) prioritized.push(a); });

        if (prioritized.length >= fetchedArticles.length) {
          fetchedArticles = prioritized;
        }
      } else {
        console.warn('AI prioritization returned no valid result; using time-sorted order.');
      }
    } catch (error) {
      // Never crash the page because of AI — silently fall back to time-sorted
      console.warn(
        'AI prioritization skipped:',
        error instanceof Error ? error.message : error
      );
    }
  }
  // If no Gemini key → silently skip AI ranking, no error surfaced to user

  return fetchedArticles;
}
