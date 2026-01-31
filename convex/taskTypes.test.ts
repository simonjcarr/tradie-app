import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

describe("taskTypes", () => {
  describe("getTaskTypes", () => {
    it("should require authentication", async () => {
      const t = convexTest(schema);

      await expect(async () => {
        await t.query(api.taskTypes.getTaskTypes, {});
      }).rejects.toThrowError("Not authenticated");
    });

    it("should return empty array when no task types exist", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      const taskTypes = await asUser.query(api.taskTypes.getTaskTypes, {});
      expect(taskTypes).toEqual([]);
    });

    it("should return only current user's task types", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });
      const asOtherUser = t.withIdentity({ subject: "user_456", name: "Other User" });

      // Create task type as current user
      await asUser.mutation(api.taskTypes.createTaskType, {
        name: "My Task Type",
        color: "#FF5733",
      });

      // Create task type as other user
      await asOtherUser.mutation(api.taskTypes.createTaskType, {
        name: "Other Task Type",
        color: "#33FF57",
      });

      const taskTypes = await asUser.query(api.taskTypes.getTaskTypes, {});
      expect(taskTypes).toHaveLength(1);
      expect(taskTypes[0].name).toBe("My Task Type");
    });
  });

  describe("createTaskType", () => {
    it("should require authentication", async () => {
      const t = convexTest(schema);

      await expect(async () => {
        await t.mutation(api.taskTypes.createTaskType, {
          name: "Test Task Type",
          color: "#FF5733",
        });
      }).rejects.toThrowError("Not authenticated");
    });

    it("should create task type with all fields", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      const taskTypeId = await asUser.mutation(api.taskTypes.createTaskType, {
        name: "Call Back",
        color: "#3B82F6",
        description: "Return a call to the customer",
      });

      expect(taskTypeId).toBeDefined();

      const taskTypes = await asUser.query(api.taskTypes.getTaskTypes, {});
      expect(taskTypes).toHaveLength(1);
      expect(taskTypes[0]).toMatchObject({
        name: "Call Back",
        color: "#3B82F6",
        description: "Return a call to the customer",
        userId: "user_123",
        isDefault: false,
      });
      expect(taskTypes[0].createdAt).toBeDefined();
      expect(taskTypes[0].updatedAt).toBeDefined();
    });

    it("should create task type with minimal fields", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      const taskTypeId = await asUser.mutation(api.taskTypes.createTaskType, {
        name: "Simple Type",
        color: "#FF5733",
      });

      expect(taskTypeId).toBeDefined();

      const taskTypes = await asUser.query(api.taskTypes.getTaskTypes, {});
      expect(taskTypes).toHaveLength(1);
      expect(taskTypes[0].name).toBe("Simple Type");
      expect(taskTypes[0].description).toBeUndefined();
    });

    it("should reject invalid color format", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      await expect(async () => {
        await asUser.mutation(api.taskTypes.createTaskType, {
          name: "Invalid Color",
          color: "red",
        });
      }).rejects.toThrowError("Color must be a valid hex code");
    });

    it("should reject short hex codes", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      await expect(async () => {
        await asUser.mutation(api.taskTypes.createTaskType, {
          name: "Short Color",
          color: "#FFF",
        });
      }).rejects.toThrowError("Color must be a valid hex code");
    });

    it("should normalize color to uppercase", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      await asUser.mutation(api.taskTypes.createTaskType, {
        name: "Lowercase Color",
        color: "#ff5733",
      });

      const taskTypes = await asUser.query(api.taskTypes.getTaskTypes, {});
      expect(taskTypes[0].color).toBe("#FF5733");
    });
  });

  describe("createDefaultTaskTypes", () => {
    it("should require authentication", async () => {
      const t = convexTest(schema);

      await expect(async () => {
        await t.mutation(api.taskTypes.createDefaultTaskTypes, {});
      }).rejects.toThrowError("Not authenticated");
    });

    it("should create all default task types", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      const createdIds = await asUser.mutation(api.taskTypes.createDefaultTaskTypes, {});

      // Should create 11 default task types
      expect(createdIds.length).toBe(11);

      const taskTypes = await asUser.query(api.taskTypes.getTaskTypes, {});
      expect(taskTypes.length).toBe(11);

      // Check that all expected types are created
      const names = taskTypes.map((t) => t.name);
      expect(names).toContain("Call Back");
      expect(names).toContain("Quote");
      expect(names).toContain("Create Invoice");
      expect(names).toContain("Site Visit");
      expect(names).toContain("Follow Up");
      expect(names).toContain("Schedule Job");
      expect(names).toContain("Order Materials");
      expect(names).toContain("Send Reminder");
      expect(names).toContain("Collect Payment");
      expect(names).toContain("Maintenance Check");
      expect(names).toContain("Warranty Work");
    });

    it("should not duplicate existing task types", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      // Create defaults first time
      const firstIds = await asUser.mutation(api.taskTypes.createDefaultTaskTypes, {});
      expect(firstIds.length).toBe(11);

      // Create defaults second time - should not create duplicates
      const secondIds = await asUser.mutation(api.taskTypes.createDefaultTaskTypes, {});
      expect(secondIds.length).toBe(0);

      const taskTypes = await asUser.query(api.taskTypes.getTaskTypes, {});
      expect(taskTypes.length).toBe(11);
    });

    it("should mark default types as isDefault", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      await asUser.mutation(api.taskTypes.createDefaultTaskTypes, {});

      const taskTypes = await asUser.query(api.taskTypes.getTaskTypes, {});
      expect(taskTypes.every((t) => t.isDefault === true)).toBe(true);
    });
  });

  describe("getTaskType", () => {
    it("should require authentication", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      // Create a task type first to get a valid ID
      const taskTypeId = await asUser.mutation(api.taskTypes.createTaskType, {
        name: "Test Type",
        color: "#FF5733",
      });

      // Now try to get without authentication
      await expect(async () => {
        await t.query(api.taskTypes.getTaskType, { id: taskTypeId });
      }).rejects.toThrowError("Not authenticated");
    });

    it("should return task type by id", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      const taskTypeId = await asUser.mutation(api.taskTypes.createTaskType, {
        name: "Test Type",
        color: "#FF5733",
      });

      const taskType = await asUser.query(api.taskTypes.getTaskType, { id: taskTypeId });
      expect(taskType).not.toBeNull();
      expect(taskType?.name).toBe("Test Type");
    });

    it("should return null for non-existent task type", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      // Create a task type first to get a valid ID format, then use a different one
      const taskTypeId = await asUser.mutation(api.taskTypes.createTaskType, {
        name: "Temp Type",
        color: "#FF5733",
      });
      
      // Delete it so it no longer exists
      await asUser.mutation(api.taskTypes.deleteTaskType, { id: taskTypeId });

      // Now try to get the deleted task type
      const taskType = await asUser.query(api.taskTypes.getTaskType, { id: taskTypeId });
      expect(taskType).toBeNull();
    });

    it("should return null for other user's task type", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });
      const asOtherUser = t.withIdentity({ subject: "user_456", name: "Other User" });

      const taskTypeId = await asOtherUser.mutation(api.taskTypes.createTaskType, {
        name: "Other Type",
        color: "#FF5733",
      });

      const taskType = await asUser.query(api.taskTypes.getTaskType, { id: taskTypeId });
      expect(taskType).toBeNull();
    });
  });

  describe("updateTaskType", () => {
    it("should require authentication", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      // Create a task type first to get a valid ID
      const taskTypeId = await asUser.mutation(api.taskTypes.createTaskType, {
        name: "Test Type",
        color: "#FF5733",
      });

      // Now try to update without authentication
      await expect(async () => {
        await t.mutation(api.taskTypes.updateTaskType, {
          id: taskTypeId,
          name: "Updated",
        });
      }).rejects.toThrowError("Not authenticated");
    });

    it("should update task type fields", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      const taskTypeId = await asUser.mutation(api.taskTypes.createTaskType, {
        name: "Original Name",
        color: "#FF5733",
        description: "Original description",
      });

      await asUser.mutation(api.taskTypes.updateTaskType, {
        id: taskTypeId,
        name: "Updated Name",
        color: "#33FF57",
        description: "Updated description",
      });

      const taskType = await asUser.query(api.taskTypes.getTaskType, { id: taskTypeId });
      expect(taskType?.name).toBe("Updated Name");
      expect(taskType?.color).toBe("#33FF57");
      expect(taskType?.description).toBe("Updated description");
    });

    it("should prevent updating other user's task type", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });
      const asOtherUser = t.withIdentity({ subject: "user_456", name: "Other User" });

      const taskTypeId = await asUser.mutation(api.taskTypes.createTaskType, {
        name: "My Type",
        color: "#FF5733",
      });

      await expect(async () => {
        await asOtherUser.mutation(api.taskTypes.updateTaskType, {
          id: taskTypeId,
          name: "Hacked Name",
        });
      }).rejects.toThrowError("Unauthorized");
    });

    it("should reject invalid color format", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      const taskTypeId = await asUser.mutation(api.taskTypes.createTaskType, {
        name: "Test Type",
        color: "#FF5733",
      });

      await expect(async () => {
        await asUser.mutation(api.taskTypes.updateTaskType, {
          id: taskTypeId,
          color: "invalid",
        });
      }).rejects.toThrowError("Color must be a valid hex code");
    });
  });

  describe("deleteTaskType", () => {
    it("should require authentication", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      // Create a task type first to get a valid ID
      const taskTypeId = await asUser.mutation(api.taskTypes.createTaskType, {
        name: "Test Type",
        color: "#FF5733",
      });

      // Now try to delete without authentication
      await expect(async () => {
        await t.mutation(api.taskTypes.deleteTaskType, {
          id: taskTypeId,
        });
      }).rejects.toThrowError("Not authenticated");
    });

    it("should delete user's own task type", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      const taskTypeId = await asUser.mutation(api.taskTypes.createTaskType, {
        name: "Type to Delete",
        color: "#FF5733",
      });

      await asUser.mutation(api.taskTypes.deleteTaskType, { id: taskTypeId });

      const taskTypes = await asUser.query(api.taskTypes.getTaskTypes, {});
      expect(taskTypes).toHaveLength(0);
    });

    it("should prevent deleting other user's task type", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });
      const asOtherUser = t.withIdentity({ subject: "user_456", name: "Other User" });

      const taskTypeId = await asUser.mutation(api.taskTypes.createTaskType, {
        name: "My Type",
        color: "#FF5733",
      });

      await expect(async () => {
        await asOtherUser.mutation(api.taskTypes.deleteTaskType, { id: taskTypeId });
      }).rejects.toThrowError("Unauthorized");
    });

    it("should prevent deleting task type in use by tasks", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      // Create default task types
      await asUser.mutation(api.taskTypes.createDefaultTaskTypes, {});

      // Get the first task type
      const taskTypes = await asUser.query(api.taskTypes.getTaskTypes, {});
      const taskTypeId = taskTypes[0]._id;

      // Create a customer first
      const customerId = await asUser.mutation(api.customers.createCustomer, {
        name: "John Doe",
        phone: "1234567890",
      });

      // Create a task using this task type
      await asUser.mutation(api.tasks.createTask, {
        title: "Test Task",
        taskTypeId,
        customerId,
      });

      // Try to delete the task type
      await expect(async () => {
        await asUser.mutation(api.taskTypes.deleteTaskType, { id: taskTypeId });
      }).rejects.toThrowError("Cannot delete task type that is in use by tasks");
    });
  });
});
