"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useMediaQuery } from "@/hooks/use-media-query";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Plus, Clock, XCircle, Play, Calendar, User, Phone, MoreVertical, Pencil, Trash2, Ban } from "lucide-react";
import { AddTaskDialog } from "./add-task-dialog";
import { TaskViewDialog } from "./task-view-dialog";
import { format } from "date-fns";
import { Id } from "@/convex/_generated/dataModel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface TaskNote {
  _id: Id<"taskNotes">;
  content: string;
  createdAt: number;
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
  mostRecentNote?: TaskNote | null;
  createdAt: number;
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

function TaskCard({ task, onStatusChange, onDelete, onEdit, onTaskClick }: { task: Task; onStatusChange: (id: string, status: TaskStatus) => void; onDelete: () => void; onEdit: () => void; onTaskClick: (task: Task) => void }) {
  const router = useRouter();
  const updateStatus = useMutation(api.tasks.updateTaskStatus);
  const deleteTask = useMutation(api.tasks.deleteTask);
  const updateTask = useMutation(api.tasks.updateTask);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    title: task.title,
    description: task.description || "",
    priority: task.priority,
  });

  const handleStatusChange = async (newStatus: TaskStatus) => {
    await updateStatus({ id: task._id as any, status: newStatus });
    onStatusChange(task._id, newStatus);
  };

  const handleCancel = async () => {
    await handleStatusChange("cancelled");
    setShowCancelDialog(false);
  };

  const handleDelete = async () => {
    await deleteTask({ id: task._id as any });
    setShowDeleteDialog(false);
    onDelete();
  };

  const handleEdit = async () => {
    await updateTask({
      id: task._id as any,
      title: editForm.title,
      description: editForm.description,
      priority: editForm.priority,
    });
    setShowEditDialog(false);
    onEdit();
  };

  const nextStatusMap: Record<TaskStatus, TaskStatus | null> = {
    todo: "in_progress",
    in_progress: "done",
    done: null,
    cancelled: null,
  };

  const nextStatus = nextStatusMap[task.status];
  const StatusIcon = statusConfig[task.status].icon;
  const canCancel = task.status !== "cancelled" && task.status !== "done";

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open modal if clicking on buttons, dropdowns, or links
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('[role="menuitem"]') ||
      target.closest('a') ||
      target.closest('[data-dropdown]')
    ) {
      return;
    }
    onTaskClick(task);
  };

  return (
    <>
      <Card className="mb-3 cursor-pointer hover:shadow-md transition-shadow" onClick={handleCardClick}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {task.taskType && (
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: task.taskType.color }}
                    title={task.taskType.name}
                  />
                )}
                <h3 className="font-semibold text-base truncate">{task.title}</h3>
                <Badge variant={priorityConfig[task.priority].variant} className="text-xs">
                  {priorityConfig[task.priority].label}
                </Badge>
              </div>

              {task.taskType && (
                <p className="text-xs text-muted-foreground mb-1">
                  {task.taskType.name}
                </p>
              )}

              {task.description && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {task.description}
                </p>
              )}

              {task.mostRecentNote && (
                <p className="text-sm text-muted-foreground mb-2 italic">
                  <span className="text-xs text-muted-foreground/60">Latest note: </span>
                  {task.mostRecentNote.content.slice(0, isDesktop ? 150 : 50)}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {task.dueDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{format(task.dueDate, "MMM d")}</span>
                  </div>
                )}
                {task.customer && (
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => router.push(`/customers/${task.customer!._id}`)}
                      className="flex items-center gap-1 hover:text-primary hover:underline cursor-pointer"
                    >
                      <User className="h-3 w-3" />
                      <span className="font-medium">{task.customer.name}</span>
                    </button>
                    <a 
                      href={`tel:${task.customer.phone.replace(/\s/g, '')}`}
                      className="flex items-center gap-1 hover:text-primary hover:underline"
                    >
                      <Phone className="h-3 w-3" />
                      <span>{task.customer.phone}</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-white text-xs ${statusConfig[task.status].color}`}>
                <StatusIcon className="h-3 w-3" />
                <span>{statusConfig[task.status].label}</span>
              </div>

              <div className="flex flex-col gap-1">
                {nextStatus && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                    onClick={() => handleStatusChange(nextStatus)}
                  >
                    {nextStatus === "in_progress" && "Start"}
                    {nextStatus === "done" && "Complete"}
                  </Button>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Play className="mr-2 h-4 w-4" />
                      Change Status
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {task.status !== "todo" && (
                        <DropdownMenuItem onClick={() => handleStatusChange("todo")}>
                          <Clock className="mr-2 h-4 w-4" />
                          Move to To Do
                        </DropdownMenuItem>
                      )}
                      {task.status !== "in_progress" && (
                        <DropdownMenuItem onClick={() => handleStatusChange("in_progress")}>
                          <Play className="mr-2 h-4 w-4" />
                          Move to In Progress
                        </DropdownMenuItem>
                      )}
                      {task.status !== "done" && (
                        <DropdownMenuItem onClick={() => handleStatusChange("done")}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Move to Done
                        </DropdownMenuItem>
                      )}
                      {task.status !== "cancelled" && (
                        <DropdownMenuItem onClick={() => handleStatusChange("cancelled")}>
                          <Ban className="mr-2 h-4 w-4" />
                          Cancel Task
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this task? This will mark it as cancelled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep it</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-red-600 hover:bg-red-700">
              Yes, cancel task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep it</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Yes, delete task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update the task details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="Task title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Task description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-priority">Priority</Label>
              <Select
                value={editForm.priority}
                onValueChange={(value: TaskPriority) => setEditForm({ ...editForm, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TaskList({ tasks, status, onStatusChange, onDelete, onEdit, onTaskClick }: { tasks: Task[]; status: TaskStatus; onStatusChange: (id: string, status: TaskStatus) => void; onDelete: () => void; onEdit: () => void; onTaskClick: (task: Task) => void }) {
  const filteredTasks = tasks.filter((task) => task.status === status);

  if (filteredTasks.length === 0) {
    return (
      <div className="text-center py-12">
        <StatusIcon status={status} />
        <h3 className="text-lg font-semibold mb-2">No {statusConfig[status].label.toLowerCase()} tasks</h3>
        <p className="text-muted-foreground text-sm">
          {status === "todo" && "Create a new task to get started"}
          {status === "in_progress" && "Start a task from the To Do tab"}
          {status === "done" && "Complete tasks to see them here"}
          {status === "cancelled" && "Cancelled tasks appear here"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredTasks.map((task) => (
        <TaskCard key={task._id} task={task} onStatusChange={onStatusChange} onDelete={onDelete} onEdit={onEdit} onTaskClick={onTaskClick} />
      ))}
    </div>
  );
}

function StatusIcon({ status }: { status: TaskStatus }) {
  const Icon = statusConfig[status].icon;
  return (
    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${statusConfig[status].color} bg-opacity-20`}>
      <Icon className={`h-8 w-8 ${statusConfig[status].color.replace('bg-', 'text-')}`} />
    </div>
  );
}

export default function TasksPage() {
  const tasks = useQuery(api.tasks.getTasks) || [];
  const [activeTab, setActiveTab] = useState<TaskStatus>("todo");
  const [, forceUpdate] = useState({});
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskView, setShowTaskView] = useState(false);

  const handleStatusChange = () => {
    // Force re-render to update task lists
    forceUpdate({});
  };

  const handleTaskAdded = () => {
    // Force re-render to update task lists
    forceUpdate({});
  };

  const handleDelete = () => {
    // Force re-render to update task lists
    forceUpdate({});
  };

  const handleEdit = () => {
    // Force re-render to update task lists
    forceUpdate({});
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowTaskView(true);
  };

  const handleTaskUpdated = () => {
    forceUpdate({});
  };

  const taskCounts = {
    todo: tasks.filter((t: { status: string }) => t.status === "todo").length,
    in_progress: tasks.filter((t: { status: string }) => t.status === "in_progress").length,
    done: tasks.filter((t: { status: string }) => t.status === "done").length,
    cancelled: tasks.filter((t: { status: string }) => t.status === "cancelled").length,
  };

  return (
    <div className="container mx-auto p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">Manage your to-do list</p>
        </div>
        <AddTaskDialog onTaskAdded={handleTaskAdded} />
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TaskStatus)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="todo" className="text-xs sm:text-sm">
            To Do
            {taskCounts.todo > 0 && (
              <span className="ml-2 text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                {taskCounts.todo}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="text-xs sm:text-sm">
            In Progress
            {taskCounts.in_progress > 0 && (
              <span className="ml-2 text-xs bg-blue-200 dark:bg-blue-800 px-2 py-0.5 rounded-full">
                {taskCounts.in_progress}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="done" className="text-xs sm:text-sm">
            Done
            {taskCounts.done > 0 && (
              <span className="ml-2 text-xs bg-green-200 dark:bg-green-800 px-2 py-0.5 rounded-full">
                {taskCounts.done}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="text-xs sm:text-sm">
            Cancelled
            {taskCounts.cancelled > 0 && (
              <span className="ml-2 text-xs bg-red-200 dark:bg-red-800 px-2 py-0.5 rounded-full">
                {taskCounts.cancelled}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todo">
          <TaskList tasks={tasks} status="todo" onStatusChange={handleStatusChange} onDelete={handleDelete} onEdit={handleEdit} onTaskClick={handleTaskClick} />
        </TabsContent>

        <TabsContent value="in_progress">
          <TaskList tasks={tasks} status="in_progress" onStatusChange={handleStatusChange} onDelete={handleDelete} onEdit={handleEdit} onTaskClick={handleTaskClick} />
        </TabsContent>

        <TabsContent value="done">
          <TaskList tasks={tasks} status="done" onStatusChange={handleStatusChange} onDelete={handleDelete} onEdit={handleEdit} onTaskClick={handleTaskClick} />
        </TabsContent>

        <TabsContent value="cancelled">
          <TaskList tasks={tasks} status="cancelled" onStatusChange={handleStatusChange} onDelete={handleDelete} onEdit={handleEdit} onTaskClick={handleTaskClick} />
        </TabsContent>
      </Tabs>

      <TaskViewDialog
        task={selectedTask}
        open={showTaskView}
        onOpenChange={setShowTaskView}
        onTaskUpdated={handleTaskUpdated}
      />
    </div>
  );
}
