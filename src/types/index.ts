// User & Auth Types
export interface User {
  id: string; // UUID
  email: string;
  name: string;
  plan: 'starter' | 'growth' | 'lifetime';
  subscriberLimit: number;
  createdAt: string; // ISO Date
  updatedAt: string; // ISO Date
}

// Subscriber Types
export interface Subscriber {
  id: string; // UUID
  userId: string; // UUID
  email: string;
  firstName?: string;
  tags: string[];
  status: 'active' | 'unsubscribed' | 'bounced';
  currentSequenceId?: string; // UUID
  currentSequenceStep?: number;
  createdAt: string; // ISO Date
  updatedAt: string; // ISO Date
}

// Sequence Types
export interface SequenceStep {
  id: string; // UUID
  sequenceId: string; // UUID
  order: number;
  delayHours: number;
  subject: string;
  body: string;
  createdAt: string; // ISO Date
  updatedAt: string; // ISO Date
}

export interface Sequence {
  id: string; // UUID
  userId: string; // UUID
  name: string;
  status: 'draft' | 'active' | 'paused';
  steps?: SequenceStep[];
  enrolledCount: number;
  completedCount: number;
  createdAt: string; // ISO Date
  updatedAt: string; // ISO Date
}

// Broadcast Types
export interface Broadcast {
  id: string; // UUID
  userId: string; // UUID
  subject: string;
  body: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent';
  scheduledFor?: string; // ISO Date
  sentAt?: string; // ISO Date
  recipientFilter: {
    tags?: string[];
    excludeInSequence?: boolean;
  };
  stats: {
    sent: number;
    opened: number;
    clicked: number;
    unsubscribed: number;
    bounced: number;
  };
  // A/B Test fields
  isABTest?: boolean;
  subjectB?: string;
  testSizePercent?: number; // 10, 20, 30
  winnerMetric?: 'open_rate' | 'click_rate';
  waitTimeHours?: number; // 2, 4, 6
  createdAt: string; // ISO Date
  updatedAt: string; // ISO Date
}

// Landing Page Types
export interface LandingPage {
  id: string; // UUID
  userId: string; // UUID
  name: string;
  slug: string;
  template: 'minimal' | 'side-by-side' | 'hero' | 'two-column' | 'video';
  headline: string;
  subheadline?: string;
  buttonText: string;
  imageUrl?: string;
  showFirstName: boolean;
  assignTag?: string;
  assignSequenceId?: string; // UUID
  successMessage: string;
  redirectUrl?: string;
  views: number;
  conversions: number;
  status: 'draft' | 'published';
  createdAt: string; // ISO Date
  updatedAt: string; // ISO Date
}

// Analytics Types
export interface AnalyticsOverview {
  totalSubscribers: number;
  subscribersAddedLast7Days: number;
  subscribersAddedLast30Days: number;
  emailsSentLast7Days: number;
  emailsSentLast30Days: number;
  averageOpenRate: number;
  averageClickRate: number;
}

export interface SubscriberGrowthPoint {
  date: string;
  count: number;
}

// Pricing Types
export interface PricingTier {
  id: 'starter' | 'growth' | 'lifetime';
  name: string;
  price: number;
  billing: 'monthly' | 'one-time';
  subscriberLimit: number;
  features: string[];
  popular?: boolean;
}
