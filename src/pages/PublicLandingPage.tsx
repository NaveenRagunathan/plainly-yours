import { useParams } from "react-router-dom";
import { usePublicLandingPage } from "@/hooks/useLandingPages";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function PublicLandingPage() {
    const { slug } = useParams();
    const { data: page, isLoading, error } = usePublicLandingPage(slug || "");
    const [formData, setFormData] = useState({ email: "", firstName: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { toast } = useToast();

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (error || !page) {
        return <div className="min-h-screen flex items-center justify-center text-destructive">Page not found or unavailable.</div>;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { error } = await supabase.from("subscribers").insert({
                user_id: page.user_id,
                email: formData.email,
                first_name: formData.firstName || null,
                tags: page.assign_tag ? [page.assign_tag] : [],
                current_sequence_id: page.assign_sequence_id || null,
                status: "active",
            });

            if (error) throw error;

            // Update conversions
            await supabase.rpc('increment_page_conversion', { page_id: page.id });

            setIsSubmitted(true);
            toast({ title: "Success!", description: page.success_message });

            if (page.redirect_url) {
                window.location.href = page.redirect_url;
            }
        } catch (err: any) {
            toast({
                title: "Registration failed",
                description: err.message,
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
            <div className="max-w-xl w-full text-center space-y-8">
                <div className="space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                        {page.headline}
                    </h1>
                    {page.subheadline && (
                        <p className="text-xl text-muted-foreground">{page.subheadline}</p>
                    )}
                </div>

                {isSubmitted ? (
                    <div className="p-8 rounded-2xl bg-primary/5 border border-primary/20 text-center animate-in fade-in zoom-in duration-300">
                        <h2 className="text-2xl font-bold text-primary mb-2">Check your inbox!</h2>
                        <p className="text-muted-foreground">{page.success_message}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 p-8 rounded-2xl bg-card border border-border shadow-lg">
                        {page.show_first_name && (
                            <div className="space-y-2 text-left">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                    id="firstName"
                                    placeholder="Your name"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                />
                            </div>
                        )}
                        <div className="space-y-2 text-left">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                required
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <Button type="submit" size="lg" className="w-full text-lg h-12" disabled={isSubmitting}>
                            {isSubmitting ? "Processing..." : page.button_text}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                            By subscribing, you agree to receive emails from us. Unsubscribe anytime.
                        </p>
                    </form>
                )}

                <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                    <span>Powered by</span>
                    <div className="flex items-center gap-1 font-semibold text-foreground">
                        <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
                            <span className="text-primary-foreground text-[10px]">P</span>
                        </div>
                        Plainly
                    </div>
                </div>
            </div>
        </div>
    );
}
