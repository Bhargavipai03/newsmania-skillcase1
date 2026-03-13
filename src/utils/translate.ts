/**
 * translate.ts
 * Reliable free translation using Google Translate API (client=gtx) with a queue to avoid 429 Too Many Requests.
 */

export type Language = 'en' | 'de';

const CACHE = new Map<string, Map<Language, string>>();

// A simple queue to prevent hammering the Google Translate API all at once.
let queuePromise: Promise<void> = Promise.resolve();

/**
 * Translate text from English (or provided source) to target language
 * @param text The text to translate
 * @param targetLang Target language code (default: 'de')
 * @param sourceLang Source language code (default: 'en')
 * @returns Translated text or original if translation fails
 */
export async function translate(
  text: string,
  targetLang: Language = 'de',
  sourceLang: string = 'en'
): Promise<string> {
  if (!text || text.trim() === '') return text;

  // Check cache
  const cacheKey = `${sourceLang}-${text}`;
  if (CACHE.has(cacheKey)) {
    const langCache = CACHE.get(cacheKey)!;
    if (langCache.has(targetLang)) {
      return langCache.get(targetLang)!;
    }
  }

  // Enqueue the request
  const execute = async () => {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
      const res = await fetch(url, { cache: 'force-cache' });
      if (!res.ok) return text;
      
      const json = await res.json();
      
      let translated = '';
      if (json && json[0]) {
        json[0].forEach((part: any) => {
          if (part[0]) translated += part[0];
        });
      }

      if (!translated) {
        translated = text;
      }
      
      if (!CACHE.has(cacheKey)) {
        CACHE.set(cacheKey, new Map());
      }
      CACHE.get(cacheKey)!.set(targetLang, translated);
      
      return translated;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  };

  const resultPromise = queuePromise.then(() => execute());
  // Chain the queue so multiple requests run safely quickly
  queuePromise = resultPromise.then(() => {}).catch(() => {});
  
  return resultPromise;
}

/**
 * Legacy function for backward compatibility
 */
export async function translateToGerman(text: string): Promise<string> {
  return translate(text, 'de', 'en');
}

/**
 * Translate an array of strings in parallel gently
 */
export async function translateBatch(
  texts: string[],
  targetLang: Language = 'de',
  sourceLang: string = 'en'
): Promise<string[]> {
  const results: string[] = [];
  for (const t of texts) {
    results.push(await translate(t, targetLang, sourceLang));
  }
  return results;
}

