"use client";

import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AvatarEditor() {
  const { user, updateUser } = useAuth();
  const [preview, setPreview] = useState<string | null>(user?.avatar || null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (preview && user) {
      // In a real app, you would upload the image to a server/storage
      // and get back a URL. Here, we're just using the base64 preview.
      updateUser({ avatar: preview });
      toast({ title: "Avatar Updated", description: "Your new avatar has been saved." });
    }
  };

  if (!user) return null;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Update Your Avatar</CardTitle>
        <CardDescription>Choose a new avatar to represent you on NewsWave.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            {preview ? (
              <Image 
                src={preview} 
                alt="Avatar preview" 
                width={128} 
                height={128} 
                className="rounded-full object-cover border-4 border-accent"
                data-ai-hint="person face"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-4 border-accent">
                <UploadCloud size={48} className="text-muted-foreground" />
              </div>
            )}
            <div>
              <Label htmlFor="avatar-upload" className="sr-only">Choose file</Label>
              <Input 
                id="avatar-upload" 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={!preview}>
            Save Avatar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}