"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Phone, Mail, MapPin, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function CustomersPage() {
  const customers = useQuery(api.customers.getMyCustomers);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter customers locally for instant feedback
  const filteredCustomers = customers?.filter(
    (customer: { name: string; phone: string }) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery)
  );

  return (
    <div className="container mx-auto p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">My Clients</h1>
          <p className="text-muted-foreground">
            {customers?.length || 0} customer{customers?.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/customers/new">
          <Button className="w-full sm:w-auto gap-2">
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Customer List */}
      {filteredCustomers?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? "No customers found" : "No customers yet"}
            </h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              {searchQuery
                ? "Try a different search term"
                : "Add your first customer to get started"}
            </p>
            {!searchQuery && (
              <Link href="/customers/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Customer
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCustomers?.map((customer: { _id: string; name: string; phone: string; email?: string; address?: string }) => (
            <Link key={customer._id} href={`/customers/${customer._id}`}>
              <Card className="hover:border-secondary transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{customer.name}</h3>
                      <div className="flex items-center gap-2 text-muted-foreground mt-1">
                        <Phone className="h-4 w-4" />
                        <span>{customer.phone}</span>
                      </div>
                      {customer.email && (
                        <div className="flex items-center gap-2 text-muted-foreground mt-1">
                          <Mail className="h-4 w-4" />
                          <span className="text-sm">{customer.email}</span>
                        </div>
                      )}
                      {customer.address && (
                        <div className="flex items-center gap-2 text-muted-foreground mt-1">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm">{customer.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
