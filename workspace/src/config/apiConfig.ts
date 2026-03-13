
// config/apiConfig.ts

// Helper function to create the keys array for single key environment variables
function getApiKeys(envVar: string | undefined, placeholder: string): string[] {
  console.log(`[getApiKeys] Checking envVar for placeholder "${placeholder}": Value is "${envVar}"`); // DEBUG LOG
  if (envVar && envVar.trim() !== "" && envVar !== placeholder && envVar.length > 5) { // Basic length check and trim whitespace
    return [envVar.trim()];
  }
  return [];
}

// Helper function for multiple keys from environment variables like KEY_1, KEY_2, etc.
function getMultipleApiKeys(envVars: (string | undefined)[], placeholders: string[]): string[] {
  const validKeys: string[] = [];
  envVars.forEach((key, index) => {
    const placeholder = placeholders[index] || `YOUR_KEY_${index + 1}`; // Fallback placeholder
    console.log(`[getMultipleApiKeys] Checking envVar for placeholder "${placeholder}": Value is "${key}"`); // DEBUG LOG
    if (key && key.trim() !== "" && key !== placeholder && key.length > 5) {
      validKeys.push(key.trim());
    }
  });
  return validKeys;
}


export const apiConfig = {
  news: {
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
      rateLimit: 1000,
      priority: 1,
    },
    guardian: {
      keys: getApiKeys(process.env.GUARDIAN_KEY_1, "YOUR_GUARDIAN_KEY_1"),
      baseUrl: 'https://content.guardianapis.com',
      rateLimit: 5000,
      priority: 2,
    },
    gnews: {
      keys: getApiKeys(process.env.GNEWS_API_KEY, "YOUR_GNEWS_API_KEY"),
      baseUrl: 'https://gnews.io/api/v4',
      rateLimit: 100,
      priority: 3,
    },
    newsdata: {
      keys: getApiKeys(process.env.NEWSDATA_API_KEY, "YOUR_NEWSDATA_API_KEY_HERE"),
      baseUrl: 'https://newsdata.io/api/1',
      rateLimit: 500,
      priority: 4,
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
