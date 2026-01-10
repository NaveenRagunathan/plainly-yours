import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/auth";
import { useAppStore } from "@/stores/appStore";
import { useEffect } from "react";

export function useAuth() {
    const queryClient = useQueryClient();
    const setUser = useAppStore((state) => state.setUser);
    const user = useAppStore((state) => state.user);
    const isAuthenticated = useAppStore((state) => state.isAuthenticated);

    const { data, isLoading, error } = useQuery({
        queryKey: ["auth-user"],
        queryFn: () => authService.getCurrentUser(),
        retry: false,
    });

    useEffect(() => {
        if (data) {
            setUser(data);
        } else if (!isLoading && !data) {
            setUser(null);
        }
    }, [data, isLoading, setUser]);

    const signOutMutation = useMutation({
        mutationFn: () => authService.signOut(),
        onSuccess: () => {
            setUser(null);
            queryClient.clear();
        },
    });

    const updateProfileMutation = useMutation({
        mutationFn: (updates: { name: string }) => authService.updateProfile(updates),
        onSuccess: (updatedUser) => {
            setUser(updatedUser);
            queryClient.setQueryData(["auth-user"], updatedUser);
        },
    });

    const createCheckoutSessionMutation = useMutation({
        mutationFn: (planId: string) => authService.createCheckoutSession(planId),
        onSuccess: (data) => {
            if (data.url) {
                window.location.href = data.url;
            }
        },
    });

    return {
        user,
        isLoading,
        isAuthenticated,
        error,
        signOut: signOutMutation.mutate,
        updateProfile: updateProfileMutation.mutate,
        isUpdating: updateProfileMutation.isPending,
        createCheckoutSession: createCheckoutSessionMutation.mutate,
        isCheckingOut: createCheckoutSessionMutation.isPending,
    };
}
