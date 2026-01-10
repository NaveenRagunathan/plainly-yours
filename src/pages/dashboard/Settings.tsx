import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

import { useAuth } from "@/hooks/useAuth";

export default function SettingsPage() {
  const { user, updateProfile, isUpdating, createCheckoutSession, isCheckingOut } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || "");

  const handleSave = () => {
    if (user) {
      updateProfile({ name }, {
        onSuccess: () => toast({ title: "Settings saved!" }),
        onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" }),
      });
    }
  };

  const handleUpgrade = (planId: string) => {
    createCheckoutSession(planId);
  };

  const planInfo = {
    starter: { name: "Starter", price: "$19/month", limit: "5,000 subscribers" },
    growth: { name: "Growth", price: "$39/month", limit: "25,000 subscribers" },
    lifetime: { name: "Lifetime", price: "$49 one-time", limit: "2,000 subscribers" },
  };

  const currentPlan = user ? planInfo[user.plan] : null;

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <div className="p-6 rounded-xl border border-border bg-card">
        <h2 className="text-lg font-semibold text-foreground mb-6">Profile</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email || ""} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Plan */}
      <div className="p-6 rounded-xl border border-border bg-card">
        <h2 className="text-lg font-semibold text-foreground mb-6">Your Plan</h2>
        {currentPlan && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className="bg-primary text-primary-foreground">{currentPlan.name}</Badge>
                <span className="text-foreground font-medium">{currentPlan.price}</span>
              </div>
              {user?.plan !== 'lifetime' && (
                <Button
                  onClick={() => handleUpgrade('lifetime')}
                  disabled={isCheckingOut}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isCheckingOut ? "Preparing Checkout..." : "Upgrade to Lifetime"}
                </Button>
              )}
            </div>
            <div className="p-4 rounded-lg bg-accent/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Subscriber limit</span>
                <span className="text-sm font-medium text-foreground">{currentPlan.limit}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      ((user?.subscriberLimit || 0) > 0
                        ? (5 / (user?.subscriberLimit || 1)) * 100
                        : 0),
                      100
                    )}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Using 5 of {user?.subscriberLimit?.toLocaleString()} subscribers
              </p>
            </div>
            {user?.plan === 'starter' && (
              <p className="text-sm text-muted-foreground">
                Want to remove monthly limits? Upgrade to Lifetime for a one-time fee.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="p-6 rounded-xl border border-destructive/30 bg-destructive/5">
        <h2 className="text-lg font-semibold text-destructive mb-4">Danger Zone</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <Button variant="destructive">Delete Account</Button>
      </div>
    </div>
  );
}
