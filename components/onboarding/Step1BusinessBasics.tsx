"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
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
import { TRADE_TYPES } from "@/lib/constants";

const formSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  tradeTypes: z.array(z.string()).min(1, "Please select at least one trade type"),
  mobileNumber: z.string().regex(/^(\+44|0)?[0-9]{10,11}$/, "Please enter a valid UK mobile number"),
  servicePostcode: z.string().regex(/^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}$/i, "Please enter a valid UK postcode"),
});

type FormValues = z.infer<typeof formSchema>;

interface Step1Props {
  onComplete: () => void;
  onBack?: () => void;
  initialData?: Partial<FormValues>;
}

export function Step1BusinessBasics({ onComplete, initialData }: Step1Props) {
  const updateStep1 = useMutation(api.onboarding.updateOnboardingStep1);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: initialData?.businessName || "",
      tradeTypes: initialData?.tradeTypes || [],
      mobileNumber: initialData?.mobileNumber || "",
      servicePostcode: initialData?.servicePostcode || "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    await updateStep1(data);
    onComplete();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Basics</CardTitle>
        <CardDescription>
          Tell us about your business. This information is required to get started.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business/Trading Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Smith Plumbing Services" {...field} />
                  </FormControl>
                  <FormDescription>
                    The name that will appear on your quotes and invoices
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tradeTypes"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>Trade Type(s)</FormLabel>
                    <FormDescription>
                      Select all that apply to your business
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {TRADE_TYPES.map((trade) => (
                      <FormField
                        key={trade}
                        control={form.control}
                        name="tradeTypes"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={trade}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(trade)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, trade])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== trade
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                {trade}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
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
                  <FormDescription>
                    Your primary contact number for clients
                  </FormDescription>
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
                  <FormDescription>
                    Your primary service area (you can add more later)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Continue"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
