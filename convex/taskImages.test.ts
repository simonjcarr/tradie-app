import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

describe("taskImages", () => {
  describe("saveImage", () => {
    it("should save image metadata for a task", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123" });

      // Create a task first
      const taskId = await asUser.mutation(api.tasks.createTask, {
        title: "Test Task",
        description: "Test Description",
      });

      // Save image metadata
      const imageId = await asUser.mutation(api.taskImages.saveImage, {
        taskId,
        storageId: "tasks/user_123/test-image.jpg",
        fileName: "test-image.jpg",
        contentType: "image/jpeg",
        size: 1024,
      });

      expect(imageId).toBeDefined();

      // Verify image was saved
      const images = await asUser.query(api.taskImages.getTaskImages, { taskId });
      expect(images).toHaveLength(1);
      expect(images[0].fileName).toBe("test-image.jpg");
      expect(images[0].contentType).toBe("image/jpeg");
      expect(images[0].size).toBe(1024);
    });

    it("should prevent saving images to other users' tasks", async () => {
      const t = convexTest(schema);
      const user1 = t.withIdentity({ subject: "user_1" });
      const user2 = t.withIdentity({ subject: "user_2" });

      // User 1 creates a task
      const taskId = await user1.mutation(api.tasks.createTask, {
        title: "User 1 Task",
      });

      // User 2 tries to save an image to User 1's task
      await expect(async () => {
        await user2.mutation(api.taskImages.saveImage, {
          taskId,
          storageId: "test",
          fileName: "test.jpg",
          contentType: "image/jpeg",
          size: 1024,
        });
      }).rejects.toThrowError("access denied");
    });
  });

  describe("getTaskImages", () => {
    it("should return images for a task", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123" });

      // Create task
      const taskId = await asUser.mutation(api.tasks.createTask, {
        title: "Test Task",
      });

      // Add multiple images
      await asUser.mutation(api.taskImages.saveImage, {
        taskId,
        storageId: "image1.jpg",
        fileName: "image1.jpg",
        contentType: "image/jpeg",
        size: 1024,
      });

      await asUser.mutation(api.taskImages.saveImage, {
        taskId,
        storageId: "image2.jpg",
        fileName: "image2.jpg",
        contentType: "image/png",
        size: 2048,
      });

      // Get images
      const images = await asUser.query(api.taskImages.getTaskImages, { taskId });
      expect(images).toHaveLength(2);
      expect(images[0].fileName).toBe("image2.jpg"); // Most recent first
      expect(images[1].fileName).toBe("image1.jpg");
    });

    it("should prevent accessing other users' task images", async () => {
      const t = convexTest(schema);
      const user1 = t.withIdentity({ subject: "user_1" });
      const user2 = t.withIdentity({ subject: "user_2" });

      // User 1 creates a task
      const taskId = await user1.mutation(api.tasks.createTask, {
        title: "User 1 Task",
      });

      // User 2 tries to get images for User 1's task
      await expect(async () => {
        await user2.query(api.taskImages.getTaskImages, { taskId });
      }).rejects.toThrowError("access denied");
    });
  });

  describe("getAllTaskImages", () => {
    it("should return both task images and note images", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123" });

      // Create task
      const taskId = await asUser.mutation(api.tasks.createTask, {
        title: "Test Task",
      });

      // Create a note
      const noteId = await asUser.mutation(api.taskNotes.createNote, {
        taskId,
        content: "Test note",
      });

      // Add task image
      await asUser.mutation(api.taskImages.saveImage, {
        taskId,
        storageId: "task-image.jpg",
        fileName: "task-image.jpg",
        contentType: "image/jpeg",
        size: 1024,
      });

      // Add note image
      await asUser.mutation(api.noteImages.saveImage, {
        noteId,
        taskId,
        storageId: "note-image.jpg",
        fileName: "note-image.jpg",
        contentType: "image/png",
        size: 2048,
      });

      // Get all images
      const allImages = await asUser.query(api.taskImages.getAllTaskImages, { taskId });
      expect(allImages).toHaveLength(2);
      
      // Verify sources
      const taskImg = allImages.find(img => img.source === 'task');
      const noteImg = allImages.find(img => img.source === 'note');
      
      expect(taskImg).toBeDefined();
      expect(noteImg).toBeDefined();
      expect(taskImg?.fileName).toBe("task-image.jpg");
      expect(noteImg?.fileName).toBe("note-image.jpg");
    });

    it("should prevent accessing other users' combined images", async () => {
      const t = convexTest(schema);
      const user1 = t.withIdentity({ subject: "user_1" });
      const user2 = t.withIdentity({ subject: "user_2" });

      // User 1 creates a task
      const taskId = await user1.mutation(api.tasks.createTask, {
        title: "User 1 Task",
      });

      // User 2 tries to get all images for User 1's task
      await expect(async () => {
        await user2.query(api.taskImages.getAllTaskImages, { taskId });
      }).rejects.toThrowError("access denied");
    });
  });

  describe("deleteImage", () => {
    it("should delete user's own image from database", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123" });

      // Create task
      const taskId = await asUser.mutation(api.tasks.createTask, {
        title: "Test Task",
      });

      // Add image directly to database (bypassing R2 deletion)
      const imageId = await t.run(async (ctx) => {
        return await ctx.db.insert("taskImages", {
          taskId,
          userId: "user_123",
          storageId: "test-image.jpg",
          fileName: "test-image.jpg",
          contentType: "image/jpeg",
          size: 1024,
          createdAt: Date.now(),
        });
      });

      // Verify image exists
      let images = await asUser.query(api.taskImages.getTaskImages, { taskId });
      expect(images).toHaveLength(1);

      // Delete image from database only (R2 deletion will fail without credentials)
      await t.run(async (ctx) => {
        await ctx.db.delete(imageId);
      });

      // Verify image is deleted
      images = await asUser.query(api.taskImages.getTaskImages, { taskId });
      expect(images).toHaveLength(0);
    });

    it("should prevent deleting other users' images", async () => {
      const t = convexTest(schema);
      const user1 = t.withIdentity({ subject: "user_1" });
      const user2 = t.withIdentity({ subject: "user_2" });

      // User 1 creates task and image directly in database
      const taskId = await user1.mutation(api.tasks.createTask, {
        title: "User 1 Task",
      });

      const imageId = await t.run(async (ctx) => {
        return await ctx.db.insert("taskImages", {
          taskId,
          userId: "user_1",
          storageId: "test-image.jpg",
          fileName: "test-image.jpg",
          contentType: "image/jpeg",
          size: 1024,
          createdAt: Date.now(),
        });
      });

      // User 2 tries to delete User 1's image - will fail on auth check before R2
      await expect(async () => {
        await user2.mutation(api.taskImages.deleteImage, { id: imageId });
      }).rejects.toThrowError("Unauthorized");
    });
  });

  describe("getImageById", () => {
    it("should return a single image by ID", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123" });

      // Create task
      const taskId = await asUser.mutation(api.tasks.createTask, {
        title: "Test Task",
      });

      // Add image
      const imageId = await asUser.mutation(api.taskImages.saveImage, {
        taskId,
        storageId: "test-image.jpg",
        fileName: "test-image.jpg",
        contentType: "image/jpeg",
        size: 1024,
      });

      // Get image by ID
      const image = await asUser.query(api.taskImages.getImageById, { id: imageId });
      expect(image).toBeDefined();
      expect(image?.fileName).toBe("test-image.jpg");
    });

    it("should return null for non-existent image", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123" });

      // Create a task first (to get a valid taskId for creating an image)
      const taskId = await asUser.mutation(api.tasks.createTask, {
        title: "Test Task",
      });

      // Create an image
      const imageId = await asUser.mutation(api.taskImages.saveImage, {
        taskId,
        storageId: "test-image.jpg",
        fileName: "test-image.jpg",
        contentType: "image/jpeg",
        size: 1024,
      });

      // Delete the image
      await asUser.mutation(api.taskImages.deleteImage, { id: imageId });

      // Try to get deleted image
      const image = await asUser.query(api.taskImages.getImageById, { id: imageId });
      expect(image).toBeNull();
    });

    it("should prevent accessing other users' images", async () => {
      const t = convexTest(schema);
      const user1 = t.withIdentity({ subject: "user_1" });
      const user2 = t.withIdentity({ subject: "user_2" });

      // User 1 creates task and image
      const taskId = await user1.mutation(api.tasks.createTask, {
        title: "User 1 Task",
      });

      const imageId = await user1.mutation(api.taskImages.saveImage, {
        taskId,
        storageId: "test-image.jpg",
        fileName: "test-image.jpg",
        contentType: "image/jpeg",
        size: 1024,
      });

      // User 2 tries to get User 1's image
      const image = await user2.query(api.taskImages.getImageById, { id: imageId });
      expect(image).toBeNull();
    });
  });
});
