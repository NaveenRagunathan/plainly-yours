import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/stores/appStore";
import { ArrowLeft, Check, Mail, Lock, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { PricingTier } from "@/types";
import { authService } from "@/services/auth";

const planDetails: Record<PricingTier['id'], { name: string; price: number; billing: string }> = {
  free: { name: 'Free', price: 0, billing: '' },
  starter: { name: 'Starter', price: 19, billing: '/month' },
  lifetime: { name: 'Lifetime', price: 49, billing: '' },
};

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { selectedPlan, setUser, setSelectedPlan } = useAppStore();
  const [isLogin, setIsLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const plan = selectedPlan ? planDetails[selectedPlan] : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        await authService.signIn(formData.email, formData.password);
        const user = await authService.getCurrentUser();
        setUser(user);
        toast({
          title: "Welcome back!",
          description: "You've been logged in successfully.",
        });
        navigate('/dashboard');
      } else {
        const planId = selectedPlan || 'free';

        // For paid plans: create account first, then redirect to checkout
        if (planId !== 'free') {
          // Create account with 'free' plan initially
          await authService.signUp(
            formData.email,
            formData.password,
            formData.name,
            'free'  // Start as free, webhook will upgrade after payment
          );

          // Get the newly created user
          const user = await authService.getCurrentUser();
          setUser(user);

          toast({
            title: "Redirecting to payment...",
            description: `Complete your ${planDetails[planId].name} plan payment.`,
          });

          // Now that user is logged in, redirect to checkout
          const { url } = await authService.createCheckoutSession(planId);
          window.location.href = url;
          return;
        }

        // For free plan, create account and go to dashboard
        await authService.signUp(
          formData.email,
          formData.password,
          formData.name,
          'free'
        );

        const user = await authService.getCurrentUser();
        setUser(user);

        toast({
          title: "Account created!",
          description: "Your account is ready. Let's get started!",
        });

        navigate('/dashboard');
      }
    } catch (error: any) {
      toast({
        title: "Authentication failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-12">
        <div className="max-w-md w-full mx-auto">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="mb-8 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to home
          </Button>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-muted-foreground">
              {isLogin
                ? 'Enter your credentials to access your dashboard.'
                : 'Start sending emails that your audience actually reads.'}
            </p>
          </div>

          {/* Selected plan */}
          {plan && !isLogin && (
            <div className="mb-8 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Selected plan</p>
                  <p className="font-semibold text-foreground">{plan.name}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-foreground">${plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.billing}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 -ml-2 text-primary"
                onClick={() => {
                  setSelectedPlan(null);
                  navigate('/#pricing');
                }}
              >
                Change plan
              </Button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <span className="animate-pulse">Processing...</span>
              ) : isLogin ? (
                'Log in'
              ) : (
                <>
                  Create account
                  {plan && ` · $${plan.price}${plan.billing}`}
                </>
              )}
            </Button>
          </form>

          {/* Toggle */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-medium hover:underline"
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>

      {/* Right side - Features */}
      <div className="hidden lg:flex flex-1 bg-foreground text-background p-16 items-center justify-center">
        <div className="max-w-md">
          <h2 className="text-3xl font-bold mb-8">
            Everything you need to grow your email list.
          </h2>

          <ul className="space-y-6">
            {[
              { title: 'Simple sequences', desc: 'Linear automation that just works. No flowchart nightmares.' },
              { title: 'Plain-text emails', desc: 'Higher engagement, better deliverability, faster writing.' },
              { title: 'Predictable pricing', desc: 'Know your costs. No surprise charges as you grow.' },
              { title: 'Landing pages', desc: 'Capture subscribers with beautiful, hosted pages.' },
            ].map((feature) => (
              <li key={feature.title} className="flex gap-4">
                <div className="shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-background/70 text-sm">{feature.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
