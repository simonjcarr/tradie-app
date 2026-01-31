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
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  businessRegistration: z.string().optional(),
  vatRegistered: z.boolean().optional(),
  businessAddress: z.string().optional(),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

interface Step2Props {
  onComplete: () => void;
  onSkip?: () => void;
  onBack?: () => void;
  initialData?: Partial<FormValues>;
}

export function Step2BusinessDetails({ onComplete, onSkip, onBack, initialData }: Step2Props) {
  const updateStep2 = useMutation(api.onboarding.updateOnboardingStep2);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessRegistration: initialData?.businessRegistration || "",
      vatRegistered: initialData?.vatRegistered || false,
      businessAddress: initialData?.businessAddress || "",
      website: initialData?.website || "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    await updateStep2(data);
    onComplete();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Details</CardTitle>
        <CardDescription>
          Add more information about your business. These fields are optional but help make your invoices more professional.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="businessRegistration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Registration Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 12345678 (Company number, UTR, ABN)" {...field} />
                  </FormControl>
                  <FormDescription>
                    Your company number, UTR, or ABN if you have one
                  </FormDescription>
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
                    <FormLabel>
                      VAT/GST Registered
                    </FormLabel>
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
                  <FormDescription>
                    Your business address for invoices and correspondence
                  </FormDescription>
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
                  <FormDescription>
                    Your business website if you have one
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={onBack}>
                Back
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={onSkip}>
                  Skip for now
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Saving..." : "Continue"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
