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
import { Plus, Play, Pause, MoreHorizontal, Trash2, Edit, Mail, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import type { Sequence, SequenceStep } from "@/types";

import { useSequences, useCreateSequence, useUpdateSequence, useDeleteSequence } from "@/hooks/useSequences";

export default function SequencesPage() {
  const { data: sequences = [], isLoading } = useSequences();
  const createSequence = useCreateSequence();
  const updateSequence = useUpdateSequence();
  const deleteSequence = useDeleteSequence();

  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSequence, setEditingSequence] = useState<Sequence | null>(null);
  const [newSequence, setNewSequence] = useState({
    name: "",
    steps: [{ id: "1", order: 1, delayHours: 0, subject: "", body: "" }] as SequenceStep[],
  });

  const handleCreate = () => {
    if (!newSequence.name) {
      toast({ title: "Sequence name is required", variant: "destructive" });
      return;
    }

    createSequence.mutate({
      name: newSequence.name,
      status: "draft",
      steps: newSequence.steps.map((s, i) => ({
        ...s,
        order: i + 1,
      })),
    }, {
      onSuccess: () => {
        toast({ title: "Sequence created!" });
        setNewSequence({
          name: "",
          steps: [{ id: "1", order: 1, delayHours: 0, subject: "", body: "" }] as any,
        });
        setIsCreateOpen(false);
      },
      onError: (error: any) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    });
  };

  const handleAddStep = () => {
    const newStep = {
      id: Date.now().toString(),
      order: newSequence.steps.length + 1,
      delayHours: 24,
      subject: "",
      body: "",
    };
    setNewSequence({ ...newSequence, steps: [...newSequence.steps, newStep as any] });
  };

  const handleUpdateStep = (stepId: string, field: keyof SequenceStep, value: string | number) => {
    setNewSequence({
      ...newSequence,
      steps: newSequence.steps.map((s) =>
        s.id === stepId ? { ...s, [field]: value } : s
      ),
    });
  };

  const handleRemoveStep = (stepId: string) => {
    if (newSequence.steps.length <= 1) return;
    setNewSequence({
      ...newSequence,
      steps: newSequence.steps
        .filter((s) => s.id !== stepId)
        .map((s, i) => ({ ...s, order: i + 1 })),
    });
  };

  const toggleSequenceStatus = (seq: Sequence) => {
    const newStatus = seq.status === "active" ? "paused" : "active";
    updateSequence.mutate({ id: seq.id, updates: { status: newStatus } }, {
      onSuccess: () => toast({ title: `Sequence ${newStatus === "active" ? "activated" : "paused"}` }),
      onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" })
    });
  };

  const handleDelete = (id: string) => {
    deleteSequence.mutate(id, {
      onSuccess: () => toast({ title: "Sequence deleted" }),
      onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" })
    });
  };

  const statusColors = {
    draft: "bg-gray-100 text-gray-800",
    active: "bg-green-100 text-green-800",
    paused: "bg-yellow-100 text-yellow-800",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sequences</h1>
          <p className="text-muted-foreground mt-1">
            Create automated email sequences for your subscribers
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Sequence
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Sequence</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Sequence Name</Label>
                <Input
                  id="name"
                  placeholder="Welcome Series"
                  value={newSequence.name}
                  onChange={(e) => setNewSequence({ ...newSequence, name: e.target.value })}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Email Steps</Label>
                  <Button variant="outline" size="sm" onClick={handleAddStep}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Step
                  </Button>
                </div>

                {newSequence.steps.map((step, index) => (
                  <div
                    key={step.id}
                    className="p-4 rounded-lg border border-border bg-accent/30 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium">Step {index + 1}</span>
                      </div>
                      {newSequence.steps.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleRemoveStep(step.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Delay (hours after previous)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={step.delayHours}
                          onChange={(e) =>
                            handleUpdateStep(step.id, "delayHours", parseInt(e.target.value) || 0)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Subject Line</Label>
                        <Input
                          placeholder="Welcome to the community! 👋"
                          value={step.subject}
                          onChange={(e) => handleUpdateStep(step.id, "subject", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Email Body</Label>
                      <Textarea
                        placeholder="Hey {first_name},\n\nThanks for joining..."
                        rows={4}
                        value={step.body}
                        onChange={(e) => handleUpdateStep(step.id, "body", e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Use {"{first_name}"} to personalize. Plain text only.
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Button onClick={handleCreate} className="w-full">
                Create Sequence
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sequences Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sequences.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 text-center py-16 text-muted-foreground">
            No sequences yet. Create your first one to automate your emails!
          </div>
        ) : (
          sequences.map((seq) => (
            <div
              key={seq.id}
              className="p-6 rounded-xl border border-border bg-card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">{seq.name}</h3>
                  <Badge className={`mt-2 ${statusColors[seq.status]}`}>{seq.status}</Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => toggleSequenceStatus(seq)}>
                      {seq.status === "active" ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Activate
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(seq.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{seq.steps.length} email{seq.steps.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {seq.steps.reduce((acc, s) => acc + s.delayHours, 0)} hours total
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border flex justify-between text-sm">
                <div>
                  <span className="text-muted-foreground">Enrolled: </span>
                  <span className="font-medium text-foreground">{seq.enrolledCount}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Completed: </span>
                  <span className="font-medium text-foreground">{seq.completedCount}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
