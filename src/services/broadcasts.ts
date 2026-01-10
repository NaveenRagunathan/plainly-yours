import { supabase } from "@/integrations/supabase/client";
import type { Broadcast } from "@/types";

export const broadcastService = {
    async getBroadcasts() {
        const { data, error } = await supabase
            .from("broadcasts")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        return data.map(b => ({
            id: b.id,
            userId: b.user_id,
            subject: b.subject,
            body: b.body,
            status: b.status as Broadcast['status'],
            scheduledFor: b.scheduled_for || undefined,
            sentAt: b.sent_at || undefined,
            recipientFilter: (b.recipient_filter || {}) as Broadcast['recipientFilter'],
            stats: (b.stats || { sent: 0, opened: 0, clicked: 0, unsubscribed: 0, bounced: 0 }) as Broadcast['stats'],
            isABTest: b.is_ab_test || false,
            subjectB: b.subject_b || undefined,
            testSizePercent: b.test_size_percent || undefined,
            winnerMetric: b.winner_metric as Broadcast['winnerMetric'],
            waitTimeHours: b.wait_time_hours || undefined,
            createdAt: b.created_at,
            updatedAt: b.updated_at,
        }));
    },

    async createBroadcast(broadcast: Omit<Broadcast, "id" | "userId" | "createdAt" | "updatedAt" | "stats">) {
        const { data: { user } } = await (supabase.auth as any).getUser();
        if (!user) throw new Error("Not authenticated");

        const { data, error } = await supabase
            .from("broadcasts")
            .insert({
                user_id: user.id,
                subject: broadcast.subject,
                body: broadcast.body,
                status: broadcast.status,
                scheduled_for: broadcast.scheduledFor,
                recipient_filter: broadcast.recipientFilter as any,
                is_ab_test: broadcast.isABTest,
                subject_b: broadcast.subjectB,
                test_size_percent: broadcast.testSizePercent,
                winner_metric: broadcast.winnerMetric,
                wait_time_hours: broadcast.waitTimeHours,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateBroadcast(id: string, updates: Partial<Broadcast>) {
        const dbUpdates: any = {};
        if (updates.subject) dbUpdates.subject = updates.subject;
        if (updates.body) dbUpdates.body = updates.body;
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.scheduledFor) dbUpdates.scheduled_for = updates.scheduledFor;
        if (updates.recipientFilter) dbUpdates.recipient_filter = updates.recipientFilter;
        if (updates.isABTest !== undefined) dbUpdates.is_ab_test = updates.isABTest;
        if (updates.subjectB) dbUpdates.subject_b = updates.subjectB;
        if (updates.testSizePercent) dbUpdates.test_size_percent = updates.testSizePercent;
        if (updates.winnerMetric) dbUpdates.winner_metric = updates.winnerMetric;
        if (updates.waitTimeHours) dbUpdates.wait_time_hours = updates.waitTimeHours;

        const { data, error } = await supabase
            .from("broadcasts")
            .update(dbUpdates)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteBroadcast(id: string) {
        const { error } = await supabase
            .from("broadcasts")
            .delete()
            .eq("id", id);

        if (error) throw error;
    },

    async sendBroadcast(id: string) {
        // 1. Update broadcast to be scheduled "now"
        const { error: updateError } = await supabase
            .from("broadcasts")
            .update({
                status: 'scheduled',
                scheduled_for: new Date().toISOString()
            })
            .eq("id", id);

        if (updateError) throw updateError;

        // Note: The actual sending is now handled by the Node.js worker script (scripts/process-queue.js)
        // which should be running separately.
    },
};
