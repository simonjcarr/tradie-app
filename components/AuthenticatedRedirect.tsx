"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export function AuthenticatedRedirect() {
  const router = useRouter();
  const onboardingStatus = useQuery(api.onboarding.getOnboardingStatus);

  const handleGetStarted = () => {
    if (onboardingStatus?.isComplete) {
      router.push("/dashboard");
    } else {
      router.push("/onboarding");
    }
  };

  if (!onboardingStatus) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-2 border-accent max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-primary-foreground">Loading...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-2 border-accent max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-primary-foreground">Alright Boss!</CardTitle>
        <CardDescription className="text-primary-foreground/80">Time to crack on, yeah?</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          size="lg"
          variant="secondary"
          className="w-full text-lg shadow-xl hover:shadow-2xl"
          onClick={handleGetStarted}
        >
          Let&apos;s Get Stuck In
        </Button>
      </CardContent>
    </Card>
  );
}
