import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Upload, MoreHorizontal, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

import { useSubscribers, useCreateSubscriber, useDeleteSubscriber, useImportSubscribers } from "@/hooks/useSubscribers";

export default function SubscribersPage() {
  const { data: subscribers = [], isLoading } = useSubscribers();
  const createSubscriber = useCreateSubscriber();
  const deleteSubscriber = useDeleteSubscriber();
  const importSubscribers = useImportSubscribers();

  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newSub, setNewSub] = useState({ email: "", firstName: "", tags: "" });

  const filteredSubscribers = subscribers.filter(
    (s) =>
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      s.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAddSubscriber = () => {
    if (!newSub.email) {
      toast({ title: "Email is required", variant: "destructive" });
      return;
    }

    createSubscriber.mutate({
      email: newSub.email,
      firstName: newSub.firstName || undefined,
      tags: newSub.tags ? newSub.tags.split(",").map((t) => t.trim()) : [],
      status: "active",
    }, {
      onSuccess: () => {
        toast({ title: "Subscriber added!" });
        setNewSub({ email: "", firstName: "", tags: "" });
        setIsAddOpen(false);
      },
      onError: (error: any) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    });
  };

  const handleDelete = (id: string) => {
    deleteSubscriber.mutate(id, {
      onSuccess: () => toast({ title: "Subscriber removed" }),
      onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" })
    });
  };

  const handleImportDemo = () => {
    importSubscribers.mutate([
      { email: "demo1@example.com", firstName: "Demo", tags: ["imported"] },
      { email: "demo2@example.com", firstName: "User", tags: ["imported"] },
      { email: "demo3@example.com", tags: ["imported"] },
    ], {
      onSuccess: () => toast({ title: "3 subscribers imported!" }),
      onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" })
    });
  };

  const statusColors = {
    active: "bg-green-100 text-green-800",
    unsubscribed: "bg-gray-100 text-gray-800",
    bounced: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Subscribers</h1>
          <p className="text-muted-foreground mt-1">
            {subscribers.filter((s) => s.status === "active").length} active subscribers
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleImportDemo}>
            <Upload className="h-4 w-4 mr-2" />
            Import Demo
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Subscriber
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Subscriber</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="subscriber@example.com"
                    value={newSub.email}
                    onChange={(e) => setNewSub({ ...newSub, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={newSub.firstName}
                    onChange={(e) => setNewSub({ ...newSub, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    placeholder="newsletter, vip"
                    value={newSub.tags}
                    onChange={(e) => setNewSub({ ...newSub, tags: e.target.value })}
                  />
                </div>
                <Button onClick={handleAddSubscriber} className="w-full">
                  Add Subscriber
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by email, name, or tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubscribers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  {search ? "No subscribers found" : "No subscribers yet. Add your first one!"}
                </TableCell>
              </TableRow>
            ) : (
              filteredSubscribers.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">{sub.email}</TableCell>
                  <TableCell>{sub.firstName || "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {sub.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[sub.status]}>{sub.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(sub.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
