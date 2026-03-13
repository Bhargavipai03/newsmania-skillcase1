
import { apiConfig } from '@/config/apiConfig';
import { ApiRotator } from '@/utils/apiRotator';

// This interface should be compatible with src/components/news/news-article-card.tsx NewsArticle
export interface Article {
  id: string;
  title: string;
  summary: string;
  imageUrl: string; // Ensure this is always a string, provide placeholder if null
  source: string;
  category: string; // The category it was requested for or determined
  country: string; // The country it was requested for or determined
  publishedAt: string;
  url: string;
  aiHint?: string;
  originalProvider?: string; // To know which API it came from
  verified?: boolean; // Added for verified news feature
}

export interface NewsQueryParams {
  category?: string | null;
  country?: string | null;
  query?: string;
  page?: number; // For pagination if supported by API
  displayCategory: string; // For consistent UI display
  displayCountry: string;  // For consistent UI display
}

// NewsAPI specific interfaces
interface NewsApiArticle {
  source: { id: string | null; name: string };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string; // ISO 8601
  content: string | null;
}

interface NewsApiResponse {
  status: string; // "ok" or "error"
  totalResults?: number;
  articles?: NewsApiArticle[];
  code?: string;    // error code e.g. "apiKeyInvalid"
  message?: string; // error message
}

// Mediastack specific interfaces
interface MediaStackArticle {
  author: string | null;
  title: string;
  description: string;
  url: string;
  source: string;
  image: string | null;
  category: string;
  language: string;
  country: string;
  published_at: string;
}

interface MediaStackResponse {
  pagination?: {
    limit: number;
    offset: number;
    count: number;
    total: number;
  };
  data?: MediaStackArticle[];
  error?: {
    code: string;
    message: string;
    context?: any;
  };
}

// The Guardian specific interfaces
interface GuardianArticle {
  id: string; // e.g., "technology/2023/oct/26/smartphones-apple-google-features"
  type: string; // e.g., "article"
  sectionId: string; // e.g., "technology"
  sectionName: string; // e.g., "Technology"
  webPublicationDate: string; // ISO date string e.g., "2023-10-26T10:00:00Z"
  webTitle: string;
  webUrl: string;
  apiUrl: string;
  fields?: {
    trailText?: string; // This is often the summary
    thumbnail?: string; // URL to an image
  };
  tags?: Array<{ id: string; type: string; webTitle: string; webUrl: string; apiUrl: string }>;
}

interface GuardianResponse {
  response: {
    status: string; // "ok" or "error"
    userTier: string;
    total: number;
    startIndex: number;
    pageSize: number;
    currentPage: number;
    pages: number;
    orderBy: string;
    results: GuardianArticle[];
    message?: string; // For errors
  };
}


// GNews specific interfaces
interface GNewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  image: string | null;
  publishedAt: string; // ISO date string e.g. "2024-06-18T16:15:00Z"
  source: {
    name: string;
    url: string;
  };
}

interface GNewsResponse {
  totalArticles?: number;
  articles?: GNewsArticle[];
  errors?: string[]; // GNews specific error reporting
}


// Newsdata.io specific interfaces
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
  country: string[]; // countries article is relevant to
  category: string[]; // categories of the article
  language: string;
}

interface NewsDataIOResponse {
  status: string; // "success" or "error"
  totalResults?: number;
  results?: NewsDataIOResult[];
  nextPage?: string;
  // For errors:
  code?: string;
  message?: string;
}


export class NewsService {
  private apiRotator: ApiRotator;

  constructor() {
    this.apiRotator = new ApiRotator();
  }

  private generateAiHint(category: string, title: string): string {
    if (category && category.toLowerCase() !== 'general' && category.toLowerCase() !== 'top') {
      return category.toLowerCase();
    }
    const titleWords = title.split(' ').slice(0, 2);
    if (titleWords.length > 0) {
      return titleWords.join(' ').toLowerCase();
    }
    return "news media";
  }

  private sortArticlesByDate(articles: Article[]): Article[] {
    return articles.sort((a, b) => {
      // Prioritize articles with valid dates
      const dateAValid = a.publishedAt && !isNaN(new Date(a.publishedAt).getTime());
      const dateBValid = b.publishedAt && !isNaN(new Date(b.publishedAt).getTime());

      if (dateAValid && !dateBValid) return -1; // a is valid, b is not, a comes first
      if (!dateAValid && dateBValid) return 1;  // b is valid, a is not, b comes first
      if (!dateAValid && !dateBValid) return 0; // neither is valid, order doesn't change relative to each other

      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  }

  async fetchNews(params: NewsQueryParams): Promise<Article[]> {
    const errors: string[] = [];

    try {
      const newsApiArticles = await this.tryNewsApi(params);
      if (newsApiArticles.length > 0) return newsApiArticles;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn('NewsAPI skipped:', msg);
      errors.push(`NewsAPI: ${msg}`);
    }

    try {
      const mediaStackArticles = await this.tryMediaStack(params);
      if (mediaStackArticles.length > 0) return mediaStackArticles;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn('Mediastack skipped:', msg);
      errors.push(`Mediastack: ${msg}`);
    }

    try {
      const guardianArticles = await this.tryGuardianApi(params);
      if (guardianArticles.length > 0) return guardianArticles;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn('Guardian skipped:', msg);
      errors.push(`Guardian: ${msg}`);
    }

    try {
      const gnewsArticles = await this.tryGNews(params);
      if (gnewsArticles.length > 0) return gnewsArticles;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn('GNews skipped:', msg);
      errors.push(`GNews: ${msg}`);
    }

    try {
      const newsDataArticles = await this.tryNewsData(params);
      if (newsDataArticles.length > 0) return newsDataArticles;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn('Newsdata.io skipped:', msg);
      errors.push(`Newsdata.io: ${msg}`);
    }

    // All providers failed — check if it's all key issues (no keys configured at all)
    const allKeyIssues = errors.length > 0 && errors.every(e =>
      e.toLowerCase().includes('api key') ||
      e.toLowerCase().includes('configured or available') ||
      e.toLowerCase().includes('access_key') ||
      e.toLowerCase().includes('no newsapi') ||
      e.toLowerCase().includes('no mediastack') ||
      e.toLowerCase().includes('no the guardian') ||
      e.toLowerCase().includes('no gnews') ||
      e.toLowerCase().includes('no newsdata')
    );

    if (allKeyIssues) {
      // Do not crash the application if no API keys are provided –
      // scheduled updates and starters can still operate with empty results.
      console.warn(
        'No news API keys are configured. Returning empty article list.'
      );
      return [];
    }

    console.warn('All news APIs failed or returned no articles.');
    return [];
  }


  private newsApiCategoryMap: { [key: string]: string } = {
    technology: 'technology',
    business: 'business',
    sports: 'sports',
    health: 'health',
    science: 'science',
    entertainment: 'entertainment',
    general: 'general',
    politics: 'general',
    food: 'general',
    travel: 'general',
  };

  private async tryNewsApi(queryParams: NewsQueryParams): Promise<Article[]> {
    const newsApiSettings = apiConfig.news.newsapi;
    if (!newsApiSettings) throw new Error('NewsAPI configuration missing.');

    const apiKey = this.apiRotator.getNextAvailableKey('newsapi', newsApiSettings.keys);
    if (!apiKey) throw new Error('No NewsAPI key is configured or available. Please check NEWSAPI_KEY_1 in .env.local file.');

    const params = new URLSearchParams({
      apiKey,
      pageSize: '30',
    });

    const lang = 'en';

    let qStr = queryParams.query ? `${queryParams.query} India` : 'India';

    // Use /everything to thoroughly enforce keyword presence
    let endpoint = `${newsApiSettings.baseUrl}/everything`;
    params.append('q', qStr);
    params.append('sortBy', 'publishedAt');
    params.append('language', lang);

    if (queryParams.page && queryParams.page > 1) {
      params.append('page', queryParams.page.toString());
    }

    try {
      const response = await fetch(`${endpoint}?${params.toString()}`);
      const data: NewsApiResponse = await response.json();
      this.apiRotator.recordUsage('newsapi', apiKey);

      if (data.status !== 'ok' || !data.articles) {
        const errorMsg = `NewsAPI error: ${data.code || response.status} - ${data.message || 'Unknown error'}`;
        console.error(errorMsg);
        if (
          data.code === 'apiKeyInvalid' ||
          data.code === 'apiKeyDisabled' ||
          data.code === 'apiKeyExhausted' ||
          response.status === 401 ||
          response.status === 429
        ) {
          throw new Error(`NewsAPI key issue: ${data.message}. Please check NEWSAPI_KEY_1 in .env.local.`);
        }
        return [];
      }

      if (data.articles.length === 0) return [];

      const articles: Article[] = data.articles
        .filter(a => a.title && a.title !== '[Removed]')
        .slice(0, 21)
        .map((article, index) => ({
          id: article.url || `newsapi_${index}_${Date.now()}`,
          title: article.title || 'No title available',
          summary: article.description || article.content || 'No summary available',
          imageUrl: article.urlToImage || 'https://placehold.co/600x400.png',
          source: article.source.name || 'Unknown Source',
          category: queryParams.displayCategory,
          country: queryParams.displayCountry,
          publishedAt: article.publishedAt,
          url: article.url,
          aiHint: this.generateAiHint(queryParams.displayCategory, article.title || ''),
          originalProvider: 'newsapi.org',
          verified: Math.random() < 0.3,
        }));

      return this.sortArticlesByDate(articles);
    } catch (error) {
      console.error('Exception during NewsAPI fetch or processing:', error);
      if (error instanceof Error && error.message.includes('key issue')) {
        throw error;
      }
      return [];
    }
  }

  private async tryMediaStack(queryParams: NewsQueryParams): Promise<Article[]> {
    const mediaStackSettings = apiConfig.news.mediastack;
    if (!mediaStackSettings) throw new Error("Mediastack API configuration missing.");
    
    const apiKey = this.apiRotator.getNextAvailableKey('mediastack', mediaStackSettings.keys);
    if (!apiKey) throw new Error('No Mediastack API key is configured or available. Please check MEDIASTACK_KEY_... in .env file.');

    const params = new URLSearchParams({
      access_key: apiKey,
      limit: '25', 
      languages: 'en', 
      sort: 'published_desc',
    });

    if (queryParams.category && queryParams.category.toLowerCase() !== 'all' && queryParams.category.toLowerCase() !== 'general') {
      params.append('categories', queryParams.category.toLowerCase());
    } else if (queryParams.category?.toLowerCase() === 'general') {
        params.append('categories', 'general'); 
    }

    params.append('countries', 'in');
    let kStr = queryParams.query ? `${queryParams.query} India` : 'India';
    params.append('keywords', kStr);
    
    const offset = queryParams.page && queryParams.page > 1 ? (queryParams.page - 1) * 25 : 0;
    if (offset > 0) {
        params.append('offset', offset.toString());
    }


    try {
      const response = await fetch(`${mediaStackSettings.baseUrl}/news?${params.toString()}`);
      const data: MediaStackResponse = await response.json();
      this.apiRotator.recordUsage('mediastack', apiKey);

      if (data.error) {
        const errorMsg = `Mediastack API error: ${data.error.code} - ${data.error.message}`;
        console.error(errorMsg, data.error.context);
        if (data.error.code.includes('api_key') || data.error.code.includes('access_key') || data.error.code.includes('subscription') || data.error.message.toLowerCase().includes('api key') || data.error.code === 'missing_access_key') {
             throw new Error(`Mediastack API key issue: ${data.error.message}. Please check your MEDIASTACK_KEY_... in .env or your API plan limits.`);
        }
        return []; 
      }

      if (!data.data || data.data.length === 0) return [];

      const articles: Article[] = data.data.slice(0, 21).map((article, index) => ({
        id: article.url || `${article.source}_${index}_${new Date().getTime()}`,
        title: article.title || 'No title available',
        summary: article.description || 'No summary available',
        imageUrl: article.image || `https://placehold.co/600x400.png`,
        source: article.source || 'Unknown Source',
        category: queryParams.displayCategory, 
        country: queryParams.displayCountry,  
        publishedAt: article.published_at,
        url: article.url,
        aiHint: this.generateAiHint(queryParams.displayCategory, article.title || ""),
        originalProvider: 'mediastack.com',
        verified: Math.random() < 0.3, // Simulate verification
      }));
      return this.sortArticlesByDate(articles);
    } catch (error) {
        console.error('Exception during Mediastack fetch or processing:', error);
        if (error instanceof Error && error.message.includes("API key issue")) {
            throw error; 
        }
        return []; 
    }
  }
  
  private guardianCategoryMap: { [key: string]: string } = {
    technology: "technology",
    business: "business",
    sports: "sport", 
    health: "lifeandstyle/health-and-wellbeing", 
    science: "science",
    entertainment: "film", 
    politics: "politics",
    general: "world", 
  };

  private async tryGuardianApi(queryParams: NewsQueryParams): Promise<Article[]> {
    const guardianSettings = apiConfig.news.guardian;
    if (!guardianSettings) throw new Error("The Guardian API configuration missing.");

    const apiKey = this.apiRotator.getNextAvailableKey('guardian', guardianSettings.keys);
    if (!apiKey) throw new Error('No The Guardian API key is configured or available. Please check GUARDIAN_KEY_1 in .env file.');

    const params = new URLSearchParams({
      'api-key': apiKey,
      'show-fields': 'trailText,thumbnail,publication', 
      'page-size': '25', 
    });

    let queryStr = queryParams.query ? `${queryParams.query} India` : 'India';
    params.append('q', queryStr);
    
    if (queryParams.category && queryParams.category.toLowerCase() !== 'all' && queryParams.category.toLowerCase() !== 'global') {
      const guardianSection = this.guardianCategoryMap[queryParams.category.toLowerCase()] || queryParams.category.toLowerCase();
      params.append('section', guardianSection);
    }
    
    if (queryParams.page && queryParams.page > 1) {
        params.append('page', queryParams.page.toString());
    }

    try {
      const response = await fetch(`${guardianSettings.baseUrl}/search?${params.toString()}`);
      const data: GuardianResponse = await response.json();
      this.apiRotator.recordUsage('guardian', apiKey);

      if (data.response.status !== 'ok' || !data.response.results) {
        const errorMsg = `The Guardian API error: ${data.response.message || data.response.status}`;
        console.error(errorMsg, data);
        if (data.response.message?.toLowerCase().includes('key')) {
             throw new Error(`The Guardian API key issue: ${data.response.message}. Please check GUARDIAN_KEY_1 or your API plan.`);
        }
        return [];
      }

      if (data.response.results.length === 0) return [];

      const articles: Article[] = data.response.results.slice(0, 21).map(article => ({
        id: article.id,
        title: article.webTitle || 'No title available',
        summary: article.fields?.trailText || 'No summary available',
        imageUrl: article.fields?.thumbnail || `https://placehold.co/600x400.png`,
        source: article.sectionName || 'The Guardian',
        category: queryParams.displayCategory,
        country: queryParams.displayCountry,
        publishedAt: article.webPublicationDate,
        url: article.webUrl,
        aiHint: this.generateAiHint(queryParams.displayCategory, article.webTitle || ""),
        originalProvider: 'theguardian.com',
        verified: Math.random() < 0.3, // Simulate verification
      }));
      return this.sortArticlesByDate(articles);
    } catch (error) {
        console.error('Exception during The Guardian fetch or processing:', error);
         if (error instanceof Error && error.message.includes("API key issue")) {
            throw error;
        }
        return [];
    }
  }


  private gnewsCategoryMap: { [key: string]: string } = {
    technology: "technology",
    business: "business",
    sports: "sports",
    health: "health",
    science: "science",
    entertainment: "entertainment",
    general: "general",
    politics: "nation", 
    food: "general",
    travel: "general",
  };

  private async tryGNews(queryParams: NewsQueryParams): Promise<Article[]> {
    const gnewsSettings = apiConfig.news.gnews;
    if (!gnewsSettings) throw new Error("GNews API configuration missing.");
    
    const apiKey = this.apiRotator.getNextAvailableKey('gnews', gnewsSettings.keys);
    if (!apiKey) throw new Error('No GNews API key is configured or available. Please add GNEWS_API_KEY to your .env file.');

    const params = new URLSearchParams({ token: apiKey, lang: 'en', max: '25', sortby: 'publishedAt' });

    let endpoint = `${gnewsSettings.baseUrl}/search`; 
    params.append('q', queryParams.query ? `${queryParams.query} India` : 'India');

    params.append('country', 'in');
    
    try {
      const response = await fetch(`${endpoint}?${params.toString()}`);
      const data: GNewsResponse = await response.json();
      this.apiRotator.recordUsage('gnews', apiKey);

      if (!response.ok || (data.errors && data.errors.length > 0)) {
        const errorMessage = data.errors ? data.errors.join(", ") : `GNews API error: Status ${response.status}`;
        console.error('GNews API request failed details:', errorMessage, data);
        if (errorMessage.toLowerCase().includes('api key') || errorMessage.toLowerCase().includes('token') || response.status === 401 || response.status === 403) {
            throw new Error(`GNews API key issue: ${errorMessage}. Please check GNEWS_API_KEY or your API plan.`);
        }
        return [];
      }

      if (!data.articles || data.articles.length === 0) return [];

      const articles: Article[] = data.articles.slice(0, 21).map((article, index) => ({
        id: article.url || `${article.source.name}_${index}_${new Date().getTime()}`,
        title: article.title || 'No title available',
        summary: article.description || article.content || 'No summary available',
        imageUrl: article.image || `https://placehold.co/600x400.png`,
        source: article.source.name || 'Unknown Source',
        category: queryParams.displayCategory,
        country: queryParams.displayCountry,
        publishedAt: article.publishedAt,
        url: article.url,
        aiHint: this.generateAiHint(queryParams.displayCategory, article.title || ""),
        originalProvider: 'gnews.io',
        verified: Math.random() < 0.3, // Simulate verification
      }));
      return this.sortArticlesByDate(articles);
    } catch (error) {
      console.error('Exception during GNews fetch or processing:', error);
       if (error instanceof Error && error.message.includes("API key issue")) {
            throw error;
        }
      return [];
    }
  }
  
  private async tryNewsData(queryParams: NewsQueryParams): Promise<Article[]> {
    const newsDataSettings = apiConfig.news.newsdata;
    if (!newsDataSettings) throw new Error("Newsdata.io API configuration missing.");
    
    const apiKey = this.apiRotator.getNextAvailableKey('newsdata', newsDataSettings.keys);
    if (!apiKey) throw new Error('No Newsdata.io API key is configured or available. Please add NEWSDATA_API_KEY to your .env file.');

    const params = new URLSearchParams({
      apikey: apiKey,
      image: '1', 
      language: 'en', 
    });
    
    let newsdataCategoryParam = queryParams.category?.toLowerCase();
    if (newsdataCategoryParam === 'general' || newsdataCategoryParam === 'all' || !newsdataCategoryParam ) {
      newsdataCategoryParam = 'top';
    }
    params.append('category', newsdataCategoryParam);


    params.append('country', 'in');
    params.append('q', queryParams.query ? `${queryParams.query} India` : 'India');

    try {
      const response = await fetch(`${newsDataSettings.baseUrl}/news?${params.toString()}`);
      const data: NewsDataIOResponse = await response.json();
      this.apiRotator.recordUsage('newsdata', apiKey);

      if (!response.ok || data.status === 'error') {
        let errorMessage = `Newsdata.io API error: Status ${response.status}.`;
        if (data.results && typeof data.results === 'object' && !Array.isArray(data.results) && 'message' in (data.results as unknown as object)) {
            errorMessage = `Newsdata.io API error: ${(data.results as unknown as { message: string }).message}`;
        } else if (data.message) {
            errorMessage = `Newsdata.io API error: ${data.message}`;
        } else if (data.code) {
             errorMessage = `Newsdata.io API error code: ${data.code}`;
        }
        console.error('Newsdata.io API request failed details:', errorMessage, data);
        if (errorMessage.toLowerCase().includes('api key') || errorMessage.toLowerCase().includes('apikey') || (data.code && data.code.toLowerCase().includes('unauthorized'))) {
            throw new Error(`Newsdata.io API key issue: ${errorMessage}. Please check NEWSDATA_API_KEY or your API plan.`);
        }
        return [];
      }

      if (!data.results || data.results.length === 0) return [];

      const articles: Article[] = data.results.slice(0, 21).map((article) => ({
        id: article.article_id || article.link,
        title: article.title || 'No title available',
        summary: article.description || article.content || 'No summary available',
        imageUrl: article.image_url || `https://placehold.co/600x400.png`,
        source: article.source_id || 'Unknown Source',
        category: queryParams.displayCategory,
        country: queryParams.displayCountry,
        publishedAt: article.pubDate, 
        url: article.link,
        aiHint: this.generateAiHint(queryParams.displayCategory, article.title || ""),
        originalProvider: 'newsdata.io',
        verified: Math.random() < 0.3, // Simulate verification
      }));
      return this.sortArticlesByDate(articles);
    } catch (error) {
      console.error('Exception during Newsdata.io fetch or processing:', error);
      if (error instanceof Error && error.message.includes("API key issue")) {
            throw error;
      }
      return [];
    }
  }

  async fetchLocalNews(location: string): Promise<Article[]> {
    console.log('Fetching local news for:', location);
    return this.fetchNews({ displayCategory: `Local: ${location}`, displayCountry: location, query: `news in ${location}` });
  }

  async searchNews(query: string): Promise<Article[]> {
    console.log('Searching news for:', query);
    return this.fetchNews({ displayCategory: `Search: ${query.substring(0,15)}...`, displayCountry: 'Global', query });
  }

  async getNewsByCategory(category: string): Promise<Article[]> {
    console.log('Fetching news by category:', category);
    return this.fetchNews({ category, displayCategory: category, displayCountry: 'Global' });
  }
}
