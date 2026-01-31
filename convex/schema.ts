import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    // Basic auth info (from Clerk)
    name: v.string(),
    externalId: v.string(), // Clerk user ID
    email: v.optional(v.string()),

    // Onboarding completion status
    onboardingCompleted: v.optional(v.boolean()),

    // Required onboarding fields
    businessName: v.optional(v.string()),
    tradeTypes: v.optional(v.array(v.string())), // e.g., ["Plumber", "Electrician"]
    mobileNumber: v.optional(v.string()),
    servicePostcode: v.optional(v.string()),

    // Optional business details
    businessRegistration: v.optional(v.string()), // ABN/UTR/etc.
    vatRegistered: v.optional(v.boolean()),
    businessAddress: v.optional(v.string()),
    website: v.optional(v.string()),

    // Optional preferences
    logoUrl: v.optional(v.string()),
    paymentMethods: v.optional(v.array(v.string())), // e.g., ["Cash", "Bank Transfer", "Card"]
    yearsInBusiness: v.optional(v.number()),
  }).index('byExternalId', ['externalId']),

  taskTypes: defineTable({
    userId: v.string(), // Owner (the tradie)
    name: v.string(),
    color: v.string(), // Hex color code (e.g., "#FF5733")
    description: v.optional(v.string()),
    isDefault: v.optional(v.boolean()), // System default types
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_name', ['userId', 'name']),

  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal('todo'), v.literal('in_progress'), v.literal('done'), v.literal('cancelled')),
    priority: v.union(v.literal('low'), v.literal('medium'), v.literal('high')),
    dueDate: v.optional(v.number()),
    customerId: v.optional(v.id('customers')),
    taskTypeId: v.optional(v.id('taskTypes')), // Reference to task type
    userId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_status', ['userId', 'status'])
    .index('by_user_dueDate', ['userId', 'dueDate'])
    .index('by_customer', ['customerId']),

  customers: defineTable({
    userId: v.string(), // Owner (the tradie)
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    postcode: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_created', ['userId', 'createdAt']),
});
