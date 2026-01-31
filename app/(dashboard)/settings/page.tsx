"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { TRADE_TYPES, PAYMENT_METHODS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  tradeTypes: z.array(z.string()).min(1, "Please select at least one trade type"),
  mobileNumber: z.string().regex(/^(\+44|0)?[0-9]{10,11}$/, "Please enter a valid UK mobile number"),
  servicePostcode: z.string().regex(/^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}$/i, "Please enter a valid UK postcode"),
  businessRegistration: z.string().optional(),
  vatRegistered: z.boolean().optional(),
  businessAddress: z.string().optional(),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  paymentMethods: z.array(z.string()).optional(),
  yearsInBusiness: z.number().min(0).max(100).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const onboardingStatus = useQuery(api.onboarding.getOnboardingStatus);
  const updateProfile = useMutation(api.onboarding.updateProfile);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: onboardingStatus?.user.businessName || "",
      tradeTypes: onboardingStatus?.user.tradeTypes || [],
      mobileNumber: onboardingStatus?.user.mobileNumber || "",
      servicePostcode: onboardingStatus?.user.servicePostcode || "",
      businessRegistration: onboardingStatus?.user.businessRegistration || "",
      vatRegistered: onboardingStatus?.user.vatRegistered || false,
      businessAddress: onboardingStatus?.user.businessAddress || "",
      website: onboardingStatus?.user.website || "",
      paymentMethods: onboardingStatus?.user.paymentMethods || [],
      yearsInBusiness: onboardingStatus?.user.yearsInBusiness,
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await updateProfile(data);
      toast({
        title: "Profile updated",
        description: "Your business profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!onboardingStatus) {
    return <div>Loading...</div>;
  }

  const completionPercentage = onboardingStatus.completionPercentage;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Business Profile</h1>
        <div className="flex items-center gap-2">
          <Badge variant={completionPercentage === 100 ? "default" : "outline"}>
            {completionPercentage}% Complete
          </Badge>
          <p className="text-sm text-muted-foreground">
            Complete your profile to unlock all features
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Basics</CardTitle>
              <CardDescription>Your core business information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business/Trading Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Smith Plumbing Services" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tradeTypes"
                render={() => (
                  <FormItem>
                    <FormLabel>Trade Type(s)</FormLabel>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      {TRADE_TYPES.map((trade) => (
                        <FormField
                          key={trade}
                          control={form.control}
                          name="tradeTypes"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(trade)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, trade])
                                      : field.onChange(
                                          field.value?.filter((value) => value !== trade)
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                {trade}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mobileNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <FormControl>
                      <Input placeholder="07700 900000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="servicePostcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Area Postcode</FormLabel>
                    <FormControl>
                      <Input placeholder="SW1A 1AA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Business Details</CardTitle>
              <CardDescription>Optional but recommended for professional invoices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="businessRegistration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Registration Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 12345678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vatRegistered"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>VAT/GST Registered</FormLabel>
                      <FormDescription>
                        Check this if your business is registered for VAT or GST
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Address</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="123 High Street, London, UK"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://yourwebsite.co.uk" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Customize your business preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="paymentMethods"
                render={() => (
                  <FormItem>
                    <FormLabel>Payment Methods Accepted</FormLabel>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      {PAYMENT_METHODS.map((method) => (
                        <FormField
                          key={method}
                          control={form.control}
                          name="paymentMethods"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(method)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), method])
                                      : field.onChange(
                                          field.value?.filter((value) => value !== method)
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                {method}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="yearsInBusiness"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years in Business</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g. 5"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
