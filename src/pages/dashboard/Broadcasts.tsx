import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Send, MoreHorizontal, Trash2, Calendar, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

import { useBroadcasts, useCreateBroadcast, useSendBroadcast, useDeleteBroadcast } from "@/hooks/useBroadcasts";
import { useSubscribers } from "@/hooks/useSubscribers";

export default function BroadcastsPage() {
  const { data: broadcasts = [], isLoading } = useBroadcasts();
  const { data: subscribers = [] } = useSubscribers();
  const createBroadcast = useCreateBroadcast();
  const sendBroadcast = useSendBroadcast();
  const deleteBroadcast = useDeleteBroadcast();

  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newBroadcast, setNewBroadcast] = useState({
    subject: "",
    body: "",
    scheduledFor: "",
    isABTest: false,
    subjectB: "",
  });

  const activeSubscribers = subscribers.filter((s) => s.status === "active").length;

  const handleCreate = (sendNow: boolean) => {
    if (!newBroadcast.subject || !newBroadcast.body) {
      toast({ title: "Subject and body are required", variant: "destructive" });
      return;
    }

    createBroadcast.mutate({
      subject: newBroadcast.subject,
      body: newBroadcast.body,
      status: sendNow ? "scheduled" : newBroadcast.scheduledFor ? "scheduled" : "draft",
      scheduledFor: sendNow
        ? new Date().toISOString()
        : newBroadcast.scheduledFor
          ? new Date(newBroadcast.scheduledFor).toISOString()
          : undefined,
      recipientFilter: {},
      isABTest: newBroadcast.isABTest,
      subjectB: newBroadcast.subjectB || undefined,
    }, {
      onSuccess: () => {
        if (sendNow) {
          toast({ title: "Broadcast sent!", description: `Sent to ${activeSubscribers} subscribers` });
        } else {
          toast({ title: "Broadcast saved!" });
        }
        setNewBroadcast({ subject: "", body: "", scheduledFor: "", isABTest: false, subjectB: "" });
        setIsCreateOpen(false);
      },
      onError: (error: any) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    });
  };

  const handleSend = (id: string) => {
    sendBroadcast.mutate(id, {
      onSuccess: () => toast({ title: "Broadcast sent!", description: `Sent to ${activeSubscribers} subscribers` }),
      onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" })
    });
  };

  const handleDelete = (id: string) => {
    deleteBroadcast.mutate(id, {
      onSuccess: () => toast({ title: "Broadcast deleted" }),
      onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" })
    });
  };

  const statusColors = {
    draft: "bg-gray-100 text-gray-800",
    scheduled: "bg-blue-100 text-blue-800",
    sending: "bg-yellow-100 text-yellow-800",
    sent: "bg-green-100 text-green-800",
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Broadcasts</h1>
          <p className="text-muted-foreground mt-1">
            Send one-time emails to your subscribers
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Broadcast
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Broadcast</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="p-3 rounded-lg bg-accent/50 text-sm">
                <span className="text-muted-foreground">Recipients: </span>
                <span className="font-medium text-foreground">
                  {activeSubscribers} active subscribers
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  placeholder="Your subject line here..."
                  value={newBroadcast.subject}
                  onChange={(e) => setNewBroadcast({ ...newBroadcast, subject: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Email Body</Label>
                <Textarea
                  id="body"
                  placeholder="Hey {first_name},\n\nWrite your email here..."
                  rows={8}
                  value={newBroadcast.body}
                  onChange={(e) => setNewBroadcast({ ...newBroadcast, body: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Use {"{first_name}"} to personalize. Plain text only.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="schedule">Schedule (optional)</Label>
                <Input
                  id="schedule"
                  type="datetime-local"
                  value={newBroadcast.scheduledFor}
                  onChange={(e) =>
                    setNewBroadcast({ ...newBroadcast, scheduledFor: e.target.value })
                  }
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => handleCreate(false)}>
                  Save as Draft
                </Button>
                <Button className="flex-1" onClick={() => handleCreate(true)}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Now
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Broadcasts List */}
      <div className="space-y-4">
        {broadcasts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            No broadcasts yet. Create your first one to reach your subscribers!
          </div>
        ) : (
          broadcasts.map((broadcast) => (
            <div
              key={broadcast.id}
              className="p-6 rounded-xl border border-border bg-card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-foreground truncate">
                      {broadcast.subject}
                    </h3>
                    <Badge className={statusColors[broadcast.status]}>{broadcast.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{broadcast.body}</p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {(broadcast.status === "draft" || broadcast.status === "scheduled") && (
                      <DropdownMenuItem onClick={() => handleSend(broadcast.id)}>
                        <Send className="h-4 w-4 mr-2" />
                        Send Now
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(broadcast.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-6 text-sm">
                {broadcast.status === "sent" ? (
                  <>
                    <div>
                      <span className="text-muted-foreground">Sent: </span>
                      <span className="font-medium text-foreground">
                        {broadcast.stats.sent.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Opened: </span>
                      <span className="font-medium text-foreground">
                        {broadcast.stats.opened.toLocaleString()} (
                        {broadcast.stats.sent > 0
                          ? ((broadcast.stats.opened / broadcast.stats.sent) * 100).toFixed(1)
                          : 0}
                        %)
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Clicked: </span>
                      <span className="font-medium text-foreground">
                        {broadcast.stats.clicked.toLocaleString()} (
                        {broadcast.stats.sent > 0
                          ? ((broadcast.stats.clicked / broadcast.stats.sent) * 100).toFixed(1)
                          : 0}
                        %)
                      </span>
                    </div>
                  </>
                ) : broadcast.status === "scheduled" && broadcast.scheduledFor ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Scheduled for {formatDate(new Date(broadcast.scheduledFor))}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Created {formatDate(new Date(broadcast.createdAt))}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
