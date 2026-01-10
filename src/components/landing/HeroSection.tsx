import { Button } from "@/components/ui/button";
import { ArrowRight, Mail, Zap, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 py-20 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-cream -z-10" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />

      <div className="max-w-5xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-8 animate-fade-in">
          <Zap className="h-4 w-4" />
          <span>50-75% cheaper than Kit & MailerLite</span>
        </div>

        {/* Main headline */}
        <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight animate-fade-in-up">
          Email marketing that
          <span className="block text-primary">doesn't overthink it.</span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          Simple sequences. Reliable broadcasts. Predictable pricing.
          <span className="block mt-2">Built for creators who'd rather create than configure.</span>
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <Button
            variant="hero"
            size="xl"
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            className="group"
          >
            Start for $19/month
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Button>
          <Button
            variant="hero-outline"
            size="xl"
            onClick={() => navigate('/auth')}
          >
            See how it works
          </Button>
        </div>

        {/* Social proof */}
        <div className="flex flex-col items-center gap-4 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="flex -space-x-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 border-2 border-background flex items-center justify-center text-xs font-medium text-primary"
              >
                {String.fromCharCode(64 + i)}
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Join <span className="font-semibold text-foreground">1,200+</span> creators already using Plainly
          </p>
        </div>

        {/* Feature highlights */}
        <div className="grid sm:grid-cols-3 gap-8 mt-20 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Plain-text emails</h3>
            <p className="text-sm text-muted-foreground text-center">
              21% higher click rates. No design needed.
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Linear sequences</h3>
            <p className="text-sm text-muted-foreground text-center">
              Simple automations. No flowchart nightmares.
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Flat pricing</h3>
            <p className="text-sm text-muted-foreground text-center">
              Know your costs. Scale without surprises.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
