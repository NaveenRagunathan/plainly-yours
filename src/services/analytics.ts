import { supabase } from "@/integrations/supabase/client";
import type { AnalyticsOverview, SubscriberGrowthPoint } from "@/types";

export const analyticsService = {
    async getOverview(): Promise<AnalyticsOverview> {
        const { data: { user } } = await (supabase.auth as any).getUser();
        if (!user) throw new Error("Not authenticated");

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Get total active subscribers
        const { count: totalSubscribers } = await supabase
            .from("subscribers")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("status", "active");

        // Subscribers added last 7 days
        const { count: subs7 } = await supabase
            .from("subscribers")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .gte("created_at", sevenDaysAgo.toISOString());

        // Subscribers added last 30 days
        const { count: subs30 } = await supabase
            .from("subscribers")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .gte("created_at", thirtyDaysAgo.toISOString());

        // Broadcast stats
        const { data: broadcasts } = await supabase
            .from("broadcasts")
            .select("stats")
            .eq("user_id", user.id)
            .eq("status", "sent");

        let totalSent = 0;
        let totalOpened = 0;
        let totalClicked = 0;

        broadcasts?.forEach(b => {
            const stats = (b.stats || {}) as any;
            totalSent += stats.sent || 0;
            totalOpened += stats.opened || 0;
            totalClicked += stats.clicked || 0;
        });

        return {
            totalSubscribers: totalSubscribers || 0,
            subscribersAddedLast7Days: subs7 || 0,
            subscribersAddedLast30Days: subs30 || 0,
            emailsSentLast7Days: 0, // Simplified for MVP
            emailsSentLast30Days: totalSent,
            averageOpenRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
            averageClickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
        };
    },

    async getSubscriberGrowth(): Promise<SubscriberGrowthPoint[]> {
        const { data: { user } } = await (supabase.auth as any).getUser();
        if (!user) throw new Error("Not authenticated");

        // Simplified growth logic for MVP: just get daily counts for last 30 days
        const { data, error } = await supabase
            .from("subscribers")
            .select("created_at")
            .eq("user_id", user.id)
            .eq("status", "active")
            .order("created_at", { ascending: true });

        if (error) throw error;

        const points: SubscriberGrowthPoint[] = [];
        const now = new Date();

        for (let i = 29; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            const count = data.filter(s => new Date(s.created_at) <= date).length;
            points.push({ date: dateStr, count });
        }

        return points;
    }
};
