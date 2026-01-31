"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, User, Phone, Mail, MapPin, FileText, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const customerId = params.id as Id<"customers">;

  const customer = useQuery(api.customers.getCustomer, { id: customerId });
  const deleteCustomer = useMutation(api.customers.deleteCustomer);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this customer?")) {
      return;
    }

    try {
      await deleteCustomer({ id: customerId as Id<"customers"> });
      toast({
        title: "Customer deleted",
        description: "The customer has been removed.",
      });
      router.push("/customers");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete customer. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (customer === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-screen">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (customer === null) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background border-b border-border">
          <div className="flex items-center justify-between p-4">
            <Link href="/customers">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold">Customer Not Found</h1>
            <div className="w-10" />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <User className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Customer not found</h2>
          <p className="text-muted-foreground mb-4">
            The customer you're looking for doesn't exist or you don't have access.
          </p>
          <Link href="/customers">
            <Button>Back to Customers</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Link href="/customers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Customer Details</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4 pb-32 max-w-lg mx-auto">
        {/* Customer Name Card */}
        <Card className="mb-4 border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-secondary" />
              Name
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{customer.name}</p>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="h-4 w-4 text-secondary" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Phone</p>
              <a
                href={`tel:${customer.phone}`}
                className="text-lg font-medium text-secondary hover:underline"
              >
                {customer.phone}
              </a>
            </div>
            {customer.email && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <a
                  href={`mailto:${customer.email}`}
                  className="text-base text-secondary hover:underline"
                >
                  {customer.email}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Address */}
        {(customer.address || customer.postcode) && (
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-secondary" />
                Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {customer.address && (
                <p className="text-base">{customer.address}</p>
              )}
              {customer.postcode && (
                <p className="text-base font-medium">{customer.postcode}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {customer.notes && (
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-secondary" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base whitespace-pre-wrap">{customer.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-background border-t border-border lg:static lg:border-0 lg:p-0 lg:mt-6">
          <div className="flex gap-3 max-w-lg mx-auto">
            <Link href={`/customers/${customerId}/edit`} className="flex-1">
              <Button variant="outline" className="w-full h-14 text-lg gap-2">
                <Edit className="h-5 w-5" />
                Edit
              </Button>
            </Link>
            <Button
              variant="destructive"
              className="flex-1 h-14 text-lg gap-2"
              onClick={handleDelete}
            >
              <Trash2 className="h-5 w-5" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
