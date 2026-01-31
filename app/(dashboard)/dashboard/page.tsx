"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function DashboardPage() {
  const onboardingStatus = useQuery(api.onboarding.getOnboardingStatus);
  const currentUser = useQuery(api.users.current);

  if (!currentUser || !onboardingStatus) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">
        Welcome back, {onboardingStatus.user.businessName || currentUser.name}!
      </h1>
      <div className="bg-card border rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Your Dashboard</h2>
        <p className="text-muted-foreground">
          Your business management tools will appear here.
        </p>
      </div>
    </div>
  );
}
