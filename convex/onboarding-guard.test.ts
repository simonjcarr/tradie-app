import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

describe("onboarding guard logic", () => {
  describe("user onboarding state", () => {
    it("should identify new user without onboarding data as incomplete", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "New User" });

      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          name: "New User",
          externalId: "user_123",
          email: "new@example.com",
        });
      });

      const status = await asUser.query(api.onboarding.getOnboardingStatus, {});

      expect(status.isComplete).toBe(false);
      expect(status.hasRequiredFields).toBe(false);
    });

    it("should identify user with partial data as incomplete", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Partial User" });

      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          name: "Partial User",
          externalId: "user_123",
          email: "partial@example.com",
          businessName: "Test Business",
          // Missing required fields: tradeTypes, mobileNumber, servicePostcode
        });
      });

      const status = await asUser.query(api.onboarding.getOnboardingStatus, {});

      expect(status.isComplete).toBe(false);
      expect(status.hasRequiredFields).toBe(false);
    });

    it("should identify user with all required fields but not marked complete as incomplete", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Almost User" });

      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          name: "Almost User",
          externalId: "user_123",
          email: "almost@example.com",
          businessName: "Test Business",
          tradeTypes: ["Plumber"],
          mobileNumber: "07700900000",
          servicePostcode: "SW1A 1AA",
          // Has all required fields but onboardingCompleted is not true
        });
      });

      const status = await asUser.query(api.onboarding.getOnboardingStatus, {});

      expect(status.hasRequiredFields).toBe(true);
      expect(status.isComplete).toBe(false); // Not marked complete yet
    });

    it("should identify user with completed onboarding as complete", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Complete User" });

      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          name: "Complete User",
          externalId: "user_123",
          email: "complete@example.com",
          onboardingCompleted: true,
          businessName: "Test Business",
          tradeTypes: ["Plumber"],
          mobileNumber: "07700900000",
          servicePostcode: "SW1A 1AA",
        });
      });

      const status = await asUser.query(api.onboarding.getOnboardingStatus, {});

      expect(status.isComplete).toBe(true);
      expect(status.hasRequiredFields).toBe(true);
    });
  });

  describe("forced onboarding completion", () => {
    it("should not allow marking onboarding complete without required fields", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Incomplete User" });

      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          name: "Incomplete User",
          externalId: "user_123",
          email: "incomplete@example.com",
          businessName: "Test Business",
          // Missing: tradeTypes, mobileNumber, servicePostcode
        });
      });

      await expect(async () => {
        await asUser.mutation(api.onboarding.completeOnboarding, {});
      }).rejects.toThrowError("required");
    });

    it("should allow marking onboarding complete with all required fields", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Ready User" });

      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          name: "Ready User",
          externalId: "user_123",
          email: "ready@example.com",
          businessName: "Test Business",
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
  });
});
