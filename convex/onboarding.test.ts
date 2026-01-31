import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

describe("user onboarding", () => {
  describe("getOnboardingStatus", () => {
    it("should return incomplete status for new user without onboarding data", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      // Create user via the existing user sync
      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          name: "Test User",
          externalId: "user_123",
          email: "test@example.com",
        });
      });

      const status = await asUser.query(api.onboarding.getOnboardingStatus, {});

      expect(status.isComplete).toBe(false);
      expect(status.hasRequiredFields).toBe(false);
      expect(status.completionPercentage).toBeLessThan(100);
    });

    it("should return complete status when all required fields are filled", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          name: "Test User",
          externalId: "user_123",
          email: "test@example.com",
          onboardingCompleted: true,
          businessName: "Test Plumbing",
          tradeTypes: ["Plumber"],
          mobileNumber: "07700900000",
          servicePostcode: "SW1A 1AA",
        });
      });

      const status = await asUser.query(api.onboarding.getOnboardingStatus, {});

      expect(status.isComplete).toBe(true);
      expect(status.hasRequiredFields).toBe(true);
    });

    it("should require authentication", async () => {
      const t = convexTest(schema);

      await expect(async () => {
        await t.query(api.onboarding.getOnboardingStatus, {});
      }).rejects.toThrowError();
    });
  });

  describe("updateOnboardingStep1", () => {
    it("should save business basics for authenticated user", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          name: "Test User",
          externalId: "user_123",
          email: "test@example.com",
        });
      });

      await asUser.mutation(api.onboarding.updateOnboardingStep1, {
        businessName: "Test Plumbing Ltd",
        tradeTypes: ["Plumber", "Heating Engineer"],
        mobileNumber: "07700900123",
        servicePostcode: "SW1A 1AA",
      });

      const user = await t.run(async (ctx) => {
        return await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("externalId"), "user_123"))
          .first();
      });

      expect(user?.businessName).toBe("Test Plumbing Ltd");
      expect(user?.tradeTypes).toEqual(["Plumber", "Heating Engineer"]);
      expect(user?.mobileNumber).toBe("07700900123");
      expect(user?.servicePostcode).toBe("SW1A 1AA");
    });

    it("should require authentication", async () => {
      const t = convexTest(schema);

      await expect(async () => {
        await t.mutation(api.onboarding.updateOnboardingStep1, {
          businessName: "Test",
          tradeTypes: ["Plumber"],
          mobileNumber: "07700900000",
          servicePostcode: "SW1A 1AA",
        });
      }).rejects.toThrowError();
    });
  });

  describe("updateOnboardingStep2", () => {
    it("should save business details for authenticated user", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          name: "Test User",
          externalId: "user_123",
          email: "test@example.com",
          businessName: "Test Plumbing Ltd",
          tradeTypes: ["Plumber"],
          mobileNumber: "07700900000",
          servicePostcode: "SW1A 1AA",
        });
      });

      await asUser.mutation(api.onboarding.updateOnboardingStep2, {
        businessRegistration: "12345678",
        vatRegistered: true,
        businessAddress: "123 Test St, London",
        website: "https://testplumbing.co.uk",
      });

      const user = await t.run(async (ctx) => {
        return await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("externalId"), "user_123"))
          .first();
      });

      expect(user?.businessRegistration).toBe("12345678");
      expect(user?.vatRegistered).toBe(true);
      expect(user?.businessAddress).toBe("123 Test St, London");
      expect(user?.website).toBe("https://testplumbing.co.uk");
    });

    it("should allow partial updates", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          name: "Test User",
          externalId: "user_123",
          email: "test@example.com",
        });
      });

      await asUser.mutation(api.onboarding.updateOnboardingStep2, {
        vatRegistered: false,
      });

      const user = await t.run(async (ctx) => {
        return await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("externalId"), "user_123"))
          .first();
      });

      expect(user?.vatRegistered).toBe(false);
      expect(user?.businessRegistration).toBeUndefined();
    });
  });

  describe("updateOnboardingStep3", () => {
    it("should save preferences for authenticated user", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          name: "Test User",
          externalId: "user_123",
          email: "test@example.com",
        });
      });

      await asUser.mutation(api.onboarding.updateOnboardingStep3, {
        paymentMethods: ["Cash", "Bank Transfer", "Card"],
        yearsInBusiness: 5,
      });

      const user = await t.run(async (ctx) => {
        return await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("externalId"), "user_123"))
          .first();
      });

      expect(user?.paymentMethods).toEqual(["Cash", "Bank Transfer", "Card"]);
      expect(user?.yearsInBusiness).toBe(5);
    });
  });

  describe("completeOnboarding", () => {
    it("should mark onboarding as complete when required fields exist", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          name: "Test User",
          externalId: "user_123",
          email: "test@example.com",
          businessName: "Test Plumbing",
          tradeTypes: ["Plumber"],
          mobileNumber: "07700900000",
          servicePostcode: "SW1A 1AA",
        });
      });

      await asUser.mutation(api.onboarding.completeOnboarding, {});

      const user = await t.run(async (ctx) => {
        return await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("externalId"), "user_123"))
          .first();
      });

      expect(user?.onboardingCompleted).toBe(true);
    });

    it("should throw error if required fields are missing", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          name: "Test User",
          externalId: "user_123",
          email: "test@example.com",
        });
      });

      await expect(async () => {
        await asUser.mutation(api.onboarding.completeOnboarding, {});
      }).rejects.toThrowError("required");
    });
  });

  describe("updateProfile", () => {
    it("should allow updating any profile field after onboarding", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          name: "Test User",
          externalId: "user_123",
          email: "test@example.com",
          onboardingCompleted: true,
          businessName: "Old Name",
          tradeTypes: ["Plumber"],
          mobileNumber: "07700900000",
          servicePostcode: "SW1A 1AA",
        });
      });

      await asUser.mutation(api.onboarding.updateProfile, {
        businessName: "New Business Name",
        website: "https://newsite.com",
      });

      const user = await t.run(async (ctx) => {
        return await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("externalId"), "user_123"))
          .first();
      });

      expect(user?.businessName).toBe("New Business Name");
      expect(user?.website).toBe("https://newsite.com");
      expect(user?.tradeTypes).toEqual(["Plumber"]); // unchanged
    });
  });
});
