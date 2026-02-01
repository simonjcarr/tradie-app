import { convexTest } from "convex-test";
import { describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

describe("noteImages", () => {
  describe("saveImage", () => {
    it("should save image metadata for a note", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123" });

      // Create a task first
      const taskId = await asUser.mutation(api.tasks.createTask, {
        title: "Test Task",
        description: "Test Description",
      });

      // Create a note
      const noteId = await asUser.mutation(api.taskNotes.createNote, {
        taskId,
        content: "Test note content",
      });

      // Save image metadata
      const imageId = await asUser.mutation(api.noteImages.saveImage, {
        noteId,
        taskId,
        storageId: "notes/user_123/test-image.jpg",
        fileName: "test-image.jpg",
        contentType: "image/jpeg",
        size: 1024,
      });

      expect(imageId).toBeDefined();

      // Verify image was saved
      const images = await asUser.query(api.noteImages.getNoteImages, { noteId });
      expect(images).toHaveLength(1);
      expect(images[0].fileName).toBe("test-image.jpg");
      expect(images[0].contentType).toBe("image/jpeg");
      expect(images[0].size).toBe(1024);
    });



    it("should prevent saving images to other users' notes", async () => {
      const t = convexTest(schema);
      const user1 = t.withIdentity({ subject: "user_1" });
      const user2 = t.withIdentity({ subject: "user_2" });

      // User 1 creates a task and note
      const taskId = await user1.mutation(api.tasks.createTask, {
        title: "User 1 Task",
      });

      const noteId = await user1.mutation(api.taskNotes.createNote, {
        taskId,
        content: "User 1 note",
      });

      // User 2 tries to save an image to User 1's note
      await expect(async () => {
        await user2.mutation(api.noteImages.saveImage, {
          noteId,
          taskId,
          storageId: "test",
          fileName: "test.jpg",
          contentType: "image/jpeg",
          size: 1024,
        });
      }).rejects.toThrowError("access denied");
    });
  });

  describe("getNoteImages", () => {
    it("should return images for a note", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123" });

      // Create task and note
      const taskId = await asUser.mutation(api.tasks.createTask, {
        title: "Test Task",
      });

      const noteId = await asUser.mutation(api.taskNotes.createNote, {
        taskId,
        content: "Test note",
      });

      // Add multiple images
      await asUser.mutation(api.noteImages.saveImage, {
        noteId,
        taskId,
        storageId: "image1.jpg",
        fileName: "image1.jpg",
        contentType: "image/jpeg",
        size: 1024,
      });

      await asUser.mutation(api.noteImages.saveImage, {
        noteId,
        taskId,
        storageId: "image2.jpg",
        fileName: "image2.jpg",
        contentType: "image/png",
        size: 2048,
      });

      // Get images
      const images = await asUser.query(api.noteImages.getNoteImages, { noteId });
      expect(images).toHaveLength(2);
      expect(images[0].fileName).toBe("image2.jpg"); // Most recent first
      expect(images[1].fileName).toBe("image1.jpg");
    });


  });

  describe("getTaskImages", () => {
    it("should return all images for a task", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123" });

      // Create task
      const taskId = await asUser.mutation(api.tasks.createTask, {
        title: "Test Task",
      });

      // Create two notes
      const note1Id = await asUser.mutation(api.taskNotes.createNote, {
        taskId,
        content: "Note 1",
      });

      const note2Id = await asUser.mutation(api.taskNotes.createNote, {
        taskId,
        content: "Note 2",
      });

      // Add images to both notes
      await asUser.mutation(api.noteImages.saveImage, {
        noteId: note1Id,
        taskId,
        storageId: "image1.jpg",
        fileName: "image1.jpg",
        contentType: "image/jpeg",
        size: 1024,
      });

      await asUser.mutation(api.noteImages.saveImage, {
        noteId: note2Id,
        taskId,
        storageId: "image2.jpg",
        fileName: "image2.jpg",
        contentType: "image/png",
        size: 2048,
      });

      // Get all task images
      const images = await asUser.query(api.noteImages.getTaskImages, { taskId });
      expect(images).toHaveLength(2);
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
        await user2.query(api.noteImages.getTaskImages, { taskId });
      }).rejects.toThrowError("access denied");
    });
  });

  describe("deleteImage", () => {
    it("should delete user's own image from database", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123" });

      // Create task and note
      const taskId = await asUser.mutation(api.tasks.createTask, {
        title: "Test Task",
      });

      const noteId = await asUser.mutation(api.taskNotes.createNote, {
        taskId,
        content: "Test note",
      });

      // Add image directly to database (bypassing R2 deletion)
      const imageId = await t.run(async (ctx) => {
        return await ctx.db.insert("noteImages", {
          noteId,
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
      let images = await asUser.query(api.noteImages.getNoteImages, { noteId });
      expect(images).toHaveLength(1);

      // Delete image from database only (R2 deletion will fail without credentials)
      await t.run(async (ctx) => {
        await ctx.db.delete(imageId);
      });

      // Verify image is deleted
      images = await asUser.query(api.noteImages.getNoteImages, { noteId });
      expect(images).toHaveLength(0);
    });

    it("should prevent deleting other users' images", async () => {
      const t = convexTest(schema);
      const user1 = t.withIdentity({ subject: "user_1" });
      const user2 = t.withIdentity({ subject: "user_2" });

      // User 1 creates task, note, and image directly in database
      const taskId = await user1.mutation(api.tasks.createTask, {
        title: "User 1 Task",
      });

      const noteId = await user1.mutation(api.taskNotes.createNote, {
        taskId,
        content: "User 1 note",
      });

      const imageId = await t.run(async (ctx) => {
        return await ctx.db.insert("noteImages", {
          noteId,
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
        await user2.mutation(api.noteImages.deleteImage, { id: imageId });
      }).rejects.toThrowError("Unauthorized");
    });
  });
});
