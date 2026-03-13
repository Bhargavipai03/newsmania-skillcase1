
'use server';

import type { NewsArticle } from '@/components/news/news-article-card';

const API_BASE_URL = 'https://newsdata.io/api/1/news';

interface NewsDataIOResult {
  article_id: string;
  title: string;
  link: string;
  keywords: string[] | null;
  creator: string[] | null;
  video_url: string | null;
  description: string | null;
  content: string | null;
  pubDate: string; // "2023-05-20 09:00:00"
  image_url: string | null;
  source_id: string;
  source_priority: number;
  country: string[];
  category: string[];
  language: string;
}

interface NewsDataIOResponse {
  status: string; // "success" or "error"
  totalResults?: number;
  results?: NewsDataIOResult[];
  nextPage?: string;
  // For errors:
  code?: string;
  message?: string; // This might be nested under a 'results' object for errors
}


// Helper to generate a simple aiHint from category or title
function generateAiHint(category: string, title: string): string {
  if (category && category.toLowerCase() !== 'general' && category.toLowerCase() !== 'top') {
    return category.toLowerCase();
  }
  const titleWords = title.split(' ').slice(0, 2);
  if (titleWords.length > 0) {
    return titleWords.join(' ').toLowerCase();
  }
  return "news media"; 
}


export async function fetchNews(
  categoryQuery: string | null, // e.g., "technology", "sports", "general" (will be mapped to "top")
  countryQuery: string | null, // e.g., "us", "gb", or null for global
  displayCategory: string, // Category for UI display
  displayCountry: string // Country for UI display
): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWSDATA_API_KEY;

  if (!apiKey || apiKey === "YOUR_NEWSDATA_API_KEY_HERE" || apiKey.length < 20) { // Basic check for placeholder
    console.error('Newsdata.io API key is missing or not configured.');
    throw new Error('Newsdata.io API key is not configured. Please add NEWSDATA_API_KEY to your .env file.');
  }

  const params = new URLSearchParams({
    apikey: apiKey,
    image: '1', // Request images
    // language: 'en', // Default is 'en', can be specified if needed
  });

  let newsdataCategoryParam = categoryQuery;
  if (categoryQuery && categoryQuery.toLowerCase() === 'general') {
    newsdataCategoryParam = 'top'; // Map "general" from UI to "top" for Newsdata.io
  } else if (!categoryQuery) {
    newsdataCategoryParam = 'top'; // Default to 'top' if no category specified (e.g. "All Categories")
  }

  if (newsdataCategoryParam) {
    params.append('category', newsdataCategoryParam);
  }

  if (countryQuery) {
    params.append('country', countryQuery);
  }
  
  // Newsdata.io requires 'q', 'country', 'category', or 'domain'. 
  // We ensure 'category' is always present (defaults to 'top').

  try {
    const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
    const data: NewsDataIOResponse = await response.json();

    if (!response.ok || data.status === 'error') {
      let errorMessage = `Failed to fetch news. Status: ${response.status}`;
      if (data.results && typeof data.results === 'object' && 'message' in data.results) {
         // Newsdata.io sometimes nests error message in results for status: "error"
        errorMessage = `Newsdata.io API error: ${(data.results as { message: string }).message}`;
      } else if (data.message) {
        errorMessage = `Newsdata.io API error: ${data.message}`;
      }
      console.error('Newsdata.io API request failed:', errorMessage, data);
      throw new Error(errorMessage);
    }
    
    if (!data.results || data.results.length === 0) {
      return [];
    }

    return data.results.slice(0, 21).map((article) => ({ // Limit to 21 articles for consistency
      id: article.article_id || article.link,
      title: article.title || 'No title available',
      summary: article.description || article.content || 'No summary available',
      imageUrl: article.image_url || `https://placehold.co/600x400.png`,
      source: article.source_id || 'Unknown source',
      category: displayCategory, 
      country: displayCountry, 
      publishedAt: article.pubDate, // Assuming pubDate is in a parseable format
      url: article.link,
      aiHint: generateAiHint(displayCategory, article.title || ""),
    }));
  } catch (error) {
    console.error('Error fetching news from Newsdata.io:', error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error('An unknown error occurred while fetching news from Newsdata.io.');
  }
}
