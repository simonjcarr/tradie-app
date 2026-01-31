import { v } from 'convex/values';
import { query, mutation, action, internalQuery, internalAction } from './_generated/server';
import { internal } from './_generated/api';
import { getR2Config } from './r2Storage';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize R2 client
function getR2Client() {
  const config = getR2Config();
  return new S3Client({
    region: 'auto',
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

// Generate a unique storage ID for an image
function generateStorageId(userId: string, noteId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `notes/${userId}/${noteId}/${timestamp}-${random}`;
}

// Internal query to get note and verify access
export const internalGetNoteWithAccess = internalQuery({
  args: {
    noteId: v.id('taskNotes'),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.noteId);
    if (!note) {
      return null;
    }
    
    // Verify task belongs to user
    const task = await ctx.db.get(note.taskId);
    if (!task || task.userId !== args.userId) {
      return null;
    }
    
    return { note, task };
  },
});

// Internal query to get image and verify access
export const internalGetImageWithAccess = internalQuery({
  args: {
    imageId: v.id('noteImages'),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const image = await ctx.db.get(args.imageId);
    if (!image) {
      return null;
    }
    
    // Verify task belongs to user
    const task = await ctx.db.get(image.taskId);
    if (!task || task.userId !== args.userId) {
      return null;
    }
    
    return { image, task };
  },
});

// Internal action to delete image from R2
export const internalDeleteFromR2 = internalAction({
  args: {
    storageId: v.string(),
  },
  handler: async (ctx, args) => {
    const config = getR2Config();
    const client = getR2Client();

    try {
      console.log('Deleting from R2:', {
        bucket: config.bucketName,
        key: args.storageId,
      });
      const result = await client.send(
        new DeleteObjectCommand({
          Bucket: config.bucketName,
          Key: args.storageId,
        })
      );
      console.log('R2 delete successful:', result);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete image from R2:', error);
      // Log more details about the error
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack,
        });
      }
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
});

// Generate a presigned URL for uploading an image to R2
export const generateUploadUrl = action({
  args: {
    noteId: v.id('taskNotes'),
    fileName: v.string(),
    contentType: v.string(),
    size: v.number(),
  },
  handler: async (ctx, args): Promise<{ uploadUrl: string; storageId: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Verify note belongs to user
    const access = await ctx.runQuery(internal.noteImages.internalGetNoteWithAccess, {
      noteId: args.noteId,
      userId: identity.subject,
    });
    
    if (!access) {
      throw new Error('Note not found or access denied');
    }

    const config = getR2Config();
    const storageId = generateStorageId(identity.subject, args.noteId);
    const client = getR2Client();

    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: storageId,
      ContentType: args.contentType,
    });

    // Generate presigned URL valid for 15 minutes
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 900 });

    return {
      uploadUrl,
      storageId,
    };
  },
});

// Generate presigned URLs for multiple images (batch operation)
export const generateDownloadUrls = action({
  args: {
    imageIds: v.array(v.id('noteImages')),
  },
  handler: async (ctx, args): Promise<{ urls: Record<string, string> }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const config = getR2Config();
    const client = getR2Client();
    const urls: Record<string, string> = {};

    for (const imageId of args.imageIds) {
      // Verify user has access to this image
      const access = await ctx.runQuery(internal.noteImages.internalGetImageWithAccess, {
        imageId,
        userId: identity.subject,
      });
      
      if (!access) continue;

      const command = new GetObjectCommand({
        Bucket: config.bucketName,
        Key: access.image.storageId,
      });

      // Generate presigned URL valid for 5 minutes
      const downloadUrl = await getSignedUrl(client, command, { expiresIn: 300 });
      urls[imageId] = downloadUrl;
    }

    return { urls };
  },
});

// Save image metadata after successful upload
export const saveImage = mutation({
  args: {
    noteId: v.id('taskNotes'),
    taskId: v.id('tasks'),
    storageId: v.string(),
    fileName: v.string(),
    contentType: v.string(),
    size: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Verify note belongs to user
    const note = await ctx.db.get(args.noteId);
    if (!note || note.userId !== identity.subject) {
      throw new Error('Note not found or access denied');
    }

    const now = Date.now();
    const imageId = await ctx.db.insert('noteImages', {
      noteId: args.noteId,
      taskId: args.taskId,
      userId: identity.subject,
      storageId: args.storageId,
      fileName: args.fileName,
      contentType: args.contentType,
      size: args.size,
      createdAt: now,
    });

    return imageId;
  },
});

// Get a single image by ID
export const getImageById = query({
  args: {
    id: v.id('noteImages'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const image = await ctx.db.get(args.id);
    if (!image) {
      return null;
    }

    // Verify user has access
    const task = await ctx.db.get(image.taskId);
    if (!task || task.userId !== identity.subject) {
      return null;
    }

    return image;
  },
});

// Get all images for a note
export const getNoteImages = query({
  args: {
    noteId: v.id('taskNotes'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Verify note belongs to user
    const note = await ctx.db.get(args.noteId);
    if (!note) {
      throw new Error('Note not found');
    }

    // Verify task belongs to user
    const task = await ctx.db.get(note.taskId);
    if (!task || task.userId !== identity.subject) {
      throw new Error('Access denied');
    }

    const images = await ctx.db
      .query('noteImages')
      .withIndex('by_note', (q) => q.eq('noteId', args.noteId))
      .order('desc')
      .collect();

    return images;
  },
});

// Get all images for a task (for the expander view)
export const getTaskImages = query({
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

    const images = await ctx.db
      .query('noteImages')
      .withIndex('by_task', (q) => q.eq('taskId', args.taskId))
      .order('desc')
      .collect();

    return images;
  },
});

// Delete an image
export const deleteImage = mutation({
  args: {
    id: v.id('noteImages'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const image = await ctx.db.get(args.id);
    if (!image) {
      throw new Error('Image not found');
    }

    // Verify image belongs to user
    if (image.userId !== identity.subject) {
      throw new Error('Unauthorized');
    }

    // Schedule deletion from R2 using internal action
    await ctx.scheduler.runAfter(0, internal.noteImages.internalDeleteFromR2, {
      storageId: image.storageId,
    });

    // Delete from database
    await ctx.db.delete(args.id);
    console.log('Image deleted from database:', args.id);
  },
});
