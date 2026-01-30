import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    name: v.string(),
    externalId: v.string(), // Clerk user ID
    email: v.optional(v.string()),
  }).index('byExternalId', ['externalId']),

  tasks: defineTable({
    text: v.string(),
    isCompleted: v.boolean(),
    userId: v.string(),
    createdAt: v.number(),
  })
    .index('by_user', ['userId']),
});
