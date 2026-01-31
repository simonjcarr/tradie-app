import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

describe("customers", () => {
  describe("createCustomer", () => {
    it("should create a customer with minimal details (name and phone)", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      const customerId = await asUser.mutation(api.customers.createCustomer, {
        name: "John Smith",
        phone: "07700 900123",
      });

      expect(customerId).toBeDefined();

      // Verify the customer was created
      const customer = await asUser.query(api.customers.getCustomer, {
        id: customerId,
      });

      expect(customer).toBeDefined();
      expect(customer?.name).toBe("John Smith");
      expect(customer?.phone).toBe("07700 900123");
      expect(customer?.userId).toBe("user_123");
    });

    it("should create a customer with all details", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      const customerId = await asUser.mutation(api.customers.createCustomer, {
        name: "Jane Doe",
        phone: "07700 900456",
        email: "jane@example.com",
        address: "123 High Street, London",
        postcode: "SW1A 1AA",
        notes: "Referred by Bob",
      });

      const customer = await asUser.query(api.customers.getCustomer, {
        id: customerId,
      });

      expect(customer?.name).toBe("Jane Doe");
      expect(customer?.phone).toBe("07700 900456");
      expect(customer?.email).toBe("jane@example.com");
      expect(customer?.address).toBe("123 High Street, London");
      expect(customer?.postcode).toBe("SW1A 1AA");
      expect(customer?.notes).toBe("Referred by Bob");
    });

    it("should require authentication", async () => {
      const t = convexTest(schema);

      await expect(async () => {
        await t.mutation(api.customers.createCustomer, {
          name: "John Smith",
          phone: "07700 900123",
        });
      }).rejects.toThrowError();
    });

    it("should require name", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      await expect(async () => {
        await asUser.mutation(api.customers.createCustomer, {
          name: "",
          phone: "07700 900123",
        });
      }).rejects.toThrowError("Name is required");
    });

    it("should require phone", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      await expect(async () => {
        await asUser.mutation(api.customers.createCustomer, {
          name: "John Smith",
          phone: "",
        });
      }).rejects.toThrowError("Phone number is required");
    });
  });

  describe("getMyCustomers", () => {
    it("should return only the user's customers", async () => {
      const t = convexTest(schema);
      const alice = t.withIdentity({ subject: "alice_id", name: "Alice" });
      const bob = t.withIdentity({ subject: "bob_id", name: "Bob" });

      // Alice creates customers
      await alice.mutation(api.customers.createCustomer, {
        name: "Alice's Customer",
        phone: "07700 900001",
      });

      // Bob creates customers
      await bob.mutation(api.customers.createCustomer, {
        name: "Bob's Customer",
        phone: "07700 900002",
      });

      // Alice should only see her customer
      const aliceCustomers = await alice.query(api.customers.getMyCustomers, {});
      expect(aliceCustomers).toHaveLength(1);
      expect(aliceCustomers[0].name).toBe("Alice's Customer");

      // Bob should only see his customer
      const bobCustomers = await bob.query(api.customers.getMyCustomers, {});
      expect(bobCustomers).toHaveLength(1);
      expect(bobCustomers[0].name).toBe("Bob's Customer");
    });

    it("should return customers sorted by most recent", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      await asUser.mutation(api.customers.createCustomer, {
        name: "First Customer",
        phone: "07700 900001",
      });

      await asUser.mutation(api.customers.createCustomer, {
        name: "Second Customer",
        phone: "07700 900002",
      });

      const customers = await asUser.query(api.customers.getMyCustomers, {});
      expect(customers).toHaveLength(2);
      expect(customers[0].name).toBe("Second Customer");
      expect(customers[1].name).toBe("First Customer");
    });

    it("should require authentication", async () => {
      const t = convexTest(schema);

      await expect(async () => {
        await t.query(api.customers.getMyCustomers, {});
      }).rejects.toThrowError();
    });
  });

  describe("searchCustomers", () => {
    it("should search by name", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      await asUser.mutation(api.customers.createCustomer, {
        name: "John Smith",
        phone: "07700 900001",
      });

      await asUser.mutation(api.customers.createCustomer, {
        name: "Jane Doe",
        phone: "07700 900002",
      });

      const results = await asUser.query(api.customers.searchCustomers, {
        query: "john",
      });

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("John Smith");
    });

    it("should search by phone number", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      await asUser.mutation(api.customers.createCustomer, {
        name: "John Smith",
        phone: "07700 900001",
      });

      const results = await asUser.query(api.customers.searchCustomers, {
        query: "07700 900001",
      });

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("John Smith");
    });
  });

  describe("getCustomer", () => {
    it("should return a customer by ID", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      const customerId = await asUser.mutation(api.customers.createCustomer, {
        name: "John Smith",
        phone: "07700 900001",
        email: "john@example.com",
        address: "123 High Street",
        postcode: "SW1A 1AA",
        notes: "Important client",
      });

      const customer = await asUser.query(api.customers.getCustomer, {
        id: customerId,
      });

      expect(customer).toBeDefined();
      expect(customer?._id).toBe(customerId);
      expect(customer?.name).toBe("John Smith");
      expect(customer?.phone).toBe("07700 900001");
      expect(customer?.email).toBe("john@example.com");
      expect(customer?.address).toBe("123 High Street");
      expect(customer?.postcode).toBe("SW1A 1AA");
      expect(customer?.notes).toBe("Important client");
    });

    it("should return null for non-existent customer", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      // Create a customer first to get a valid ID format, then use a modified one
      const customerId = await asUser.mutation(api.customers.createCustomer, {
        name: "Temp Customer",
        phone: "07700 900000",
      });

      // Delete it to make it non-existent
      await asUser.mutation(api.customers.deleteCustomer, { id: customerId });

      // Now try to get the deleted customer
      const customer = await asUser.query(api.customers.getCustomer, {
        id: customerId,
      });

      expect(customer).toBeNull();
    });

    it("should return null for other user's customer", async () => {
      const t = convexTest(schema);
      const alice = t.withIdentity({ subject: "alice_id", name: "Alice" });
      const bob = t.withIdentity({ subject: "bob_id", name: "Bob" });

      const customerId = await alice.mutation(api.customers.createCustomer, {
        name: "Alice's Customer",
        phone: "07700 900001",
      });

      const customer = await bob.query(api.customers.getCustomer, {
        id: customerId,
      });

      expect(customer).toBeNull();
    });

    it("should require authentication", async () => {
      const t = convexTest(schema);

      await expect(async () => {
        await t.query(api.customers.getCustomer, {
          id: "k57b6c5g5x6x7x8x9x0x1x2x" as any,
        });
      }).rejects.toThrowError();
    });
  });
});
