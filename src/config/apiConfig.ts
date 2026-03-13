// config/apiConfig.ts

/** Returns true if the value looks like an unfilled placeholder */
function isPlaceholder(value: string): boolean {
  const v = value.trim().toLowerCase();
  return (
    v === '' ||
    v.startsWith('your_') ||
    v.startsWith('placeholder') ||
    v === 'changeme' ||
    v === 'xxx'
  );
}

// Helper function to create the keys array for single key environment variables
function getApiKeys(envVar: string | undefined, _placeholder: string): string[] {
  if (envVar && envVar.trim() !== '' && envVar.length > 5 && !isPlaceholder(envVar)) {
    return [envVar.trim()];
  }
  return [];
}

// Helper function for multiple keys from environment variables like KEY_1, KEY_2, etc.
function getMultipleApiKeys(envVars: (string | undefined)[], _placeholders: string[]): string[] {
  const validKeys: string[] = [];
  envVars.forEach((key) => {
    if (key && key.trim() !== '' && key.length > 5 && !isPlaceholder(key)) {
      validKeys.push(key.trim());
    }
  });
  return validKeys;
}


export const apiConfig = {
  news: {
    newsapi: {
      keys: getMultipleApiKeys(
        [
          process.env.NEWSAPI_KEY_1,
          process.env.NEWSAPI_KEY_2,
        ],
        [
          "YOUR_NEWSAPI_KEY_1",
          "YOUR_NEWSAPI_KEY_2",
        ]
      ),
      baseUrl: 'https://newsapi.org/v2',
      rateLimit: 100, // Free tier: 100 req/day
      priority: 1,
    },
    mediastack: {
      keys: getMultipleApiKeys(
        [
          process.env.MEDIASTACK_KEY_1,
          process.env.MEDIASTACK_KEY_2,
          process.env.MEDIASTACK_KEY_3,
        ],
        [
          "YOUR_MEDIASTACK_KEY_1",
          "YOUR_MEDIASTACK_KEY_2",
          "YOUR_MEDIASTACK_KEY_3",
        ]
      ),
      baseUrl: 'https://api.mediastack.com/v1',
      rateLimit: 1000, // Review for production
      priority: 2,
    },
    guardian: {
      keys: getApiKeys(process.env.GUARDIAN_KEY_1, "YOUR_GUARDIAN_KEY_1"),
      baseUrl: 'https://content.guardianapis.com',
      rateLimit: 5000, // Review for production
      priority: 3,
    },
    gnews: {
      keys: getApiKeys(process.env.GNEWS_API_KEY, "YOUR_GNEWS_API_KEY"),
      baseUrl: 'https://gnews.io/api/v4',
      rateLimit: 100, // Review for production
      priority: 4,
    },
    newsdata: {
      keys: getApiKeys(process.env.NEWSDATA_API_KEY, "YOUR_NEWSDATA_API_KEY_HERE"),
      baseUrl: 'https://newsdata.io/api/1',
      rateLimit: 500, // Review for production
      priority: 5,
    },
  },
  ai: {
    openai: {
      key: process.env.OPENAI_API_KEY!, // Keep ! as these are not array-based like news keys
      model: 'gpt-4',
      maxTokens: 150,
    },
    anthropic: {
      key: process.env.ANTHROPIC_API_KEY!,
      model: 'claude-3-sonnet-20240229',
    },
  },
  search: {
    google: {
      key: process.env.GOOGLE_SEARCH_KEY!,
      cx: process.env.GOOGLE_SEARCH_CX!,
    },
    bing: {
      key: process.env.BING_SEARCH_KEY!,
    },
  },
  location: {
    google: {
      key: process.env.GOOGLE_PLACES_KEY!,
    },
  },
};
