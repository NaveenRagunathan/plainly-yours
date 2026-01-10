import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sequenceService } from "@/services/sequences";
import type { Sequence } from "@/types";

export function useSequences() {
    return useQuery({
        queryKey: ["sequences"],
        queryFn: () => sequenceService.getSequences(),
    });
}

export function useCreateSequence() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (newSeq: Omit<Sequence, "id" | "userId" | "createdAt" | "updatedAt" | "enrolledCount" | "completedCount">) =>
            sequenceService.createSequence(newSeq),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sequences"] });
        },
    });
}

export function useUpdateSequence() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<Sequence> }) =>
            sequenceService.updateSequence(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sequences"] });
        },
    });
}

export function useDeleteSequence() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => sequenceService.deleteSequence(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sequences"] });
        },
    });
}
