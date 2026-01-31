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

  tasks: defineTable({
    text: v.string(),
    isCompleted: v.boolean(),
    userId: v.string(),
    createdAt: v.number(),
  })
    .index('by_user', ['userId']),
});
