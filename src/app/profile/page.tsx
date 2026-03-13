"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import ProfileSidebar from '@/components/profile/profile-sidebar';
import AvatarEditor from '@/components/profile/avatar-editor';
import RewardsSection from '@/components/profile/rewards-section';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCog, Award, Camera } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/profile');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <Skeleton className="w-full md:w-80 lg:w-96 h-[500px] rounded-lg" />
          <div className="flex-grow space-y-8">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-headline font-bold text-primary neu-brutal-header">Your Profile</h1>
        <p className="text-lg text-muted-foreground mt-1">Manage your NewsMania account and preferences.</p>
      </header>
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <ProfileSidebar />
        <div className="flex-grow space-y-8 w-full">
          <Tabs defaultValue="account" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 mb-6 neu-brutal bg-card">
              <TabsTrigger value="account" className="font-medium neu-brutal-hover data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none">
                <UserCog className="mr-2 h-4 w-4" /> Account
              </TabsTrigger>
              <TabsTrigger value="avatar" className="font-medium neu-brutal-hover data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none">
                <Camera className="mr-2 h-4 w-4" /> Avatar
              </TabsTrigger>
              <TabsTrigger value="rewards" className="font-medium neu-brutal-hover data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none">
                <Award className="mr-2 h-4 w-4" /> Rewards
              </TabsTrigger>
            </TabsList>
            <TabsContent value="account">
              <Card className="neu-brutal shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-headline">Account Details</CardTitle>
                  <CardDescription>View and manage your account information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold">Name</h4>
                    <p className="text-muted-foreground">{user.name}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Email</h4>
                    <p className="text-muted-foreground">{user.email}</p>
                  </div>
                  {/* Add more account settings fields here if needed */}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="avatar">
              <AvatarEditor />
            </TabsContent>
            <TabsContent value="rewards">
              <RewardsSection />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
