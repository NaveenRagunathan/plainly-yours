import { supabase } from "@/integrations/supabase/client";
import type { Subscriber } from "@/types";

export const subscriberService = {
    async getSubscribers() {
        const { data, error } = await supabase
            .from("subscribers")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        return data.map(s => ({
            id: s.id,
            userId: s.user_id,
            email: s.email,
            firstName: s.first_name || undefined,
            tags: s.tags || [],
            status: s.status as Subscriber['status'],
            currentSequenceId: s.current_sequence_id || undefined,
            currentSequenceStep: s.current_sequence_step || undefined,
            createdAt: s.created_at,
            updatedAt: s.updated_at,
        }));
    },

    async createSubscriber(subscriber: Omit<Subscriber, "id" | "userId" | "createdAt" | "updatedAt">) {
        const { data: { user } } = await (supabase.auth as any).getUser();
        if (!user) throw new Error("Not authenticated");

        const { data, error } = await supabase
            .from("subscribers")
            .insert({
                user_id: user.id,
                email: subscriber.email,
                first_name: subscriber.firstName,
                tags: subscriber.tags,
                status: subscriber.status,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateSubscriber(id: string, updates: Partial<Subscriber>) {
        const dbUpdates: any = {};
        if (updates.email) dbUpdates.email = updates.email;
        if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
        if (updates.tags) dbUpdates.tags = updates.tags;
        if (updates.status) dbUpdates.status = updates.status;

        const { data, error } = await supabase
            .from("subscribers")
            .update(dbUpdates)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteSubscriber(id: string) {
        const { error } = await supabase
            .from("subscribers")
            .delete()
            .eq("id", id);

        if (error) throw error;
    },

    async importSubscribers(subscribers: Array<{ email: string; firstName?: string; tags?: string[] }>) {
        const { data: { user } } = await (supabase.auth as any).getUser();
        if (!user) throw new Error("Not authenticated");

        const batch = subscribers.map(s => ({
            user_id: user.id,
            email: s.email,
            first_name: s.firstName || null,
            tags: s.tags || [],
            status: "active" as any,
        }));

        const { data, error } = await supabase
            .from("subscribers")
            .upsert(batch, { onConflict: "user_id,email" })
            .select();

        if (error) throw error;
        return data;
    },

    async getActiveCount() {
        const { count, error } = await supabase
            .from("subscribers")
            .select("*", { count: "exact", head: true })
            .eq("status", "active");

        if (error) throw error;
        return count || 0;
    }
};
