"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { ArrowLeft, User, Phone, Mail, MapPin, FileText, Edit, Trash2, Plus, CheckSquare } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Id } from "@/convex/_generated/dataModel";

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const customerId = params.id as Id<"customers">;

  const customer = useQuery(api.customers.getCustomer, { id: customerId });
  const taskTypes = useQuery(api.taskTypes.getTaskTypes);
  const customerTasks = useQuery(api.tasks.getTasksByCustomer, { customerId });
  const deleteCustomer = useMutation(api.customers.deleteCustomer);
  const createTask = useMutation(api.tasks.createTask);
  const createDefaultTaskTypes = useMutation(api.taskTypes.createDefaultTaskTypes);

  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    taskTypeId: "",
    priority: "medium" as "low" | "medium" | "high",
    dueDate: "",
  });

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this customer?")) {
      return;
    }

    try {
      await deleteCustomer({ id: customerId as Id<"customers"> });
      toast({
        title: "Customer deleted",
        description: "The customer has been removed.",
      });
      router.push("/customers");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete customer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateTask = async () => {
    if (!taskForm.title.trim()) {
      toast({
        title: "Error",
        description: "Task title is required",
        variant: "destructive",
      });
      return;
    }

    if (!taskForm.taskTypeId) {
      toast({
        title: "Error",
        description: "Please select a task type",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingTask(true);
    try {
      await createTask({
        title: taskForm.title,
        description: taskForm.description || undefined,
        taskTypeId: taskForm.taskTypeId as Id<"taskTypes">,
        priority: taskForm.priority,
        dueDate: taskForm.dueDate ? new Date(taskForm.dueDate).getTime() : undefined,
        customerId,
      });

      toast({
        title: "Task created",
        description: "The task has been created successfully.",
      });

      setTaskForm({
        title: "",
        description: "",
        taskTypeId: "",
        priority: "medium",
        dueDate: "",
      });
      setIsTaskDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleCreateDefaultTypes = async () => {
    try {
      await createDefaultTaskTypes({});
      toast({
        title: "Task types created",
        description: "Default task types have been created.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create task types. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (customer === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-screen">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (customer === null) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background border-b border-border">
          <div className="flex items-center justify-between p-4">
            <Link href="/customers">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold">Customer Not Found</h1>
            <div className="w-10" />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <User className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Customer not found</h2>
          <p className="text-muted-foreground mb-4">
            The customer you're looking for doesn't exist or you don't have access.
          </p>
          <Link href="/customers">
            <Button>Back to Customers</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Link href="/customers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Customer Details</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4 pb-32 max-w-lg mx-auto">
        {/* Customer Name Card */}
        <Card className="mb-4 border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-secondary" />
              Name
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{customer.name}</p>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="h-4 w-4 text-secondary" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Phone</p>
              <a
                href={`tel:${customer.phone}`}
                className="text-lg font-medium text-secondary hover:underline"
              >
                {customer.phone}
              </a>
            </div>
            {customer.email && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <a
                  href={`mailto:${customer.email}`}
                  className="text-base text-secondary hover:underline"
                >
                  {customer.email}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Address */}
        {(customer.address || customer.postcode) && (
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-secondary" />
                Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {customer.address && (
                <p className="text-base">{customer.address}</p>
              )}
              {customer.postcode && (
                <p className="text-base font-medium">{customer.postcode}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {customer.notes && (
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-secondary" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base whitespace-pre-wrap">{customer.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Tasks Section */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-secondary" />
                Tasks
              </CardTitle>
              <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create Task</DialogTitle>
                    <DialogDescription>
                      Create a new task for {customer.name}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={taskForm.title}
                        onChange={(e) =>
                          setTaskForm({ ...taskForm, title: e.target.value })
                        }
                        placeholder="Enter task title"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="taskType">Task Type *</Label>
                      {taskTypes && taskTypes.length > 0 ? (
                        <Select
                          value={taskForm.taskTypeId}
                          onValueChange={(value) =>
                            setTaskForm({ ...taskForm, taskTypeId: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select task type" />
                          </SelectTrigger>
                          <SelectContent>
                            {taskTypes.map((type) => (
                              <SelectItem key={type._id} value={type._id}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: type.color }}
                                  />
                                  {type.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            No task types found. Create default types to get started.
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleCreateDefaultTypes}
                          >
                            Create Default Task Types
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={taskForm.priority}
                        onValueChange={(value: "low" | "medium" | "high") =>
                          setTaskForm({ ...taskForm, priority: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="dueDate">Due Date</Label>
                      <Input
                        id="dueDate"
                        type="datetime-local"
                        value={taskForm.dueDate}
                        onChange={(e) =>
                          setTaskForm({ ...taskForm, dueDate: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={taskForm.description}
                        onChange={(e) =>
                          setTaskForm({ ...taskForm, description: e.target.value })
                        }
                        placeholder="Enter task description (optional)"
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleCreateTask}
                      disabled={isCreatingTask || !taskForm.taskTypeId}
                    >
                      {isCreatingTask ? "Creating..." : "Create Task"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {customerTasks === undefined ? (
              <p className="text-sm text-muted-foreground">Loading tasks...</p>
            ) : customerTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks yet</p>
            ) : (
              <div className="space-y-3">
                {customerTasks.map((task) => (
                  <div
                    key={task._id}
                    className="flex items-start gap-3 p-3 rounded-lg border"
                  >
                    <div
                      className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                      style={{
                        backgroundColor: task.taskType?.color || "#ccc",
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{task.title}</p>
                      {task.taskType && (
                        <p className="text-xs text-muted-foreground">
                          {task.taskType.name}
                        </p>
                      )}
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            task.priority === "high"
                              ? "bg-red-100 text-red-800"
                              : task.priority === "medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {task.priority}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            task.status === "done"
                              ? "bg-green-100 text-green-800"
                              : task.status === "in_progress"
                              ? "bg-blue-100 text-blue-800"
                              : task.status === "cancelled"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {task.status.replace("_", " ")}
                        </span>
                        {task.dueDate && (
                          <span className="text-xs text-muted-foreground">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-background border-t border-border lg:static lg:border-0 lg:p-0 lg:mt-6">
          <div className="flex gap-3 max-w-lg mx-auto">
            <Link href={`/customers/${customerId}/edit`} className="flex-1">
              <Button variant="outline" className="w-full h-14 text-lg gap-2">
                <Edit className="h-5 w-5" />
                Edit
              </Button>
            </Link>
            <Button
              variant="destructive"
              className="flex-1 h-14 text-lg gap-2"
              onClick={handleDelete}
            >
              <Trash2 className="h-5 w-5" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
