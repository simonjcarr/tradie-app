import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

describe("tasks", () => {
  it("should create and retrieve a task", async () => {
    const t = convexTest(schema);

    const asUser = t.withIdentity({
      subject: "user_123",
      name: "Test User"
    });

    const taskId = await asUser.mutation(api.tasks.createTask, {
      text: "Write unit tests"
    });

    expect(taskId).toBeDefined();

    const tasks = await asUser.query(api.tasks.getTasks, {});

    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({
      text: "Write unit tests",
      isCompleted: false,
      userId: "user_123"
    });
  });

  it("should toggle task completion status", async () => {
    const t = convexTest(schema);
    const asUser = t.withIdentity({ subject: "user_456" });

    const taskId = await asUser.mutation(api.tasks.createTask, {
      text: "Test toggle functionality"
    });

    await asUser.mutation(api.tasks.toggleTask, { id: taskId });

    const tasks = await asUser.query(api.tasks.getTasks, {});
    expect(tasks[0].isCompleted).toBe(true);
  });

  it("should prevent unauthorized access to other users' tasks", async () => {
    const t = convexTest(schema);

    const user1 = t.withIdentity({ subject: "user_1" });
    const taskId = await user1.mutation(api.tasks.createTask, {
      text: "User 1's private task"
    });

    const user2 = t.withIdentity({ subject: "user_2" });

    await expect(async () => {
      await user2.mutation(api.tasks.deleteTask, { id: taskId });
    }).rejects.toThrowError("Unauthorized");
  });

  it("should require authentication for getTasks", async () => {
    const t = convexTest(schema);

    await expect(async () => {
      await t.query(api.tasks.getTasks, {});
    }).rejects.toThrowError();
  });
});
