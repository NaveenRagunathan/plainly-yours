import { useEffect } from "react";
import { useAnalyticsOverview, useSubscriberGrowth } from "@/hooks/useAnalytics";
import { useSequences } from "@/hooks/useSequences";
import { useBroadcasts } from "@/hooks/useBroadcasts";
import { Users, Send, Mail, TrendingUp, ArrowUp, ArrowDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useToast } from "@/hooks/use-toast";

export default function DashboardOverview() {
  const { toast } = useToast();
  const { data: analytics, isLoading: isAnalyticsLoading } = useAnalyticsOverview();
  const { data: growthData = [] } = useSubscriberGrowth();
  const { data: sequences = [] } = useSequences();
  const { data: broadcasts = [] } = useBroadcasts();

  // Show welcome message for users returning from successful payment
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');

    if (sessionId) {
      toast({
        title: "Payment successful!",
        description: "Your subscription will be activated shortly.",
      });

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  if (isAnalyticsLoading || !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Subscribers',
      value: analytics.totalSubscribers.toLocaleString(),
      change: `+${analytics.subscribersAddedLast7Days} this week`,
      changePositive: true,
      icon: Users,
    },
    {
      label: 'Average Open Rate',
      value: `${analytics.averageOpenRate.toFixed(1)}%`,
      change: 'Industry avg: 21.5%',
      changePositive: analytics.averageOpenRate >= 21.5,
      icon: Mail,
    },
    {
      label: 'Average Click Rate',
      value: `${analytics.averageClickRate.toFixed(1)}%`,
      change: 'Industry avg: 2.3%',
      changePositive: analytics.averageClickRate >= 2.3,
      icon: TrendingUp,
    },
    {
      label: 'Emails Sent',
      value: analytics.emailsSentLast30Days.toLocaleString(),
      change: 'Last 30 days',
      changePositive: true,
      icon: Send,
    },
  ];

  const activeSequences = sequences.filter((s) => s.status === 'active');
  const scheduledBroadcasts = broadcasts.filter((b) => b.status === 'scheduled');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Overview</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's what's happening with your emails.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="p-6 rounded-xl bg-card border border-border hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div className={`flex items-center gap-1 text-xs ${stat.changePositive ? 'text-green-600' : 'text-muted-foreground'}`}>
                {stat.changePositive ? (
                  <ArrowUp className="h-3 w-3" />
                ) : (
                  <ArrowDown className="h-3 w-3" />
                )}
                {stat.change}
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts and Activity */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Subscriber Growth Chart */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-card border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-6">Subscriber Growth</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.getDate().toString();
                  }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: number) => [value, 'Subscribers']}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions / Activity */}
        <div className="p-6 rounded-xl bg-card border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-6">Activity</h2>

          <div className="space-y-4">
            {/* Active Sequences */}
            <div className="p-4 rounded-lg bg-accent/50">
              <div className="flex items-center gap-3 mb-2">
                <Mail className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground">Active Sequences</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{activeSequences.length}</p>
              <p className="text-sm text-muted-foreground">
                {sequences.reduce((sum, s) => sum + s.enrolledCount, 0)} subscribers enrolled
              </p>
            </div>

            {/* Scheduled Broadcasts */}
            <div className="p-4 rounded-lg bg-accent/50">
              <div className="flex items-center gap-3 mb-2">
                <Send className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground">Scheduled</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{scheduledBroadcasts.length}</p>
              <p className="text-sm text-muted-foreground">
                {scheduledBroadcasts.length > 0
                  ? `Next: ${new Date(scheduledBroadcasts[0].scheduledFor!).toLocaleDateString()}`
                  : 'No broadcasts scheduled'}
              </p>
            </div>

            {/* Recent Activity */}
            <div className="p-4 rounded-lg bg-accent/50">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground">New Subscribers</span>
              </div>
              <p className="text-2xl font-bold text-foreground">+{analytics.subscribersAddedLast7Days}</p>
              <p className="text-sm text-muted-foreground">In the last 7 days</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
