"use client";

import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface Reward {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
}

const availableRewards: Reward[] = [
  { id: '1', name: 'Bronze Contributor Badge', description: 'Show off your early contributions!', pointsRequired: 50 },
  { id: '2', name: 'Silver Verifier Trophy', description: 'Recognized for verifying multiple articles.', pointsRequired: 200 },
  { id: '3', name: 'Gold NewsHound Medal', description: 'Top-tier status for dedicated users.', pointsRequired: 500 },
];

export default function RewardsSection() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [claimedRewards, setClaimedRewards] = useState<Set<string>>(new Set()); // In real app, this would be part of user data

  const handleClaimReward = (reward: Reward) => {
    if (!user) return;

    if (user.points >= reward.pointsRequired) {
      // Simulate claiming reward
      updateUser({ points: user.points - reward.pointsRequired });
      setClaimedRewards(prev => new Set(prev).add(reward.id));
      toast({ title: "Reward Claimed!", description: `You've claimed the ${reward.name}.` });
    } else {
      toast({ variant: "destructive", title: "Not Enough Points", description: `You need ${reward.pointsRequired - user.points} more points for ${reward.name}.` });
    }
  };

  if (!user) return null;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Claim Your Rewards</CardTitle>
        <CardDescription>Use your verification points to unlock exclusive rewards.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {availableRewards.map((reward) => {
          const isClaimed = claimedRewards.has(reward.id);
          const canClaim = user.points >= reward.pointsRequired && !isClaimed;
          return (
            <Card key={reward.id} className={`p-4 flex flex-col sm:flex-row justify-between items-center ${isClaimed ? 'bg-muted/50' : ''}`}>
              <div className="flex-grow mb-4 sm:mb-0">
                <h3 className="text-lg font-semibold flex items-center">
                  <Gift className={`mr-2 h-5 w-5 ${isClaimed ? 'text-muted-foreground' : 'text-accent'}`} />
                  {reward.name}
                </h3>
                <p className={`text-sm ${isClaimed ? 'text-muted-foreground' : 'text-card-foreground'}`}>{reward.description}</p>
                <p className={`text-xs font-medium ${isClaimed ? 'text-muted-foreground' : 'text-primary'}`}>
                  Cost: {reward.pointsRequired} points
                </p>
              </div>
              <Button 
                onClick={() => handleClaimReward(reward)} 
                disabled={!canClaim || isClaimed}
                className={isClaimed ? 'bg-green-500 hover:bg-green-600' : ''}
              >
                {isClaimed ? <><Check className="mr-2 h-4 w-4" /> Claimed</> : 'Claim Reward'}
              </Button>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}