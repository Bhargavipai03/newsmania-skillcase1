/**
 * Curated news service for nurses
 * Fetches targeted news from various categories relevant to nurses
 */

import { NewsService, type NewsQueryParams, type Article } from '@/services/newsService';

export interface CuratedNewsConfig {
  totalArticles?: number; // Total articles to fetch (default: 15)
  India?: boolean; // Focus on India news (default: true)
}

const NURSE_RELEVANT_CATEGORIES = [
  'entertainment',
  'health',
  'sports',
  'business',
];

const NURSE_RELEVANT_KEYWORDS = [
  'hospital',
  'nurse',
  'doctor',
  'health',
  'medical',
  'bollywood',
  'actor',
  'film',
  'cricket',
  'sports',
];

let newsServiceInstance: NewsService | null = null;

function getNewsServiceInstance(): NewsService {
  if (!newsServiceInstance) {
    newsServiceInstance = new NewsService();
  }
  return newsServiceInstance;
}

/**
 * Fetch curated news for nurses
 * Prioritizes: Bollywood/Entertainment, Healthcare/Hospitals, Sports, General India news
 */
export async function fetchCuratedNewsForNurses(
  config: CuratedNewsConfig = {}
): Promise<Article[]> {
  const { totalArticles = 15, India = true } = config;

  try {
    const service = getNewsServiceInstance();
    const allArticles: Article[] = [];
    const articlesPerCategory = Math.ceil(totalArticles / NURSE_RELEVANT_CATEGORIES.length);

    // Fetch from multiple categories
    const fetchPromises = NURSE_RELEVANT_CATEGORIES.map((category) => {
      const params: NewsQueryParams = {
        category,
        country: India ? 'in' : undefined,
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

    // Limit to requested total and remove duplicates
    const uniqueArticles = Array.from(
      new Map(allArticles.map((article) => [article.id, article])).values()
    ).slice(0, totalArticles);

    // Validate and sanitize articles
    const sanitizedArticles = uniqueArticles.map((article) => {
      if (!article.imageUrl || !article.imageUrl.startsWith('http')) {
        article.imageUrl = '/default-placeholder.png'; // Replace with a default image URL
      }
      return article;
    });

    console.log(`✅ Sanitized ${sanitizedArticles.length} curated articles for nurses`);
    return sanitizedArticles;
  } catch (error) {
    console.error('Error fetching curated news:', error);
    return [];
  }
}

/**
 * Fetch breaking/latest news for nurses
 * Uses keywords to get most relevant nurse-focused content
 */
export async function fetchLatestNurseNews(): Promise<Article[]> {
  try {
    const service = getNewsServiceInstance();
    
    // Try to fetch several keyword-based searches
    const fetchPromises = NURSE_RELEVANT_KEYWORDS.slice(0, 5).map((keyword) => {
      const params: NewsQueryParams = {
        query: keyword,
        country: 'in',
        displayCategory: 'Latest',
        displayCountry: 'India',
      };
      
      return service
        .fetchNews(params)
        .then((articles) => articles.slice(0, 3))
        .catch(() => []);
    });

    const results = await Promise.all(fetchPromises);
    const allArticles: Article[] = [];
    results.forEach((articles) => allArticles.push(...articles));

    // Remove duplicates and limit to 15
    const uniqueArticles = Array.from(
      new Map(allArticles.map((article) => [article.id, article])).values()
    )
      .sort((a, b) => {
        const dateA = new Date(a.publishedAt).getTime();
        const dateB = new Date(b.publishedAt).getTime();
        return dateB - dateA; // Most recent first
      })
      .slice(0, 15);

    console.log(`✅ Fetched ${uniqueArticles.length} latest nurse news articles`);
    return uniqueArticles;
  } catch (error) {
    console.error('Error fetching latest nurse news:', error);
    return [];
  }
}
