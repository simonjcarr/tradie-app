import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

// Get all tasks for the authenticated user
export const getTasks = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const tasks = await ctx.db
      .query('tasks')
      .withIndex('by_user', (q) => q.eq('userId', identity.subject))
      .order('desc')
      .collect();

    // Sort by due date (nulls last), then by creation date
    return tasks.sort((a, b) => {
      // If both have due dates, compare them
      if (a.dueDate && b.dueDate) {
        return a.dueDate - b.dueDate;
      }
      // If only a has due date, a comes first
      if (a.dueDate) return -1;
      // If only b has due date, b comes first
      if (b.dueDate) return 1;
      // Neither has due date, sort by creation date (newest first)
      return b.createdAt - a.createdAt;
    });
  },
});

// Get tasks filtered by status
export const getTasksByStatus = query({
  args: {
    status: v.union(v.literal('todo'), v.literal('in_progress'), v.literal('done'), v.literal('cancelled')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const tasks = await ctx.db
      .query('tasks')
      .withIndex('by_user_status', (q) => 
        q.eq('userId', identity.subject).eq('status', args.status)
      )
      .order('desc')
      .collect();

    // Sort by due date (nulls last), then by creation date
    return tasks.sort((a, b) => {
      if (a.dueDate && b.dueDate) {
        return a.dueDate - b.dueDate;
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return b.createdAt - a.createdAt;
    });
  },
});

// Create a new task
export const createTask = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.optional(v.union(v.literal('low'), v.literal('medium'), v.literal('high'))),
    dueDate: v.optional(v.number()),
    customerId: v.optional(v.id('customers')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const now = Date.now();
    const taskId = await ctx.db.insert('tasks', {
      title: args.title,
      description: args.description,
      status: 'todo',
      priority: args.priority ?? 'medium',
      dueDate: args.dueDate,
      customerId: args.customerId,
      userId: identity.subject,
      createdAt: now,
      updatedAt: now,
    });

    return taskId;
  },
});

// Update task status
export const updateTaskStatus = mutation({
  args: {
    id: v.id('tasks'),
    status: v.union(v.literal('todo'), v.literal('in_progress'), v.literal('done'), v.literal('cancelled')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const task = await ctx.db.get(args.id);
    if (!task) {
      throw new Error('Task not found');
    }

    // Verify the task belongs to the user
    if (task.userId !== identity.subject) {
      throw new Error('Unauthorized');
    }

    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

// Update task fields
export const updateTask = mutation({
  args: {
    id: v.id('tasks'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(v.union(v.literal('low'), v.literal('medium'), v.literal('high'))),
    dueDate: v.optional(v.number()),
    customerId: v.optional(v.id('customers')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const task = await ctx.db.get(args.id);
    if (!task) {
      throw new Error('Task not found');
    }

    // Verify the task belongs to the user
    if (task.userId !== identity.subject) {
      throw new Error('Unauthorized');
    }

    const updates: Partial<typeof task> = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.priority !== undefined) updates.priority = args.priority;
    if (args.dueDate !== undefined) updates.dueDate = args.dueDate;
    if (args.customerId !== undefined) updates.customerId = args.customerId;

    await ctx.db.patch(args.id, updates);
  },
});

// Delete a task
export const deleteTask = mutation({
  args: {
    id: v.id('tasks'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const task = await ctx.db.get(args.id);
    if (!task) {
      throw new Error('Task not found');
    }

    // Verify the task belongs to the user
    if (task.userId !== identity.subject) {
      throw new Error('Unauthorized');
    }

    await ctx.db.delete(args.id);
  },
});
