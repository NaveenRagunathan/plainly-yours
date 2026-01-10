import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { broadcastService } from "@/services/broadcasts";
import type { Broadcast } from "@/types";

export function useBroadcasts() {
    return useQuery({
        queryKey: ["broadcasts"],
        queryFn: () => broadcastService.getBroadcasts(),
    });
}

export function useCreateBroadcast() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (newBroadcast: Omit<Broadcast, "id" | "userId" | "createdAt" | "updatedAt" | "stats">) =>
            broadcastService.createBroadcast(newBroadcast),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["broadcasts"] });
        },
    });
}

export function useUpdateBroadcast() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<Broadcast> }) =>
            broadcastService.updateBroadcast(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["broadcasts"] });
        },
    });
}

export function useDeleteBroadcast() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => broadcastService.deleteBroadcast(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["broadcasts"] });
        },
    });
}

export function useSendBroadcast() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => broadcastService.sendBroadcast(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["broadcasts"] });
        },
    });
}
