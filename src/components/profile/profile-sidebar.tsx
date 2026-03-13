"use client";

import { useEffect, useState } from 'react';
import { useAuth, type User } from '@/contexts/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, BarChart2, Lightbulb, UserCircle } from "lucide-react";
import { suggestNewsCategory, type SuggestNewsCategoryOutput } from '@/ai/flows/suggest-news-category';
import { Button } from '../ui/button';

export default function ProfileSidebar() {
  const { user, loading: authLoading } = useAuth();
  const [aiSuggestion, setAiSuggestion] = useState<SuggestNewsCategoryOutput | null>(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const fetchSuggestion = async (currentUser: User) => {
    if (!currentUser.categoryClicks || Object.keys(currentUser.categoryClicks).length === 0) {
      setAiSuggestion({ suggestedCategory: "Explore!", reason: "Start exploring categories to get personalized suggestions." });
      return;
    }
    setSuggestionLoading(true);
    try {
      const suggestion = await suggestNewsCategory({ categoryClicks: currentUser.categoryClicks });
      setAiSuggestion(suggestion);
    } catch (error) {
      console.error("Failed to fetch AI suggestion:", error);
      setAiSuggestion({ suggestedCategory: "Error", reason: "Could not fetch suggestion." });
    } finally {
      setSuggestionLoading(false);
    }
  };
  
  useEffect(() => {
    if (user && !authLoading) {
      fetchSuggestion(user);
    }
  }, [user, authLoading]);


  if (authLoading || !user) {
    return (
      <div className="w-full md:w-80 lg:w-96 space-y-6">
        <Card className="shadow-lg">
          <CardHeader className="items-center text-center">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-6 w-3/4 mt-2" />
            <Skeleton className="h-4 w-1/2 mt-1" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-headline"><Lightbulb className="mr-2 text-accent" /> AI Suggestion</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="w-full md:w-80 lg:w-96 space-y-6 flex-shrink-0">
      <Card className="shadow-lg">
        <CardHeader className="items-center text-center">
          <Avatar className="h-24 w-24 border-4 border-primary ring-2 ring-primary-foreground">
            <AvatarImage src={user.avatar || `https://placehold.co/100x100.png`} alt={user.name} data-ai-hint="person face"/>
            <AvatarFallback className="text-4xl">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-semibold mt-3 font-headline">{user.name}</h2>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-md">
              <span className="flex items-center text-sm font-medium"><Award className="mr-2 text-primary" /> Verification Points</span>
              <span className="font-bold text-primary">{user.points || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-md">
              <span className="flex items-center text-sm font-medium"><BarChart2 className="mr-2 text-primary" /> Category Clicks</span>
              <span className="font-bold text-primary">{Object.values(user.categoryClicks || {}).reduce((sum, count) => sum + count, 0)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-headline"><Lightbulb className="mr-2 text-accent" /> AI Category Suggestion</CardTitle>
        </CardHeader>
        <CardContent>
          {suggestionLoading ? (
            <>
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </>
          ) : aiSuggestion ? (
            <>
              <h3 className="text-lg font-semibold text-primary">{aiSuggestion.suggestedCategory}</h3>
              <p className="text-sm text-muted-foreground mt-1">{aiSuggestion.reason}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No suggestion available yet. Start reading news to get one!</p>
          )}
           <Button variant="link" onClick={() => fetchSuggestion(user)} className="p-0 h-auto mt-2 text-accent" disabled={suggestionLoading}>
              {suggestionLoading ? "Refreshing..." : "Refresh Suggestion"}
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}