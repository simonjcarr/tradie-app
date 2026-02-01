import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

// Get all notes for a task
export const getTaskNotes = query({
  args: {
    taskId: v.id('tasks'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Verify task belongs to user
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== identity.subject) {
      throw new Error('Task not found or access denied');
    }

    const notes = await ctx.db
      .query('taskNotes')
      .withIndex('by_task', (q) => q.eq('taskId', args.taskId))
      .order('desc')
      .collect();

    return notes;
  },
});

// Create a new note
export const createNote = mutation({
  args: {
    taskId: v.id('tasks'),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Verify task belongs to user
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== identity.subject) {
      throw new Error('Task not found or access denied');
    }

    const now = Date.now();
    const noteId = await ctx.db.insert('taskNotes', {
      taskId: args.taskId,
      userId: identity.subject,
      content: args.content,
      createdAt: now,
      updatedAt: now,
    });

    return noteId;
  },
});

// Update a note
export const updateNote = mutation({
  args: {
    id: v.id('taskNotes'),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const note = await ctx.db.get(args.id);
    if (!note) {
      throw new Error('Note not found');
    }

    // Verify note belongs to user
    if (note.userId !== identity.subject) {
      throw new Error('Unauthorized');
    }

    await ctx.db.patch(args.id, {
      content: args.content,
      updatedAt: Date.now(),
    });
  },
});

// Delete a note
export const deleteNote = mutation({
  args: {
    id: v.id('taskNotes'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const note = await ctx.db.get(args.id);
    if (!note) {
      throw new Error('Note not found');
    }

    // Verify note belongs to user
    if (note.userId !== identity.subject) {
      throw new Error('Unauthorized');
    }

    await ctx.db.delete(args.id);
  },
});

// Get a single note by ID (used internally by noteImages)
export const getNoteById = query({
  args: {
    id: v.id('taskNotes'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const note = await ctx.db.get(args.id);
    if (!note || note.userId !== identity.subject) {
      return null;
    }

    return note;
  },
});
