import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

describe("tasks", () => {
  describe("getTasks", () => {
    it("should require authentication", async () => {
      const t = convexTest(schema);
      
      await expect(async () => {
        await t.query(api.tasks.getTasks, {});
      }).rejects.toThrowError("Not authenticated");
    });

    it("should return empty array when no tasks exist", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      const tasks = await asUser.query(api.tasks.getTasks, {});
      expect(tasks).toEqual([]);
    });

    it("should return only current user's tasks", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });
      const asOtherUser = t.withIdentity({ subject: "user_456", name: "Other User" });

      // Create task as current user
      await asUser.mutation(api.tasks.createTask, {
        title: "My task",
        description: "Task description",
        priority: "medium",
      });

      // Create task as other user
      await asOtherUser.mutation(api.tasks.createTask, {
        title: "Other user's task",
        description: "Other description",
        priority: "low",
      });

      const tasks = await asUser.query(api.tasks.getTasks, {});
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe("My task");
    });

    it("should return tasks sorted by due date then creation date", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      const now = Date.now();
      
      await asUser.mutation(api.tasks.createTask, {
        title: "Task 1",
        description: "Description 1",
        priority: "medium",
        dueDate: now + 86400000, // Tomorrow
      });

      await asUser.mutation(api.tasks.createTask, {
        title: "Task 2",
        description: "Description 2",
        priority: "high",
        dueDate: now, // Today
      });

      const tasks = await asUser.query(api.tasks.getTasks, {});
      expect(tasks).toHaveLength(2);
      expect(tasks[0].title).toBe("Task 2"); // Due today comes first
      expect(tasks[1].title).toBe("Task 1"); // Due tomorrow comes second
    });
  });

  describe("createTask", () => {
    it("should require authentication", async () => {
      const t = convexTest(schema);
      
      await expect(async () => {
        await t.mutation(api.tasks.createTask, {
          title: "Test task",
          description: "Description",
          priority: "medium",
        });
      }).rejects.toThrowError("Not authenticated");
    });

    it("should create task with all fields", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      // First create a customer to get a valid ID
      const customerId = await asUser.mutation(api.customers.createCustomer, {
        name: "John Doe",
        phone: "1234567890",
      });

      const taskId = await asUser.mutation(api.tasks.createTask, {
        title: "Call back customer",
        description: "Return call about quote",
        priority: "high",
        dueDate: Date.now() + 3600000,
        customerId,
      });

      expect(taskId).toBeDefined();

      const tasks = await asUser.query(api.tasks.getTasks, {});
      expect(tasks).toHaveLength(1);
      expect(tasks[0]).toMatchObject({
        title: "Call back customer",
        description: "Return call about quote",
        priority: "high",
        status: "todo",
        userId: "user_123",
        customerId,
      });
      expect(tasks[0].createdAt).toBeDefined();
      expect(tasks[0].updatedAt).toBeDefined();
    });

    it("should create task with minimal fields", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      const taskId = await asUser.mutation(api.tasks.createTask, {
        title: "Simple task",
      });

      expect(taskId).toBeDefined();

      const tasks = await asUser.query(api.tasks.getTasks, {});
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe("Simple task");
      expect(tasks[0].status).toBe("todo");
      expect(tasks[0].priority).toBe("medium");
    });

    it("should reject invalid priority values", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      await expect(async () => {
        await asUser.mutation(api.tasks.createTask, {
          title: "Test task",
          priority: "invalid",
        } as any);
      }).rejects.toThrowError();
    });
  });

  describe("updateTaskStatus", () => {
    it("should require authentication", async () => {
      const t = convexTest(schema);
      
      // Create a task first to get a valid ID
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });
      const taskId = await asUser.mutation(api.tasks.createTask, {
        title: "Test task",
      });
      
      // Now try to update without authentication
      await expect(async () => {
        await t.mutation(api.tasks.updateTaskStatus, {
          id: taskId,
          status: "in_progress",
        });
      }).rejects.toThrowError();
    });

    it("should update task status", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      const taskId = await asUser.mutation(api.tasks.createTask, {
        title: "Test task",
      });

      await asUser.mutation(api.tasks.updateTaskStatus, {
        id: taskId,
        status: "in_progress",
      });

      const tasks = await asUser.query(api.tasks.getTasks, {});
      expect(tasks[0].status).toBe("in_progress");
    });

    it("should prevent updating other user's task status", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });
      const asOtherUser = t.withIdentity({ subject: "user_456", name: "Other User" });

      const taskId = await asUser.mutation(api.tasks.createTask, {
        title: "My task",
      });

      await expect(async () => {
        await asOtherUser.mutation(api.tasks.updateTaskStatus, {
          id: taskId,
          status: "done",
        });
      }).rejects.toThrowError("Unauthorized");
    });

    it("should reject invalid status transitions", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      const taskId = await asUser.mutation(api.tasks.createTask, {
        title: "Test task",
      });

      await asUser.mutation(api.tasks.updateTaskStatus, {
        id: taskId,
        status: "done",
      });

      const tasks = await asUser.query(api.tasks.getTasks, {});
      expect(tasks[0].status).toBe("done");
    });
  });

  describe("updateTask", () => {
    it("should require authentication", async () => {
      const t = convexTest(schema);
      
      // Create a task first to get a valid ID
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });
      const taskId = await asUser.mutation(api.tasks.createTask, {
        title: "Test task",
      });
      
      // Now try to update without authentication
      await expect(async () => {
        await t.mutation(api.tasks.updateTask, {
          id: taskId,
          title: "Updated title",
        });
      }).rejects.toThrowError();
    });

    it("should update task fields", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      const taskId = await asUser.mutation(api.tasks.createTask, {
        title: "Original title",
        description: "Original description",
        priority: "low",
      });

      await asUser.mutation(api.tasks.updateTask, {
        id: taskId,
        title: "Updated title",
        description: "Updated description",
        priority: "high",
      });

      const tasks = await asUser.query(api.tasks.getTasks, {});
      expect(tasks[0].title).toBe("Updated title");
      expect(tasks[0].description).toBe("Updated description");
      expect(tasks[0].priority).toBe("high");
    });

    it("should prevent updating other user's task", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });
      const asOtherUser = t.withIdentity({ subject: "user_456", name: "Other User" });

      const taskId = await asUser.mutation(api.tasks.createTask, {
        title: "My task",
      });

      await expect(async () => {
        await asOtherUser.mutation(api.tasks.updateTask, {
          id: taskId,
          title: "Hacked title",
        });
      }).rejects.toThrowError("Unauthorized");
    });
  });

  describe("deleteTask", () => {
    it("should require authentication", async () => {
      const t = convexTest(schema);
      
      // Create a task first to get a valid ID
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });
      const taskId = await asUser.mutation(api.tasks.createTask, {
        title: "Test task",
      });
      
      // Now try to delete without authentication
      await expect(async () => {
        await t.mutation(api.tasks.deleteTask, {
          id: taskId,
        });
      }).rejects.toThrowError();
    });

    it("should delete user's own task", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      const taskId = await asUser.mutation(api.tasks.createTask, {
        title: "Task to delete",
      });

      await asUser.mutation(api.tasks.deleteTask, { id: taskId });

      const tasks = await asUser.query(api.tasks.getTasks, {});
      expect(tasks).toHaveLength(0);
    });

    it("should prevent deleting other user's task", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });
      const asOtherUser = t.withIdentity({ subject: "user_456", name: "Other User" });

      const taskId = await asUser.mutation(api.tasks.createTask, {
        title: "My task",
      });

      await expect(async () => {
        await asOtherUser.mutation(api.tasks.deleteTask, { id: taskId });
      }).rejects.toThrowError("Unauthorized");
    });
  });

  describe("getTasksByStatus", () => {
    it("should return tasks filtered by status", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      // Create tasks with different statuses
      const task1 = await asUser.mutation(api.tasks.createTask, {
        title: "Todo task",
      });

      const task2 = await asUser.mutation(api.tasks.createTask, {
        title: "In progress task",
      });
      await asUser.mutation(api.tasks.updateTaskStatus, {
        id: task2,
        status: "in_progress",
      });

      const task3 = await asUser.mutation(api.tasks.createTask, {
        title: "Done task",
      });
      await asUser.mutation(api.tasks.updateTaskStatus, {
        id: task3,
        status: "done",
      });

      const todoTasks = await asUser.query(api.tasks.getTasksByStatus, { status: "todo" });
      expect(todoTasks).toHaveLength(1);
      expect(todoTasks[0].title).toBe("Todo task");

      const doneTasks = await asUser.query(api.tasks.getTasksByStatus, { status: "done" });
      expect(doneTasks).toHaveLength(1);
      expect(doneTasks[0].title).toBe("Done task");
    });
  });
});
