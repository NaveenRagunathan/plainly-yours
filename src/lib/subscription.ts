// Subscription utility functions for access control and limits

export interface Profile {
    id: string;
    email: string;
    plan: 'free' | 'starter' | 'pro';
    subscription_status?: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing';
    subscriber_limit: number;
    is_lifetime?: boolean;
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    subscription_current_period_end?: string;
}

/**
 * Check if user has an active subscription
 * @param profile User profile from database
 * @returns true if user has access to paid features
 */
export function hasActiveSubscription(profile: Profile): boolean {
    // Free tier is always allowed
    if (profile.plan === 'free') {
        return true;
    }

    // Lifetime users always have access
    if (profile.is_lifetime) {
        return true;
    }

    // Check subscription status for paid plans
    const activeStatuses = ['active', 'trialing'];
    return activeStatuses.includes(profile.subscription_status || '');
}

/**
 * Check if user is within their subscriber limit
 * @param profile User profile from database
 * @param currentCount Current number of subscribers
 * @returns true if user can add more subscribers
 */
export function isWithinSubscriberLimit(profile: Profile, currentCount: number): boolean {
    const limits: Record<string, number> = {
        free: 100,
        starter: 25000,
        pro: 100000,
    };

    const limit = limits[profile.plan] || 0;
    return currentCount < limit;
}

/**
 * Get remaining subscriber slots
 * @param profile User profile from database
 * @param currentCount Current number of subscribers
 * @returns number of remaining subscriber slots
 */
export function getRemainingSubscribers(profile: Profile, currentCount: number): number {
    const limits: Record<string, number> = {
        free: 100,
        starter: 25000,
        pro: 100000,
    };

    const limit = limits[profile.plan] || 0;
    return Math.max(0, limit - currentCount);
}

/**
 * Check if user needs to upgrade their plan
 * @param profile User profile from database
 * @returns true if subscription is past_due or canceled
 */
export function needsUpgrade(profile: Profile): boolean {
    // Free tier users don't need upgrades
    if (profile.plan === 'free') {
        return false;
    }

    // Lifetime users don't need upgrades
    if (profile.is_lifetime) {
        return false;
    }

    // Check if subscription needs attention
    const problemStatuses = ['past_due', 'canceled', 'incomplete'];
    return problemStatuses.includes(profile.subscription_status || '');
}

/**
 * Get user-friendly subscription status message
 * @param profile User profile from database
 * @returns status message to display to user
 */
export function getSubscriptionStatusMessage(profile: Profile): string {
    if (profile.plan === 'free') {
        return 'Free Plan';
    }

    if (profile.is_lifetime) {
        return 'Lifetime Access';
    }

    switch (profile.subscription_status) {
        case 'active':
            return `${profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1)} Plan - Active`;
        case 'trialing':
            return `${profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1)} Plan - Trial Period`;
        case 'past_due':
            return 'Payment Failed - Please Update Payment Method';
        case 'canceled':
            return 'Subscription Canceled - Upgrade to Continue';
        case 'incomplete':
            return 'Payment Incomplete - Please Complete Payment';
        default:
            return 'Unknown Status';
    }
}
