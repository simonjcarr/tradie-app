"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const onboardingStatus = useQuery(api.onboarding.getOnboardingStatus);
  const currentUser = useQuery(api.users.current);

  useEffect(() => {
    if (onboardingStatus && !onboardingStatus.isComplete) {
      router.push("/onboarding");
    }
  }, [onboardingStatus, router]);

  if (!currentUser || !onboardingStatus) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">
        Welcome back, {onboardingStatus.user.businessName || currentUser.name}!
      </h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Your Dashboard</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Your business management tools will appear here.
        </p>
      </div>
    </div>
  );
}
