import { useQuery } from "@tanstack/react-query";
import { analyticsService } from "@/services/analytics";

export function useAnalyticsOverview() {
    return useQuery({
        queryKey: ["analytics", "overview"],
        queryFn: () => analyticsService.getOverview(),
    });
}

export function useSubscriberGrowth() {
    return useQuery({
        queryKey: ["analytics", "growth"],
        queryFn: () => analyticsService.getSubscriberGrowth(),
    });
}
