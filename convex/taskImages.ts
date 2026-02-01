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
function generateStorageId(userId: string, taskId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `tasks/${userId}/${taskId}/${timestamp}-${random}`;
}

// Internal query to get task and verify access
export const internalGetTaskWithAccess = internalQuery({
  args: {
    taskId: v.id('tasks'),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      return null;
    }

    // Verify task belongs to user
    if (task.userId !== args.userId) {
      return null;
    }

    return task;
  },
});

// Internal query to get image and verify access
export const internalGetImageWithAccess = internalQuery({
  args: {
    imageId: v.id('taskImages'),
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
    taskId: v.id('tasks'),
    fileName: v.string(),
    contentType: v.string(),
    size: v.number(),
  },
  handler: async (ctx, args): Promise<{ uploadUrl: string; storageId: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Verify task belongs to user
    const task = await ctx.runQuery(internal.taskImages.internalGetTaskWithAccess, {
      taskId: args.taskId,
      userId: identity.subject,
    });

    if (!task) {
      throw new Error('Task not found or access denied');
    }

    const config = getR2Config();
    const storageId = generateStorageId(identity.subject, args.taskId);
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
    imageIds: v.array(v.id('taskImages')),
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
      const access = await ctx.runQuery(internal.taskImages.internalGetImageWithAccess, {
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

    // Verify task belongs to user
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== identity.subject) {
      throw new Error('Task not found or access denied');
    }

    const now = Date.now();
    const imageId = await ctx.db.insert('taskImages', {
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
    id: v.id('taskImages'),
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

// Get all images for a task
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
      .query('taskImages')
      .withIndex('by_task', (q) => q.eq('taskId', args.taskId))
      .order('desc')
      .collect();

    return images;
  },
});

// Get all images for a task including note images
export const getAllTaskImages = query({
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

    // Get task images
    const taskImages = await ctx.db
      .query('taskImages')
      .withIndex('by_task', (q) => q.eq('taskId', args.taskId))
      .order('desc')
      .collect();

    // Get note images for this task
    const noteImages = await ctx.db
      .query('noteImages')
      .withIndex('by_task', (q) => q.eq('taskId', args.taskId))
      .order('desc')
      .collect();

    // Combine and sort by createdAt (newest first)
    const allImages = [
      ...taskImages.map(img => ({ ...img, source: 'task' as const })),
      ...noteImages.map(img => ({ ...img, source: 'note' as const })),
    ].sort((a, b) => b.createdAt - a.createdAt);

    return allImages;
  },
});

// Delete an image
export const deleteImage = mutation({
  args: {
    id: v.id('taskImages'),
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
    await ctx.scheduler.runAfter(0, internal.taskImages.internalDeleteFromR2, {
      storageId: image.storageId,
    });

    // Delete from database
    await ctx.db.delete(args.id);
    console.log('Image deleted from database:', args.id);
  },
});
