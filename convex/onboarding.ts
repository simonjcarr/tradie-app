import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get the current user's onboarding status
 */
export const getOnboardingStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("externalId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if all required fields are filled
    const hasRequiredFields = !!(
      user.businessName &&
      user.tradeTypes &&
      user.tradeTypes.length > 0 &&
      user.mobileNumber &&
      user.servicePostcode
    );

    // Calculate completion percentage based on all fields
    const allFields = [
      user.businessName,
      user.tradeTypes && user.tradeTypes.length > 0,
      user.mobileNumber,
      user.servicePostcode,
      user.businessRegistration,
      user.vatRegistered !== undefined,
      user.businessAddress,
      user.website,
      user.paymentMethods && user.paymentMethods.length > 0,
      user.yearsInBusiness,
    ];

    const filledFields = allFields.filter(Boolean).length;
    const completionPercentage = Math.round((filledFields / allFields.length) * 100);

    return {
      isComplete: user.onboardingCompleted ?? false,
      hasRequiredFields,
      completionPercentage,
      user: {
        businessName: user.businessName,
        tradeTypes: user.tradeTypes,
        mobileNumber: user.mobileNumber,
        servicePostcode: user.servicePostcode,
        businessRegistration: user.businessRegistration,
        vatRegistered: user.vatRegistered,
        businessAddress: user.businessAddress,
        website: user.website,
        paymentMethods: user.paymentMethods,
        yearsInBusiness: user.yearsInBusiness,
      },
    };
  },
});

/**
 * Step 1: Update business basics (required fields)
 */
export const updateOnboardingStep1 = mutation({
  args: {
    businessName: v.string(),
    tradeTypes: v.array(v.string()),
    mobileNumber: v.string(),
    servicePostcode: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("externalId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      businessName: args.businessName,
      tradeTypes: args.tradeTypes,
      mobileNumber: args.mobileNumber,
      servicePostcode: args.servicePostcode,
    });
  },
});

/**
 * Step 2: Update business details (optional fields)
 */
export const updateOnboardingStep2 = mutation({
  args: {
    businessRegistration: v.optional(v.string()),
    vatRegistered: v.optional(v.boolean()),
    businessAddress: v.optional(v.string()),
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("externalId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Only update fields that are provided
    const updates: Record<string, any> = {};
    if (args.businessRegistration !== undefined) {
      updates.businessRegistration = args.businessRegistration;
    }
    if (args.vatRegistered !== undefined) {
      updates.vatRegistered = args.vatRegistered;
    }
    if (args.businessAddress !== undefined) {
      updates.businessAddress = args.businessAddress;
    }
    if (args.website !== undefined) {
      updates.website = args.website;
    }

    await ctx.db.patch(user._id, updates);
  },
});

/**
 * Step 3: Update preferences (optional fields)
 */
export const updateOnboardingStep3 = mutation({
  args: {
    logoUrl: v.optional(v.string()),
    paymentMethods: v.optional(v.array(v.string())),
    yearsInBusiness: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("externalId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const updates: Record<string, any> = {};
    if (args.logoUrl !== undefined) {
      updates.logoUrl = args.logoUrl;
    }
    if (args.paymentMethods !== undefined) {
      updates.paymentMethods = args.paymentMethods;
    }
    if (args.yearsInBusiness !== undefined) {
      updates.yearsInBusiness = args.yearsInBusiness;
    }

    await ctx.db.patch(user._id, updates);
  },
});

/**
 * Mark onboarding as complete
 */
export const completeOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("externalId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Verify all required fields are filled
    if (
      !user.businessName ||
      !user.tradeTypes ||
      user.tradeTypes.length === 0 ||
      !user.mobileNumber ||
      !user.servicePostcode
    ) {
      throw new Error("Cannot complete onboarding: required fields are missing");
    }

    await ctx.db.patch(user._id, {
      onboardingCompleted: true,
    });
  },
});

/**
 * Update user profile (can be used after onboarding is complete)
 */
export const updateProfile = mutation({
  args: {
    businessName: v.optional(v.string()),
    tradeTypes: v.optional(v.array(v.string())),
    mobileNumber: v.optional(v.string()),
    servicePostcode: v.optional(v.string()),
    businessRegistration: v.optional(v.string()),
    vatRegistered: v.optional(v.boolean()),
    businessAddress: v.optional(v.string()),
    website: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    paymentMethods: v.optional(v.array(v.string())),
    yearsInBusiness: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("externalId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Only update fields that are provided
    const updates: Record<string, any> = {};
    Object.entries(args).forEach(([key, value]) => {
      if (value !== undefined) {
        updates[key] = value;
      }
    });

    await ctx.db.patch(user._id, updates);
  },
});
