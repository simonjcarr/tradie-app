import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "./utils";

// Create a new customer
export const createCustomer = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    postcode: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.id("customers"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Validation
    if (!args.name || args.name.trim() === "") {
      throw new Error("Name is required");
    }

    if (!args.phone || args.phone.trim() === "") {
      throw new Error("Phone number is required");
    }

    const now = Date.now();

    const customerId = await ctx.db.insert("customers", {
      userId,
      name: args.name.trim(),
      phone: args.phone.trim(),
      email: args.email?.trim() || undefined,
      address: args.address?.trim() || undefined,
      postcode: args.postcode?.trim().toUpperCase() || undefined,
      notes: args.notes?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    });

    return customerId;
  },
});

// Get a single customer by ID
export const getCustomer = query({
  args: {
    id: v.id("customers"),
  },
  returns: v.union(
    v.object({
      _id: v.id("customers"),
      _creationTime: v.number(),
      userId: v.string(),
      name: v.string(),
      phone: v.string(),
      email: v.optional(v.string()),
      address: v.optional(v.string()),
      postcode: v.optional(v.string()),
      notes: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const customer = await ctx.db.get(args.id);

    if (!customer || customer.userId !== userId) {
      return null;
    }

    return customer;
  },
});

// Get all customers for the current user (sorted by most recent)
export const getMyCustomers = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("customers"),
      _creationTime: v.number(),
      userId: v.string(),
      name: v.string(),
      phone: v.string(),
      email: v.optional(v.string()),
      address: v.optional(v.string()),
      postcode: v.optional(v.string()),
      notes: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const customers = await ctx.db
      .query("customers")
      .withIndex("by_user_created", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return customers;
  },
});

// Search customers by name or phone
export const searchCustomers = query({
  args: {
    query: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("customers"),
      _creationTime: v.number(),
      userId: v.string(),
      name: v.string(),
      phone: v.string(),
      email: v.optional(v.string()),
      address: v.optional(v.string()),
      postcode: v.optional(v.string()),
      notes: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const searchTerm = args.query.toLowerCase().trim();

    if (!searchTerm) {
      return [];
    }

    // Get all customers and filter (for simplicity - can optimize with search index later)
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchTerm) ||
        customer.phone.includes(searchTerm)
    );
  },
});

// Update a customer
export const updateCustomer = mutation({
  args: {
    id: v.id("customers"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    postcode: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const customer = await ctx.db.get(args.id);

    if (!customer || customer.userId !== userId) {
      throw new Error("Customer not found or access denied");
    }

    const updates: Partial<typeof customer> = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name.trim();
    if (args.phone !== undefined) updates.phone = args.phone.trim();
    if (args.email !== undefined) updates.email = args.email?.trim() || undefined;
    if (args.address !== undefined) updates.address = args.address?.trim() || undefined;
    if (args.postcode !== undefined) updates.postcode = args.postcode?.trim().toUpperCase() || undefined;
    if (args.notes !== undefined) updates.notes = args.notes?.trim() || undefined;

    await ctx.db.patch(args.id, updates);
  },
});

// Delete a customer
export const deleteCustomer = mutation({
  args: {
    id: v.id("customers"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const customer = await ctx.db.get(args.id);

    if (!customer || customer.userId !== userId) {
      throw new Error("Customer not found or access denied");
    }

    await ctx.db.delete(args.id);
  },
});
