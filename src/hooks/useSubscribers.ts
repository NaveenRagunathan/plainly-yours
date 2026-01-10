import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { subscriberService } from "@/services/subscribers";
import type { Subscriber } from "@/types";

export function useSubscribers() {
    return useQuery({
        queryKey: ["subscribers"],
        queryFn: () => subscriberService.getSubscribers(),
    });
}

export function useCreateSubscriber() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (newSub: Omit<Subscriber, "id" | "userId" | "createdAt" | "updatedAt">) =>
            subscriberService.createSubscriber(newSub),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subscribers"] });
        },
    });
}

export function useUpdateSubscriber() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<Subscriber> }) =>
            subscriberService.updateSubscriber(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subscribers"] });
        },
    });
}

export function useDeleteSubscriber() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => subscriberService.deleteSubscriber(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subscribers"] });
        },
    });
}

export function useImportSubscribers() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (subs: Array<{ email: string; firstName?: string; tags?: string[] }>) =>
            subscriberService.importSubscribers(subs),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subscribers"] });
        },
    });
}
