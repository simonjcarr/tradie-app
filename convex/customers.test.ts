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

  describe("updateCustomer", () => {
    it("should update customer name and phone", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      const customerId = await asUser.mutation(api.customers.createCustomer, {
        name: "John Smith",
        phone: "07700 900001",
      });

      await asUser.mutation(api.customers.updateCustomer, {
        id: customerId,
        name: "John Updated",
        phone: "07700 900999",
      });

      const customer = await asUser.query(api.customers.getCustomer, {
        id: customerId,
      });

      expect(customer?.name).toBe("John Updated");
      expect(customer?.phone).toBe("07700 900999");
    });

    it("should update all customer fields", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      const customerId = await asUser.mutation(api.customers.createCustomer, {
        name: "John Smith",
        phone: "07700 900001",
      });

      await asUser.mutation(api.customers.updateCustomer, {
        id: customerId,
        name: "Jane Doe",
        phone: "07700 900002",
        email: "jane@example.com",
        address: "456 New Street, Manchester",
        postcode: "M1 1AA",
        notes: "Updated notes",
      });

      const customer = await asUser.query(api.customers.getCustomer, {
        id: customerId,
      });

      expect(customer?.name).toBe("Jane Doe");
      expect(customer?.phone).toBe("07700 900002");
      expect(customer?.email).toBe("jane@example.com");
      expect(customer?.address).toBe("456 New Street, Manchester");
      expect(customer?.postcode).toBe("M1 1AA");
      expect(customer?.notes).toBe("Updated notes");
    });

    it("should clear optional fields when set to empty string", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      const customerId = await asUser.mutation(api.customers.createCustomer, {
        name: "John Smith",
        phone: "07700 900001",
        email: "john@example.com",
        address: "123 Street",
        postcode: "SW1A 1AA",
        notes: "Some notes",
      });

      await asUser.mutation(api.customers.updateCustomer, {
        id: customerId,
        email: "",
        address: "",
        postcode: "",
        notes: "",
      });

      const customer = await asUser.query(api.customers.getCustomer, {
        id: customerId,
      });

      expect(customer?.email).toBeUndefined();
      expect(customer?.address).toBeUndefined();
      expect(customer?.postcode).toBeUndefined();
      expect(customer?.notes).toBeUndefined();
    });

    it("should update updatedAt timestamp", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      const customerId = await asUser.mutation(api.customers.createCustomer, {
        name: "John Smith",
        phone: "07700 900001",
      });

      const originalCustomer = await asUser.query(api.customers.getCustomer, {
        id: customerId,
      });
      const originalUpdatedAt = originalCustomer?.updatedAt;

      // Small delay to ensure timestamp changes
      await new Promise((resolve) => setTimeout(resolve, 10));

      await asUser.mutation(api.customers.updateCustomer, {
        id: customerId,
        name: "John Updated",
      });

      const updatedCustomer = await asUser.query(api.customers.getCustomer, {
        id: customerId,
      });

      expect(updatedCustomer?.updatedAt).toBeGreaterThan(originalUpdatedAt!);
    });

    it("should require authentication", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      const customerId = await asUser.mutation(api.customers.createCustomer, {
        name: "John Smith",
        phone: "07700 900001",
      });

      await expect(async () => {
        await t.mutation(api.customers.updateCustomer, {
          id: customerId,
          name: "Hacked",
        });
      }).rejects.toThrowError();
    });

    it("should not allow updating other user's customer", async () => {
      const t = convexTest(schema);
      const alice = t.withIdentity({ subject: "alice_id", name: "Alice" });
      const bob = t.withIdentity({ subject: "bob_id", name: "Bob" });

      const customerId = await alice.mutation(api.customers.createCustomer, {
        name: "Alice's Customer",
        phone: "07700 900001",
      });

      await expect(async () => {
        await bob.mutation(api.customers.updateCustomer, {
          id: customerId,
          name: "Hacked by Bob",
        });
      }).rejects.toThrowError("Customer not found or access denied");
    });

    it("should throw error for non-existent customer", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      // Create and delete a customer to get a valid but non-existent ID
      const customerId = await asUser.mutation(api.customers.createCustomer, {
        name: "Temp",
        phone: "07700 900000",
      });
      await asUser.mutation(api.customers.deleteCustomer, { id: customerId });

      await expect(async () => {
        await asUser.mutation(api.customers.updateCustomer, {
          id: customerId,
          name: "Updated",
        });
      }).rejects.toThrowError("Customer not found or access denied");
    });
  });

  describe("deleteCustomer", () => {
    it("should delete a customer", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      const customerId = await asUser.mutation(api.customers.createCustomer, {
        name: "John Smith",
        phone: "07700 900001",
      });

      await asUser.mutation(api.customers.deleteCustomer, { id: customerId });

      const customer = await asUser.query(api.customers.getCustomer, {
        id: customerId,
      });

      expect(customer).toBeNull();
    });

    it("should require authentication", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      const customerId = await asUser.mutation(api.customers.createCustomer, {
        name: "John Smith",
        phone: "07700 900001",
      });

      await expect(async () => {
        await t.mutation(api.customers.deleteCustomer, { id: customerId });
      }).rejects.toThrowError();
    });

    it("should not allow deleting other user's customer", async () => {
      const t = convexTest(schema);
      const alice = t.withIdentity({ subject: "alice_id", name: "Alice" });
      const bob = t.withIdentity({ subject: "bob_id", name: "Bob" });

      const customerId = await alice.mutation(api.customers.createCustomer, {
        name: "Alice's Customer",
        phone: "07700 900001",
      });

      await expect(async () => {
        await bob.mutation(api.customers.deleteCustomer, { id: customerId });
      }).rejects.toThrowError("Customer not found or access denied");

      // Verify customer still exists
      const customer = await alice.query(api.customers.getCustomer, {
        id: customerId,
      });
      expect(customer).toBeDefined();
    });

    it("should throw error for non-existent customer", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

      // Create and delete a customer to get a valid but non-existent ID
      const customerId = await asUser.mutation(api.customers.createCustomer, {
        name: "Temp",
        phone: "07700 900000",
      });
      await asUser.mutation(api.customers.deleteCustomer, { id: customerId });

      await expect(async () => {
        await asUser.mutation(api.customers.deleteCustomer, { id: customerId });
      }).rejects.toThrowError("Customer not found or access denied");
    });
  });
});
