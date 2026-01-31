"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Plus, Check, ChevronsUpDown, User, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";

type TaskPriority = "low" | "medium" | "high";

interface Customer {
  _id: Id<"customers">;
  name: string;
  phone: string;
}

interface AddTaskDialogProps {
  onTaskAdded?: () => void;
}

export function AddTaskDialog({ onTaskAdded }: AddTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as TaskPriority,
  });

  const createTask = useMutation(api.tasks.createTask);
  // Get all customers for the user to display in dropdown
  const allCustomers = useQuery(api.customers.getMyCustomers);
  
  // Filter customers based on search query
  const filteredCustomers = allCustomers?.filter((customer: { name: string; phone: string }) => {
    if (!searchQuery || searchQuery.length < 2) return true;
    const query = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(query) ||
      customer.phone.includes(query)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSubmitting(true);
    try {
      await createTask({
        title: formData.title,
        description: formData.description || undefined,
        priority: formData.priority,
        customerId: selectedCustomer?._id,
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
        priority: "medium",
      });
      setSelectedCustomer(null);
      setSearchQuery("");
      setOpen(false);
      onTaskAdded?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerPopoverOpen(false);
    setSearchQuery("");
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setSearchQuery("");
  };

  // Prevent hydration mismatch by not rendering Dialog until mounted
  if (!mounted) {
    return (
      <Button className="w-full sm:w-auto gap-2">
        <Plus className="h-4 w-4" />
        New Task
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto gap-2">
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>
              Create a new task and optionally link it to a client.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Enter task title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter task description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: TaskPriority) =>
                  setFormData({ ...formData, priority: value })
                }
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

            <div className="space-y-2">
              <Label>Client</Label>
              {selectedCustomer ? (
                <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{selectedCustomer.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {selectedCustomer.phone}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearCustomer}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <Popover
                  open={customerPopoverOpen}
                  onOpenChange={setCustomerPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={customerPopoverOpen}
                      className="w-full justify-between"
                    >
                      <span className="text-muted-foreground">
                        Search and select a client...
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search clients by name or phone..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {searchQuery.length < 2 ? (
                            <span className="text-muted-foreground">
                              Type at least 2 characters to search
                            </span>
                          ) : (
                            <span>No clients found</span>
                          )}
                        </CommandEmpty>
                        <CommandGroup>
                          {filteredCustomers?.map((customer: Customer) => (
                            <CommandItem
                              key={customer._id}
                              value={`${customer.name} ${customer.phone}`}
                              onSelect={() =>
                                handleCustomerSelect({
                                  _id: customer._id,
                                  name: customer.name,
                                  phone: customer.phone,
                                })
                              }
                              className="flex items-center justify-between cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{customer.name}</p>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {customer.phone}
                                  </p>
                                </div>
                              </div>
                              <Check className="h-4 w-4 opacity-0" aria-hidden="true" />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.title.trim()}>
              {isSubmitting ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
