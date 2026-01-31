"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { format } from "date-fns";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Clock,
  Play,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Phone,
  MoreVertical,
  Pencil,
  Trash2,
  Plus,
  Save,
  X,
} from "lucide-react";

type TaskStatus = "todo" | "in_progress" | "done" | "cancelled";
type TaskPriority = "low" | "medium" | "high";

interface TaskType {
  _id: Id<"taskTypes">;
  name: string;
  color: string;
}

interface Customer {
  _id: Id<"customers">;
  name: string;
  phone: string;
}

interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: number;
  customerId?: string;
  taskTypeId?: Id<"taskTypes">;
  taskType?: TaskType | null;
  customer?: Customer | null;
  createdAt: number;
}

interface TaskNote {
  _id: Id<"taskNotes">;
  taskId: Id<"tasks">;
  content: string;
  createdAt: number;
  updatedAt: number;
}

const statusConfig: Record<TaskStatus, { label: string; color: string; icon: React.ElementType }> = {
  todo: { label: "To Do", color: "bg-slate-500", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-blue-500", icon: Play },
  done: { label: "Done", color: "bg-green-500", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-500", icon: XCircle },
};

const priorityConfig: Record<TaskPriority, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  low: { label: "Low", variant: "secondary" },
  medium: { label: "Medium", variant: "default" },
  high: { label: "High", variant: "destructive" },
};

interface TaskViewDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated: () => void;
}

export function TaskViewDialog({ task, open, onOpenChange, onTaskUpdated }: TaskViewDialogProps) {
  const notes = useQuery(
    api.taskNotes.getTaskNotes,
    task ? { taskId: task._id as Id<"tasks"> } : "skip"
  );
  const createNote = useMutation(api.taskNotes.createNote);
  const updateNote = useMutation(api.taskNotes.updateNote);
  const deleteNote = useMutation(api.taskNotes.deleteNote);

  const [newNoteContent, setNewNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<Id<"taskNotes"> | null>(null);
  const [editNoteContent, setEditNoteContent] = useState("");
  const [showDeleteNoteDialog, setShowDeleteNoteDialog] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Id<"taskNotes"> | null>(null);

  if (!task) return null;

  const StatusIcon = statusConfig[task.status].icon;

  const handleCreateNote = async () => {
    if (!newNoteContent.trim()) return;
    await createNote({
      taskId: task._id as Id<"tasks">,
      content: newNoteContent,
    });
    setNewNoteContent("");
    onTaskUpdated();
  };

  const handleUpdateNote = async () => {
    if (!editingNoteId || !editNoteContent.trim()) return;
    await updateNote({
      id: editingNoteId,
      content: editNoteContent,
    });
    setEditingNoteId(null);
    setEditNoteContent("");
    onTaskUpdated();
  };

  const handleDeleteNote = async () => {
    if (!noteToDelete) return;
    await deleteNote({ id: noteToDelete });
    setShowDeleteNoteDialog(false);
    setNoteToDelete(null);
    onTaskUpdated();
  };

  const startEditingNote = (note: TaskNote) => {
    setEditingNoteId(note._id);
    setEditNoteContent(note.content);
  };

  const cancelEditingNote = () => {
    setEditingNoteId(null);
    setEditNoteContent("");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {task.taskType && (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: task.taskType.color }}
                      title={task.taskType.name}
                    />
                  )}
                  <DialogTitle className="text-xl">{task.title}</DialogTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={priorityConfig[task.priority].variant}>
                    {priorityConfig[task.priority].label}
                  </Badge>
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-xs ${statusConfig[task.status].color}`}>
                    <StatusIcon className="h-3 w-3" />
                    <span>{statusConfig[task.status].label}</span>
                  </div>
                </div>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6">
              {/* Task Details */}
              <div className="space-y-2">
                {task.description && (
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                )}
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {task.dueDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Due: {format(task.dueDate, "MMM d, yyyy")}</span>
                    </div>
                  )}
                </div>

                {task.customer && (
                  <div className="flex items-center gap-4 pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{task.customer.name}</span>
                    </div>
                    <a
                      href={`tel:${task.customer.phone.replace(/\s/g, "")}`}
                      className="flex items-center gap-1 hover:text-primary hover:underline"
                    >
                      <Phone className="h-4 w-4" />
                      <span>{task.customer.phone}</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Notes Section */}
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  Notes
                  {notes && notes.length > 0 && (
                    <span className="text-xs text-muted-foreground">({notes.length})</span>
                  )}
                </h4>

                {/* Add New Note */}
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a note..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={handleCreateNote}
                      disabled={!newNoteContent.trim()}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Note
                    </Button>
                  </div>
                </div>

                {/* Notes List */}
                <div className="space-y-3">
                  {notes?.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No notes yet. Add your first note above.
                    </p>
                  )}
                  
                  {notes?.map((note) => (
                    <div key={note._id} className="border rounded-lg p-3 space-y-2">
                      {editingNoteId === note._id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editNoteContent}
                            onChange={(e) => setEditNoteContent(e.target.value)}
                            rows={3}
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEditingNote}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleUpdateNote}
                              disabled={!editNoteContent.trim()}
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              {format(note.createdAt, "MMM d, yyyy 'at' h:mm a")}
                              {note.updatedAt > note.createdAt && " (edited)"}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => startEditingNote(note)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setNoteToDelete(note._id);
                                    setShowDeleteNoteDialog(true);
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Note Confirmation */}
      <AlertDialog open={showDeleteNoteDialog} onOpenChange={setShowDeleteNoteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNoteToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteNote} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
