import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/stores/appStore";
import type { PricingTier } from "@/types";

const pricingTiers: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    billing: 'monthly',
    subscriberLimit: 100,
    features: [
      'Up to 100 subscribers',
      '100/day broadcasts',
      '1 sequence',
      'Landing pages',
      'Basic analytics',
      'Community support',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 19,
    billing: 'monthly',
    subscriberLimit: 25000,
    features: [
      'Up to 25,000 subscribers',
      'Everything in Free',
      'Priority email support',
      'A/B testing',
      'Advanced analytics',
      'Unlimited automation',
    ],
    popular: true,
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    price: 49,
    billing: 'one-time',
    subscriberLimit: 100000,
    features: [
      'Up to 100,000 subscribers',
      'Everything in Starter',
      'Dedicated support',
      'Custom integrations',
      'White-label options',
      'Pay once, use forever',
    ],
  },
];

export function PricingSection() {
  const navigate = useNavigate();
  const setSelectedPlan = useAppStore((state) => state.setSelectedPlan);

  const handleSelectPlan = (planId: PricingTier['id']) => {
    setSelectedPlan(planId);
    navigate('/auth');
  };

  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Simple, predictable pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            No hidden fees. No usage-based surprises. Pick a plan and focus on creating.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {pricingTiers.map((tier, index) => (
            <div
              key={tier.id}
              className={`relative rounded-2xl p-8 transition-all duration-300 animate-fade-in-up ${tier.popular
                ? 'bg-foreground text-background shadow-2xl scale-105 z-10'
                : 'bg-card border border-border shadow-lg hover:shadow-xl hover:-translate-y-1'
                }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className={`text-xl font-semibold mb-2 ${tier.popular ? 'text-background' : 'text-foreground'}`}>
                  {tier.name}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className={`text-5xl font-bold ${tier.popular ? 'text-background' : 'text-foreground'}`}>
                    ${tier.price}
                  </span>
                  <span className={tier.popular ? 'text-background/70' : 'text-muted-foreground'}>
                    {tier.billing === 'monthly' ? '/mo' : ' one-time'}
                  </span>
                </div>
                <p className={`text-sm mt-2 ${tier.popular ? 'text-background/70' : 'text-muted-foreground'}`}>
                  Up to {tier.subscriberLimit.toLocaleString()} subscribers
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className={`h-5 w-5 shrink-0 mt-0.5 ${tier.popular ? 'text-primary' : 'text-primary'}`} />
                    <span className={`text-sm ${tier.popular ? 'text-background/90' : 'text-foreground'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSelectPlan(tier.id)}
                variant={tier.popular ? 'hero' : 'outline'}
                size="lg"
                className={`w-full group ${tier.popular
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : ''
                  }`}
              >
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-12">
          All plans include SSL hosting, unlimited emails, and 24-hour support response time.
        </p>
      </div>
    </section>
  );
}
