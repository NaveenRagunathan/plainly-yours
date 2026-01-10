import { supabase } from "@/integrations/supabase/client";
import type { User, PricingTier } from "@/types";

export const authService = {
    async signUp(email: string, password: string, name: string, plan: PricingTier['id']) {
        const { data, error } = await (supabase.auth as any).signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    plan,
                },
                emailRedirectTo: window.location.origin,
            },
        });

        if (error) throw error;
        return data;
    },

    async signIn(email: string, password: string) {
        const { data, error } = await (supabase.auth as any).signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
        return data;
    },

    async signOut() {
        const { error } = await (supabase.auth as any).signOut();
        if (error) throw error;
    },

    async getCurrentUser(): Promise<User | null> {
        const { data: { user } } = await (supabase.auth as any).getUser();
        if (!user) return null;

        const { data: profile, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

        if (error) throw error;

        return {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            plan: profile.plan as User['plan'],
            subscriberLimit: profile.subscriber_limit,
            createdAt: profile.created_at,
            updatedAt: profile.updated_at,
        };
    },

    async updateProfile(updates: Partial<User>) {
        const { data: { user } } = await (supabase.auth as any).getUser();
        if (!user) throw new Error("Not authenticated");

        const profileUpdates: any = {};
        if (updates.name) profileUpdates.name = updates.name;
        if (updates.plan) profileUpdates.plan = updates.plan;

        const { data, error } = await supabase
            .from("profiles")
            .update(profileUpdates)
            .eq("id", user.id)
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            email: data.email,
            name: data.name,
            plan: data.plan as User['plan'],
            subscriberLimit: data.subscriber_limit,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        };
    },

    async createCheckoutSession(planId: string) {
        const { data, error } = await supabase.functions.invoke("stripe-checkout", {
            body: {
                planId,
                origin: window.location.origin
            },
        });

        if (error) throw error;
        return data;
    },
};
