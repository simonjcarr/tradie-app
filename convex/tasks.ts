import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

// Get all tasks for the authenticated user with task type and customer details
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

    // Enrich tasks with task type, customer information, and most recent note
    const enrichedTasks = await Promise.all(
      tasks.map(async (task) => {
        let taskType = null;
        if (task.taskTypeId) {
          taskType = await ctx.db.get(task.taskTypeId);
        }
        let customer = null;
        if (task.customerId) {
          customer = await ctx.db.get(task.customerId);
        }

        // Get the most recent note for this task
        const notes = await ctx.db
          .query('taskNotes')
          .withIndex('by_task', (q) => q.eq('taskId', task._id))
          .order('desc')
          .take(1);
        const mostRecentNote = notes.length > 0 ? notes[0] : null;

        return {
          ...task,
          taskType: taskType
            ? {
                _id: taskType._id,
                name: taskType.name,
                color: taskType.color,
              }
            : null,
          customer: customer
            ? {
                _id: customer._id,
                name: customer.name,
                phone: customer.phone,
              }
            : null,
          mostRecentNote: mostRecentNote
            ? {
                _id: mostRecentNote._id,
                content: mostRecentNote.content,
                createdAt: mostRecentNote.createdAt,
              }
            : null,
        };
      })
    );

    // Sort by due date (nulls last), then by creation date
    return enrichedTasks.sort((a, b) => {
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
    taskTypeId: v.optional(v.id('taskTypes')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Validate taskTypeId if provided
    if (args.taskTypeId) {
      const taskType = await ctx.db.get(args.taskTypeId);
      if (!taskType || taskType.userId !== identity.subject) {
        throw new Error('Invalid task type');
      }
    }

    const now = Date.now();
    const taskId = await ctx.db.insert('tasks', {
      title: args.title,
      description: args.description,
      status: 'todo',
      priority: args.priority ?? 'medium',
      dueDate: args.dueDate,
      customerId: args.customerId,
      taskTypeId: args.taskTypeId,
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
    taskTypeId: v.optional(v.id('taskTypes')),
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

    // Validate taskTypeId if provided
    if (args.taskTypeId) {
      const taskType = await ctx.db.get(args.taskTypeId);
      if (!taskType || taskType.userId !== identity.subject) {
        throw new Error('Invalid task type');
      }
    }

    const updates: Partial<typeof task> = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.priority !== undefined) updates.priority = args.priority;
    if (args.dueDate !== undefined) updates.dueDate = args.dueDate;
    if (args.customerId !== undefined) updates.customerId = args.customerId;
    if (args.taskTypeId !== undefined) updates.taskTypeId = args.taskTypeId;

    await ctx.db.patch(args.id, updates);
  },
});

// Get tasks for a specific customer with task type details
export const getTasksByCustomer = query({
  args: {
    customerId: v.id('customers'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Verify customer belongs to user
    const customer = await ctx.db.get(args.customerId);
    if (!customer || customer.userId !== identity.subject) {
      throw new Error('Customer not found or access denied');
    }

    const tasks = await ctx.db
      .query('tasks')
      .withIndex('by_customer', (q) => q.eq('customerId', args.customerId))
      .order('desc')
      .collect();

    // Enrich tasks with task type information and most recent note
    const enrichedTasks = await Promise.all(
      tasks.map(async (task) => {
        let taskType = null;
        if (task.taskTypeId) {
          taskType = await ctx.db.get(task.taskTypeId);
        }

        // Get the most recent note for this task
        const notes = await ctx.db
          .query('taskNotes')
          .withIndex('by_task', (q) => q.eq('taskId', task._id))
          .order('desc')
          .take(1);
        const mostRecentNote = notes.length > 0 ? notes[0] : null;

        return {
          ...task,
          taskType: taskType
            ? {
                _id: taskType._id,
                name: taskType.name,
                color: taskType.color,
              }
            : null,
          mostRecentNote: mostRecentNote
            ? {
                _id: mostRecentNote._id,
                content: mostRecentNote.content,
                createdAt: mostRecentNote.createdAt,
              }
            : null,
        };
      })
    );

    // Sort by due date (nulls last), then by creation date
    return enrichedTasks.sort((a, b) => {
      if (a.dueDate && b.dueDate) {
        return a.dueDate - b.dueDate;
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return b.createdAt - a.createdAt;
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
