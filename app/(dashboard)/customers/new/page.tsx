"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, User, Phone, Mail, MapPin, FileText, ChevronDown, ChevronUp, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function NewCustomerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const createCustomer = useMutation(api.customers.createCustomer);

  const [isLoading, setIsLoading] = useState(false);
  const [showOptional, setShowOptional] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");
  const [notes, setNotes] = useState("");

  // Validation
  const isValid = name.trim() && phone.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setIsLoading(true);
    try {
      await createCustomer({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        postcode: postcode.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      toast({
        title: "Customer added!",
        description: `${name} has been added to your clients.`,
      });

      router.push("/customers");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add customer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-optimized header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Link href="/customers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">New Customer</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </div>

      <div className="p-4 pb-32 max-w-lg mx-auto">
        <form onSubmit={handleSubmit}>
          {/* Required Fields */}
          <Card className="mb-4 border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-secondary" />
                Essential Details
                <span className="text-xs font-normal text-muted-foreground ml-auto">Required</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name - Auto-focused for quick entry */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Name
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. John Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  className="h-12 text-lg"
                />
              </div>

              {/* Phone - Big touch target */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="07700 900000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-12 pl-10 text-lg"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Optional Fields - Collapsible */}
          <Card className="mb-4">
            <button
              type="button"
              onClick={() => setShowOptional(!showOptional)}
              className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <span className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Extra Details
              </span>
              {showOptional ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>

            {showOptional && (
              <CardContent className="pt-0 pb-4 space-y-4">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm">
                    Address
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <textarea
                      id="address"
                      placeholder="123 High Street, London"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={3}
                      className="w-full pl-10 pr-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                    />
                  </div>
                </div>

                {/* Postcode */}
                <div className="space-y-2">
                  <Label htmlFor="postcode" className="text-sm">
                    Postcode
                  </Label>
                  <Input
                    id="postcode"
                    placeholder="SW1A 1AA"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    className="uppercase"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm">
                    Notes
                  </Label>
                  <textarea
                    id="notes"
                    placeholder="Referred by Bob, prefers morning calls..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Tips for tradies */}
          {!showOptional && (
            <p className="text-xs text-muted-foreground text-center mb-4">
              💡 Tip: Just name and phone is enough to get started!
            </p>
          )}

          {/* Fixed bottom action */}
          <div className="fixed bottom-20 left-0 right-0 p-4 bg-background border-t border-border lg:static lg:border-0 lg:p-0 lg:mt-6">
            <Button
              type="submit"
              className="w-full h-14 text-lg gap-2"
              disabled={!isValid || isLoading}
            >
              <Save className="h-5 w-5" />
              {isLoading ? "Saving..." : "Save Customer"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
