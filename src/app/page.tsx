"use client";

import { useState, useEffect, useCallback } from 'react';
import NewsArticleCard from '@/components/news/news-article-card';
import type { Article as NewsArticleType } from '@/services/newsService';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { fetchNewsArticles } from '@/actions/newsActions';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Globe } from "lucide-react";
import { useAuth } from '@/contexts/auth-context';
import { useScheduledNewsUpdate } from '@/hooks/use-scheduled-news-update';
import { useLanguage } from '@/contexts/language-context';

export default function DashboardPage() {
  const [articles, setArticles] = useState<NewsArticleType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();

  // Load the exactly requested 10 articles
  const loadContent = useCallback(async () => {
    setIsLoading(true);
    setApiKeyError(null);
    try {
      // Fetch 2 Entertainment
      const entP = fetchNewsArticles('entertainment cinema movies India', 'in', 'Kino', 'India', user?.categoryClicks, true, 1);
      // Fetch 2 Trending on Social
      const trendP = fetchNewsArticles('viral social media trending Instagram India', 'in', 'Insta-Trend', 'India', user?.categoryClicks, true, 1);
      // Fetch 3 General
      const genP = fetchNewsArticles('latest top news India', 'in', 'General', 'India', user?.categoryClicks, true, 1);
      // Fetch 2 Sports
      const sportP = fetchNewsArticles('sports cricket India', 'in', 'Cricket', 'India', user?.categoryClicks, true, 1);
      // Fetch 1 Hospital / Medical (Nursing)
      const medP = fetchNewsArticles('hospital nurses medical staff health India', 'in', 'Skillcase', 'India', user?.categoryClicks, true, 1);

      const [entResults, trendResults, genResults, sportResults, medResults] = await Promise.allSettled([entP, trendP, genP, sportP, medP]);

      const getSafe = (res: PromiseSettledResult<NewsArticleType[]>, count: number) => 
        res.status === 'fulfilled' ? res.value.slice(0, count) : [];

      const combined: NewsArticleType[] = [
        ...getSafe(entResults, 2),
        ...getSafe(trendResults, 2),
        ...getSafe(genResults, 3),
        ...getSafe(sportResults, 2),
        ...getSafe(medResults, 1),
      ];

      setArticles(combined);
      
      // Check for errors if absolutely zero articles returned
      if (combined.length === 0) {
        setApiKeyError("No news could be loaded. Please check API keys.");
      }
    } catch (error) {
      console.error("Failed to fetch news articles:", error);
      setApiKeyError(error instanceof Error ? error.message : "Could not load news.");
      setArticles([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // Set up scheduled update at 12 PM daily
  useScheduledNewsUpdate({
    updateHour: 12, // 12 PM (noon)
    onUpdateTime: loadContent,
  });

  // Current date formatting for German
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = today.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', options);

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto pt-6 relative px-4 sm:px-0">
      
      {/* ── Language Toggle Top Right ── */}
      <div className="absolute top-0 right-4 sm:right-0">
        <button
          onClick={() => setLanguage(language === 'de' ? 'en' : 'de')}
          className="flex items-center gap-2 bg-card border border-gray-700 hover:border-gray-500 rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
        >
          <Globe size={16} />
          {language === 'de' ? 'EN / DE' : 'DE / EN'}
        </button>
      </div>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="text-center mb-10 pt-8 sm:pt-0">
        <div className="flex justify-center items-center gap-3 mb-3">
          <div className="bg-gray-800 rounded mx-auto p-1.5 inline-block sm:hidden">
            <span className="text-xl">📰</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary">
            {language === 'de' ? 'Deutsche Nachrichten' : 'German News'}
          </h1>
        </div>
        <p className="text-muted-foreground text-sm md:text-base flex items-center justify-center gap-2">
          <span>✨</span> {language === 'de' ? 'Heute:' : 'Today:'} {formattedDate}
        </p>
      </div>

      {/* ── API error ────────────────────────────────────────────────── */}
      {apiKeyError && (
        <Alert variant="destructive" className="mb-6 bg-red-900/50 border-red-500 text-white">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="font-bold">API Configuration Error!</AlertTitle>
          <AlertDescription>
            {apiKeyError} <br />
            Please set at least one API key in your <code>.env.local</code> file.
          </AlertDescription>
        </Alert>
      )}

      {/* ── Article grid ─────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-card border-none rounded-2xl p-0 flex flex-col justify-between min-h-[350px] overflow-hidden">
              <Skeleton className="h-[200px] w-full bg-muted/50 rounded-none" />
              <div className="p-5 flex flex-col gap-3">
                <Skeleton className="h-6 w-3/4 mb-2 bg-muted/50" />
                <Skeleton className="h-4 w-full mb-1 bg-muted/50" />
                <Skeleton className="h-4 w-3/4 mb-3 bg-muted/50" />
              </div>
            </Card>
          ))}
        </div>
      ) : articles.length === 0 && !apiKeyError ? (
        <div className="bg-card/50 text-white p-6 md:p-8 text-center rounded-2xl border border-border">
          <h2 className="text-2xl font-bold">No articles found.</h2>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {articles.map((article, idx) => (
            <div key={article.id} className="relative group h-full">
              <NewsArticleCard article={article} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
