import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { landingPageService } from "@/services/landingPages";
import type { LandingPage } from "@/types";

export function useLandingPages() {
    return useQuery({
        queryKey: ["landing-pages"],
        queryFn: () => landingPageService.getLandingPages(),
    });
}

export function usePublicLandingPage(slug: string) {
    return useQuery({
        queryKey: ["public-landing-page", slug],
        queryFn: () => landingPageService.getPublicPage(slug),
        enabled: !!slug,
    });
}

export function useCreateLandingPage() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (newPage: Omit<LandingPage, "id" | "userId" | "createdAt" | "updatedAt" | "views" | "conversions">) =>
            landingPageService.createLandingPage(newPage),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["landing-pages"] });
        },
    });
}

export function useUpdateLandingPage() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<LandingPage> }) =>
            landingPageService.updateLandingPage(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["landing-pages"] });
        },
    });
}

export function useDeleteLandingPage() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => landingPageService.deleteLandingPage(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["landing-pages"] });
        },
    });
}
