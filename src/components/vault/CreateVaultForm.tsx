"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { type Deployment } from "@/lib/consts";
import { BasicInfoStep } from "./steps/BasicInfoStep";
import { FeeConfigStep } from "./steps/FeeConfigStep";
import { PolicyConfigStep } from "./steps/PolicyConfigStep";
import { ReviewStep } from "./steps/ReviewStep";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface CreateVaultFormProps {
  deployment: Deployment;
}

const createVaultSchema = z.object({
  vaultName: z.string().min(1, "Vault name is required"),
  vaultSymbol: z.string().min(1, "Vault symbol is required").max(10, "Symbol must be 10 characters or less"),
  denominationAsset: z.string().min(1, "Denomination asset is required"),
  fees: z.object({
    management: z.object({
      enabled: z.boolean(),
      rate: z.number().min(0).max(100),
      recipient: z.string().optional(),
    }),
    performance: z.object({
      enabled: z.boolean(),
      rate: z.number().min(0).max(100),
      recipient: z.string().optional(),
    }),
    entrance: z.object({
      enabled: z.boolean(),
      rate: z.number().min(0).max(100),
      allocation: z.string().optional(),
      recipient: z.string().optional(),
    }),
    exit: z.object({
      enabled: z.boolean(),
      inKindRate: z.number().min(0).max(100),
      specificAssetRate: z.number().min(0).max(100),
      allocation: z.string().optional(),
      recipient: z.string().optional(),
    }),
  }),
  policies: z.array(z.object({
    type: z.string(),
    settings: z.string(),
  })),
});

type CreateVaultFormData = z.infer<typeof createVaultSchema>;

const STEPS = [
  {
    id: 'basic',
    title: 'Basic Info',
    description: 'Name, symbol & asset'
  },
  {
    id: 'fees',
    title: 'Fee Setup',
    description: 'Management & performance'
  },
  {
    id: 'policies',
    title: 'Policies',
    description: 'Investment rules'
  },
  {
    id: 'review',
    title: 'Review',
    description: 'Confirm & deploy'
  }
];

export function CreateVaultForm({ deployment }: CreateVaultFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [policies, setPolicies] = useState<{ type: string; settings: string }[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<CreateVaultFormData>({
    resolver: zodResolver(createVaultSchema),
    defaultValues: {
      vaultName: "",
      vaultSymbol: "",
      denominationAsset: "",
      fees: {
        management: { enabled: false, rate: 2.0, recipient: "" },
        performance: { enabled: false, rate: 20.0, recipient: "" },
        entrance: { enabled: false, rate: 0.5, allocation: "vault", recipient: "" },
        exit: { enabled: false, inKindRate: 1.0, specificAssetRate: 5.0, allocation: "vault", recipient: "" },
      },
      policies: [],
    },
  });

  const watchedValues = watch();

  const nextStep = async () => {
    let fieldsToValidate: (keyof CreateVaultFormData)[] = [];

    switch (currentStep) {
      case 0:
        fieldsToValidate = ['vaultName', 'vaultSymbol', 'denominationAsset'];
        break;
    }

    if (fieldsToValidate.length > 0) {
      const isValid = await trigger(fieldsToValidate);
      if (!isValid) return;
    }

    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const onSubmit = async (data: CreateVaultFormData) => {
    console.log("Creating vault with data:", data);
    alert("Vault creation functionality will be implemented here!");
  };

  const isStepCompleted = (stepIndex: number) => {
    switch (stepIndex) {
      case 0:
        return watchedValues.vaultName && watchedValues.vaultSymbol && watchedValues.denominationAsset;
      case 1:
        return true; // Fees are optional
      case 2:
        return true; // Policies are optional
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <BasicInfoStep
            register={register}
            setValue={setValue}
            watchedValues={watchedValues}
            errors={errors}
          />
        );

      case 1:
        return (
          <FeeConfigStep
            watchedValues={watchedValues}
            setValue={setValue}
          />
        );

      case 2:
        return (
          <PolicyConfigStep
            policies={policies}
            setPolicies={setPolicies}
            setValue={setValue}
          />
        );

      case 3:
        return (
          <ReviewStep
            watchedValues={watchedValues}
            policies={policies}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create New Vault</h1>
        <p className="text-muted-foreground">Deploy a new on-chain asset management vault</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Step Navigation */}
        <div className="lg:col-span-1">
          <div className="space-y-2">
            {STEPS.map((step, index) => (
              <button
                key={step.id}
                type="button"
                onClick={() => goToStep(index)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${index === currentStep
                    ? 'bg-primary/10 border-primary text-primary'
                    : index < currentStep
                      ? 'bg-muted/50 border-muted-foreground/20 text-muted-foreground hover:bg-muted'
                      : 'border-border hover:bg-muted/50'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${index === currentStep
                      ? 'bg-primary text-primary-foreground'
                      : isStepCompleted(index)
                        ? 'bg-green-500 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                    {isStepCompleted(index) && index !== currentStep ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{step.title}</div>
                    <div className="text-sm text-muted-foreground">{step.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit(onSubmit)}>
            <Card className="min-h-[600px]">
              <CardContent className="p-8">
                {renderStepContent()}
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {currentStep === STEPS.length - 1 ? (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating Vault..." : "Create Vault"}
                </Button>
              ) : (
                <Button type="button" onClick={nextStep}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
