"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";

interface OnboardingGuardProps {
  children: ReactNode;
}

/**
 * OnboardingGuard ensures users complete onboarding before accessing the app.
 *
 * Rules:
 * - Unauthenticated users: Allow access to all routes (public pages)
 * - Authenticated users with incomplete onboarding: Force to /onboarding
 * - Authenticated users with complete onboarding: Allow all routes except /onboarding (redirect to /dashboard)
 */
export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const onboardingStatus = useQuery(
    api.onboarding.getOnboardingStatus,
    isSignedIn ? {} : "skip"
  );

  useEffect(() => {
    // Wait for Clerk and Convex to load
    if (!isLoaded) return;

    // If user is not signed in, allow access (public routes)
    if (!isSignedIn) return;

    // Wait for onboarding status to load
    if (onboardingStatus === undefined) return;

    const isOnOnboardingPage = pathname === "/onboarding";
    const isOnboardingComplete = onboardingStatus.isComplete;

    // Rule 1: If onboarding is NOT complete and user is NOT on onboarding page
    // Force them to /onboarding
    if (!isOnboardingComplete && !isOnOnboardingPage) {
      console.log("🚫 Onboarding incomplete - redirecting to /onboarding");
      router.push("/onboarding");
      return;
    }

    // Rule 2: If onboarding IS complete and user IS on onboarding page
    // Redirect them to dashboard (they shouldn't be here)
    if (isOnboardingComplete && isOnOnboardingPage) {
      console.log("✅ Onboarding complete - redirecting to /dashboard");
      router.push("/dashboard");
      return;
    }

    // Rule 3: All other cases are allowed
    // - Onboarding incomplete + on /onboarding page = OK
    // - Onboarding complete + not on /onboarding page = OK
  }, [isLoaded, isSignedIn, onboardingStatus, pathname, router]);

  // Show loading state while checking auth and onboarding status
  if (isSignedIn && (onboardingStatus === undefined || !isLoaded)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
