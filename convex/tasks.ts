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

    return await ctx.db
      .query('tasks')
      .withIndex('by_user', (q) => q.eq('userId', identity.subject))
      .order('desc')
      .collect();
  },
});

// Create a new task
export const createTask = mutation({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const taskId = await ctx.db.insert('tasks', {
      text: args.text,
      isCompleted: false,
      userId: identity.subject,
      createdAt: Date.now(),
    });

    return taskId;
  },
});

// Toggle task completion status
export const toggleTask = mutation({
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

    await ctx.db.patch(args.id, {
      isCompleted: !task.isCompleted,
    });
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
