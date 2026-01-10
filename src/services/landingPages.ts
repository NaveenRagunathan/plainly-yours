import { supabase } from "@/integrations/supabase/client";

import type { LandingPage } from "@/types";

export const landingPageService = {
    async getLandingPages() {
        const { data, error } = await supabase
            .from("landing_pages")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        return data.map(p => ({
            id: p.id,
            userId: p.user_id,
            name: p.name,
            slug: p.slug,
            template: p.template as LandingPage['template'],
            headline: p.headline,
            subheadline: p.subheadline,
            buttonText: p.button_text,
            imageUrl: p.image_url,
            showFirstName: p.show_first_name,
            assignTag: p.assign_tag,
            assignSequenceId: p.assign_sequence_id,
            successMessage: p.success_message,
            redirectUrl: p.redirect_url,
            views: p.views,
            conversions: p.conversions,
            status: p.status as LandingPage['status'],
            createdAt: p.created_at,
            updatedAt: p.updated_at,
        }));
    },

    async getPublicPage(slug: string) {
        const { data, error } = await supabase
            .from("landing_pages")
            .select("*")
            .eq("slug", slug)
            .eq("status", "published")
            .single();

        if (error) throw error;
        return data;
    },

    async createLandingPage(page: Omit<LandingPage, "id" | "userId" | "createdAt" | "updatedAt" | "views" | "conversions">) {
        const { data: { user } } = await (supabase.auth as any).getUser();
        if (!user) throw new Error("Not authenticated");

        const { data, error } = await supabase
            .from("landing_pages")
            .insert({
                user_id: user.id,
                name: page.name,
                slug: page.slug,
                template: page.template,
                headline: page.headline,
                subheadline: page.subheadline,
                button_text: page.buttonText,
                image_url: page.imageUrl,
                show_first_name: page.showFirstName,
                assign_tag: page.assignTag,
                assign_sequence_id: page.assignSequenceId,
                success_message: page.successMessage,
                redirect_url: page.redirectUrl,
                status: page.status,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateLandingPage(id: string, updates: Partial<LandingPage>) {
        const dbUpdates: any = {};
        if (updates.name) dbUpdates.name = updates.name;
        if (updates.slug) dbUpdates.slug = updates.slug;
        if (updates.template) dbUpdates.template = updates.template;
        if (updates.headline) dbUpdates.headline = updates.headline;
        if (updates.subheadline) dbUpdates.subheadline = updates.subheadline;
        if (updates.buttonText) dbUpdates.button_text = updates.buttonText;
        if (updates.imageUrl) dbUpdates.image_url = updates.imageUrl;
        if (updates.showFirstName !== undefined) dbUpdates.show_first_name = updates.showFirstName;
        if (updates.assignTag) dbUpdates.assign_tag = updates.assignTag;
        if (updates.assignSequenceId) dbUpdates.assign_sequence_id = updates.assignSequenceId;
        if (updates.successMessage) dbUpdates.success_message = updates.successMessage;
        if (updates.redirectUrl) dbUpdates.redirect_url = updates.redirectUrl;
        if (updates.status) dbUpdates.status = updates.status;

        const { data, error } = await supabase
            .from("landing_pages")
            .update(dbUpdates)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteLandingPage(id: string) {
        const { error } = await supabase
            .from("landing_pages")
            .delete()
            .eq("id", id);

        if (error) throw error;
    },

    async recordView(slug: string) {
        const { error } = await supabase.rpc("increment_page_view", { page_slug: slug });
        // In v1 we can just do a direct update if RPC is missing
        if (error) {
            console.error("Failed to record view via RPC:", error);
        }
    }
};
