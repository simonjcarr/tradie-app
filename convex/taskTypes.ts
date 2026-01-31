import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

// Default task types with their colors
const DEFAULT_TASK_TYPES = [
  { name: 'Call Back', color: '#3B82F6', description: 'Return a call to the customer' },
  { name: 'Quote', color: '#10B981', description: 'Prepare and send a quote' },
  { name: 'Create Invoice', color: '#F59E0B', description: 'Create and send an invoice' },
  { name: 'Site Visit', color: '#8B5CF6', description: 'Physical visit to assess job requirements' },
  { name: 'Follow Up', color: '#EC4899', description: 'General follow-up on quotes or previous work' },
  { name: 'Schedule Job', color: '#06B6D4', description: 'Book a time to do the actual work' },
  { name: 'Order Materials', color: '#F97316', description: 'Purchase/order supplies needed for a job' },
  { name: 'Send Reminder', color: '#84CC16', description: 'Payment or appointment reminder' },
  { name: 'Collect Payment', color: '#EF4444', description: 'Follow up on outstanding invoices' },
  { name: 'Maintenance Check', color: '#14B8A6', description: 'Scheduled maintenance/revisits' },
  { name: 'Warranty Work', color: '#6366F1', description: 'Callback for warranty-related issues' },
];

// Get all task types for the authenticated user
export const getTaskTypes = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const taskTypes = await ctx.db
      .query('taskTypes')
      .withIndex('by_user', (q) => q.eq('userId', identity.subject))
      .order('asc')
      .collect();

    return taskTypes;
  },
});

// Get a single task type by ID
export const getTaskType = query({
  args: {
    id: v.id('taskTypes'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const taskType = await ctx.db.get(args.id);

    if (!taskType || taskType.userId !== identity.subject) {
      return null;
    }

    return taskType;
  },
});

// Create default task types for a new user
export const createDefaultTaskTypes = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const now = Date.now();
    const createdIds: string[] = [];

    for (const defaultType of DEFAULT_TASK_TYPES) {
      // Check if this type already exists for the user
      const existing = await ctx.db
        .query('taskTypes')
        .withIndex('by_user_name', (q) =>
          q.eq('userId', identity.subject).eq('name', defaultType.name)
        )
        .first();

      if (!existing) {
        const id = await ctx.db.insert('taskTypes', {
          userId: identity.subject,
          name: defaultType.name,
          color: defaultType.color,
          description: defaultType.description,
          isDefault: true,
          createdAt: now,
          updatedAt: now,
        });
        createdIds.push(id);
      }
    }

    return createdIds;
  },
});

// Create a custom task type
export const createTaskType = mutation({
  args: {
    name: v.string(),
    color: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Validate color format (hex code)
    if (!args.color.match(/^#[0-9A-Fa-f]{6}$/)) {
      throw new Error('Color must be a valid hex code (e.g., #FF5733)');
    }

    const now = Date.now();
    const taskTypeId = await ctx.db.insert('taskTypes', {
      userId: identity.subject,
      name: args.name.trim(),
      color: args.color.toUpperCase(),
      description: args.description?.trim(),
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    });

    return taskTypeId;
  },
});

// Update a task type
export const updateTaskType = mutation({
  args: {
    id: v.id('taskTypes'),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const taskType = await ctx.db.get(args.id);
    if (!taskType) {
      throw new Error('Task type not found');
    }

    // Verify the task type belongs to the user
    if (taskType.userId !== identity.subject) {
      throw new Error('Unauthorized');
    }

    // Validate color format if provided
    if (args.color !== undefined && !args.color.match(/^#[0-9A-Fa-f]{6}$/)) {
      throw new Error('Color must be a valid hex code (e.g., #FF5733)');
    }

    const updates: Partial<typeof taskType> = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name.trim();
    if (args.color !== undefined) updates.color = args.color.toUpperCase();
    if (args.description !== undefined) updates.description = args.description?.trim();

    await ctx.db.patch(args.id, updates);
  },
});

// Delete a task type
export const deleteTaskType = mutation({
  args: {
    id: v.id('taskTypes'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const taskType = await ctx.db.get(args.id);
    if (!taskType) {
      throw new Error('Task type not found');
    }

    // Verify the task type belongs to the user
    if (taskType.userId !== identity.subject) {
      throw new Error('Unauthorized');
    }

    // Check if any tasks are using this task type
    const tasksUsingType = await ctx.db
      .query('tasks')
      .withIndex('by_user', (q) => q.eq('userId', identity.subject))
      .filter((q) => q.eq(q.field('taskTypeId'), args.id))
      .collect();

    if (tasksUsingType.length > 0) {
      throw new Error('Cannot delete task type that is in use by tasks');
    }

    await ctx.db.delete(args.id);
  },
});
