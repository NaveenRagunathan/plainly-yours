import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, ExternalLink, MoreHorizontal, Trash2, Eye, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import type { LandingPage } from "@/types";

const templates = [
  { id: "minimal", name: "Minimal", description: "Clean, centered form" },
  { id: "side-by-side", name: "Side by Side", description: "Image + form layout" },
  { id: "hero", name: "Hero", description: "Full-width with background" },
  { id: "two-column", name: "Two Column", description: "Benefits + form" },
  { id: "video", name: "Video", description: "Video embed + form" },
];

import { useLandingPages, useCreateLandingPage, useUpdateLandingPage, useDeleteLandingPage } from "@/hooks/useLandingPages";
import { useSequences } from "@/hooks/useSequences";

export default function LandingPagesPage() {
  const { data: landingPages = [], isLoading } = useLandingPages();
  const { data: sequences = [] } = useSequences();
  const createLandingPage = useCreateLandingPage();
  const updateLandingPage = useUpdateLandingPage();
  const deleteLandingPage = useDeleteLandingPage();

  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPage, setNewPage] = useState({
    name: "",
    slug: "",
    template: "minimal" as LandingPage["template"],
    headline: "",
    subheadline: "",
    buttonText: "Subscribe",
    showFirstName: true,
    assignTag: "",
    assignSequenceId: "",
    successMessage: "Thanks for subscribing! Check your inbox.",
  });

  const handleCreate = () => {
    if (!newPage.name || !newPage.slug || !newPage.headline) {
      toast({ title: "Name, slug, and headline are required", variant: "destructive" });
      return;
    }

    createLandingPage.mutate({
      ...newPage,
      assignSequenceId: newPage.assignSequenceId === "none" ? undefined : newPage.assignSequenceId,
      status: "draft",
    }, {
      onSuccess: () => {
        toast({ title: "Landing page created!" });
        setNewPage({
          name: "",
          slug: "",
          template: "minimal",
          headline: "",
          subheadline: "",
          buttonText: "Subscribe",
          showFirstName: true,
          assignTag: "",
          assignSequenceId: "",
          successMessage: "Thanks for subscribing! Check your inbox.",
        });
        setIsCreateOpen(false);
      },
      onError: (error: any) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    });
  };

  const toggleStatus = (page: LandingPage) => {
    const newStatus = page.status === "published" ? "draft" : "published";
    updateLandingPage.mutate({ id: page.id, updates: { status: newStatus } }, {
      onSuccess: () => toast({ title: `Page ${newStatus === "published" ? "published" : "unpublished"}` }),
      onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" })
    });
  };

  const handleDelete = (id: string) => {
    deleteLandingPage.mutate(id, {
      onSuccess: () => toast({ title: "Landing page deleted" }),
      onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" })
    });
  };

  const statusColors = {
    draft: "bg-gray-100 text-gray-800",
    published: "bg-green-100 text-green-800",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Landing Pages</h1>
          <p className="text-muted-foreground mt-1">
            Capture subscribers with beautiful hosted pages
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Page
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Landing Page</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Page Name</Label>
                  <Input
                    id="name"
                    placeholder="Newsletter Signup"
                    value={newPage.name}
                    onChange={(e) => setNewPage({ ...newPage, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">plainly.email/</span>
                    <Input
                      id="slug"
                      placeholder="newsletter"
                      value={newPage.slug}
                      onChange={(e) =>
                        setNewPage({
                          ...newPage,
                          slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Template</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`p-4 rounded-lg border text-left transition-all ${newPage.template === t.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                        }`}
                      onClick={() => setNewPage({ ...newPage, template: t.id as any })}
                    >
                      <p className="font-medium text-sm text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="headline">Headline</Label>
                <Input
                  id="headline"
                  placeholder="Join 1,200+ creators getting weekly insights"
                  value={newPage.headline}
                  onChange={(e) => setNewPage({ ...newPage, headline: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subheadline">Subheadline (optional)</Label>
                <Input
                  id="subheadline"
                  placeholder="No spam. Unsubscribe anytime."
                  value={newPage.subheadline}
                  onChange={(e) => setNewPage({ ...newPage, subheadline: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="buttonText">Button Text</Label>
                  <Input
                    id="buttonText"
                    placeholder="Subscribe"
                    value={newPage.buttonText}
                    onChange={(e) => setNewPage({ ...newPage, buttonText: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tag">Assign Tag (optional)</Label>
                  <Input
                    id="tag"
                    placeholder="newsletter"
                    value={newPage.assignTag}
                    onChange={(e) => setNewPage({ ...newPage, assignTag: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Show First Name Field</Label>
                  <p className="text-xs text-muted-foreground">Ask for subscriber's name</p>
                </div>
                <Switch
                  checked={newPage.showFirstName}
                  onCheckedChange={(checked) => setNewPage({ ...newPage, showFirstName: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sequence">Assign to Sequence (optional)</Label>
                <Select
                  value={newPage.assignSequenceId}
                  onValueChange={(value) => setNewPage({ ...newPage, assignSequenceId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a sequence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {sequences.map((seq) => (
                      <SelectItem key={seq.id} value={seq.id}>
                        {seq.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="success">Success Message</Label>
                <Input
                  id="success"
                  placeholder="Thanks for subscribing! Check your inbox."
                  value={newPage.successMessage}
                  onChange={(e) => setNewPage({ ...newPage, successMessage: e.target.value })}
                />
              </div>

              <Button onClick={handleCreate} className="w-full">
                Create Landing Page
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Landing Pages Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {landingPages.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 text-center py-16 text-muted-foreground">
            No landing pages yet. Create your first one to start capturing subscribers!
          </div>
        ) : (
          landingPages.map((page) => (
            <div
              key={page.id}
              className="p-6 rounded-xl border border-border bg-card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">{page.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">/{page.slug}</p>
                  <Badge className={`mt-2 ${statusColors[page.status]}`}>{page.status}</Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => toggleStatus(page)}>
                      {page.status === "published" ? "Unpublish" : "Publish"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(page.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{page.headline}</p>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{page.views.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{page.conversions.toLocaleString()}</span>
                </div>
                <span>
                  {page.views > 0
                    ? `${((page.conversions / page.views) * 100).toFixed(1)}% CVR`
                    : "—"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
