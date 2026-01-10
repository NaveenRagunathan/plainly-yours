import { supabase } from "@/integrations/supabase/client";
import type { Sequence, SequenceStep } from "@/types";

export const sequenceService = {
    async getSequences() {
        const { data, error } = await supabase
            .from("sequences")
            .select("*, sequence_steps(*)")
            .order("created_at", { ascending: false });

        if (error) throw error;

        return data.map(s => ({
            id: s.id,
            userId: s.user_id,
            name: s.name,
            status: s.status as Sequence['status'],
            steps: (s.sequence_steps as any[]).map((st: any) => ({
                id: st.id,
                sequenceId: st.sequence_id,
                order: st.order,
                delayHours: st.delay_hours,
                subject: st.subject,
                body: st.body,
                createdAt: st.created_at,
                updatedAt: st.updated_at,
            })).sort((a: any, b: any) => a.order - b.order),
            enrolledCount: s.enrolled_count || 0,
            completedCount: s.completed_count || 0,
            createdAt: s.created_at,
            updatedAt: s.updated_at,
        }));
    },

    async createSequence(sequence: Omit<Sequence, "id" | "userId" | "createdAt" | "updatedAt" | "enrolledCount" | "completedCount">) {
        const { data: { user } } = await (supabase.auth as any).getUser();
        if (!user) throw new Error("Not authenticated");

        const { data: seq, error: seqError } = await supabase
            .from("sequences")
            .insert({
                user_id: user.id,
                name: sequence.name,
                status: sequence.status,
            })
            .select()
            .single();

        if (seqError) throw seqError;

        if (sequence.steps && sequence.steps.length > 0) {
            const stepsToInsert = sequence.steps.map(s => ({
                sequence_id: seq.id,
                order: s.order,
                delay_hours: s.delayHours,
                subject: s.subject,
                body: s.body,
            }));

            const { error: stepsError } = await supabase
                .from("sequence_steps")
                .insert(stepsToInsert);

            if (stepsError) throw stepsError;
        }

        return seq;
    },

    async updateSequence(id: string, updates: Partial<Sequence>) {
        const dbUpdates: any = {};
        if (updates.name) dbUpdates.name = updates.name;
        if (updates.status) dbUpdates.status = updates.status;

        const { data, error } = await supabase
            .from("sequences")
            .update(dbUpdates)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        if (updates.steps) {
            // For simplicity in v1, we'll replace all steps on update
            await supabase.from("sequence_steps").delete().eq("sequence_id", id);

            const stepsToInsert = updates.steps.map(s => ({
                sequence_id: id,
                order: s.order,
                delay_hours: s.delayHours,
                subject: s.subject,
                body: s.body,
            }));

            await supabase.from("sequence_steps").insert(stepsToInsert);
        }

        return data;
    },

    async deleteSequence(id: string) {
        const { error } = await supabase
            .from("sequences")
            .delete()
            .eq("id", id);

        if (error) throw error;
    }
};
