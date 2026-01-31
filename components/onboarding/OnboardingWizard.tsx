"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Step1BusinessBasics } from "./Step1BusinessBasics";
import { Step2BusinessDetails } from "./Step2BusinessDetails";
import { Step3Preferences } from "./Step3Preferences";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();
  const { toast } = useToast();

  const onboardingStatus = useQuery(api.onboarding.getOnboardingStatus);
  const completeOnboarding = useMutation(api.onboarding.completeOnboarding);

  const steps = [
    { number: 1, title: "Business Basics", component: Step1BusinessBasics },
    { number: 2, title: "Business Details", component: Step2BusinessDetails },
    { number: 3, title: "Preferences", component: Step3Preferences },
  ];

  const handleStepComplete = async (step: number) => {
    if (step < 3) {
      setCurrentStep(step + 1);
    } else {
      // Final step - complete onboarding
      try {
        await completeOnboarding({});
        router.push("/dashboard");
      } catch (error) {
        toast({
          title: "Cannot complete onboarding",
          description: "Please complete all required fields in step 1 before finishing.",
          variant: "destructive",
        });
        setCurrentStep(1); // Send them back to step 1
      }
    }
  };

  const handleSkip = async () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - skip preferences but still complete onboarding
      try {
        await completeOnboarding({});
        router.push("/dashboard");
      } catch (error) {
        toast({
          title: "Cannot complete onboarding",
          description: "Please complete all required fields in step 1 before finishing.",
          variant: "destructive",
        });
        setCurrentStep(1); // Send them back to step 1
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!onboardingStatus) {
    return <div>Loading...</div>;
  }

  const CurrentStepComponent = steps[currentStep - 1].component;
  const progressPercentage = (currentStep / steps.length) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to Tradie App
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Let&apos;s get your business set up in just a few steps
          </p>
        </div>

        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {steps.map((step) => (
              <div
                key={step.number}
                className="flex items-center gap-2"
              >
                <Badge
                  variant={currentStep >= step.number ? "default" : "outline"}
                >
                  {step.number}
                </Badge>
                <span
                  className={`text-sm ${
                    currentStep >= step.number
                      ? "text-gray-900 dark:text-white font-medium"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {step.title}
                </span>
              </div>
            ))}
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <CurrentStepComponent
          onComplete={() => handleStepComplete(currentStep)}
          onSkip={currentStep > 1 ? handleSkip : undefined}
          onBack={currentStep > 1 ? handleBack : undefined}
          initialData={onboardingStatus.user}
        />
      </div>
    </div>
  );
}
