"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { type Deployment } from "@/lib/consts";
import { useDeployment } from "@/lib/hooks/useDeployment";
import { BasicInfoStep } from "./steps/BasicInfoStep";
import { FeeConfigStep } from "./steps/FeeConfigStep";
import { DepositsPolicyStep } from "./steps/DepositsPolicyStep";
import { SharesTransferabilityStep } from "./steps/SharesTransferabilityStep";
import { RedemptionsPolicyStep } from "./steps/RedemptionsPolicyStep";
import { AssetManagementStep } from "./steps/AssetManagementStep";
import { ReviewStep } from "./steps/ReviewStep";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { type Address } from 'viem';

// Import Enzyme SDK
import { LifeCycle } from "@enzymefinance/sdk";
import { CUSTOM_SEPOLIA_ENVIRONMENT } from '@/config/sepolia-environment';
import { waitForTransactionReceipt } from 'viem/actions';

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
    id: 'deposits',
    title: 'Deposits',
    description: 'Deposit policies'
  },
  {
    id: 'shares',
    title: 'Shares transferability',
    description: 'Share transfer rules'
  },
  {
    id: 'redemptions',
    title: 'Redemptions',
    description: 'Redemption policies'
  },
  {
    id: 'assets',
    title: 'Asset management',
    description: 'Asset policies'
  },
  {
    id: 'review',
    title: 'Review',
    description: 'Confirm & deploy'
  }
];

export function CreateVaultForm({ deployment }: CreateVaultFormProps) {
  const deploymentState = useDeployment();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Use the detected deployment from wallet, fallback to prop
  const currentDeployment = deploymentState.deployment || deployment;

  const [currentStep, setCurrentStep] = useState(0);
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([0]));
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

  // Helper function to parse vault creation result from transaction logs
  const parseVaultCreationResult = (logs: any[], txHash: string) => {
    try {
      console.log('Parsing transaction logs:', logs);

      // Simple parsing - look for any relevant events
      return {
        success: true,
        message: 'Vault created successfully! Check transaction for contract addresses.',
        transactionHash: txHash,
      };
    } catch (error) {
      console.error('Failed to parse vault creation result:', error);
      return {
        success: false,
        message: 'Vault creation transaction completed, but could not parse result from logs',
        transactionHash: txHash,
        error: error instanceof Error ? error.message : 'Unknown parsing error'
      };
    }
  };

  // Main vault creation function using Enzyme SDK
  const onSubmit = async (data: CreateVaultFormData) => {
    console.log('=== VAULT CREATION DEBUG ===');

    // Check if on supported network
    if (deploymentState.needsNetworkSwitch) {
      alert('Please switch to a supported network (Ethereum, Polygon, or Sepolia) first');
      return;
    }

    if (!address) {
      alert('Please connect your wallet first');
      return;
    }

    if (!publicClient || !walletClient) {
      alert('Wallet client not available');
      return;
    }

    try {
      // Debug all the inputs
      console.log("Form data:", data);
      console.log("Connected address:", address);
      console.log("Environment:", CUSTOM_SEPOLIA_ENVIRONMENT);
      console.log("Fund Deployer:", CUSTOM_SEPOLIA_ENVIRONMENT.contracts?.fundDeployer);

      // Validate required fields
      if (!data.vaultName || !data.vaultSymbol || !data.denominationAsset) {
        throw new Error('Missing required fields: vaultName, vaultSymbol, or denominationAsset');
      }

      // Prepare parameters with detailed logging
      const vaultParams = {
        fundDeployer: CUSTOM_SEPOLIA_ENVIRONMENT.contracts.fundDeployer,
        owner: address,
        name: data.vaultName,
        symbol: data.vaultSymbol,
        denominationAsset: data.denominationAsset as Address,
        sharesActionTimelockInSeconds: 0n,
        feeManagerConfigData: '0x' as const,
        policyManagerConfigData: '0x' as const,
      };

      console.log("Vault parameters:", vaultParams);

      // Check each parameter
      Object.entries(vaultParams).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          console.error(`❌ Parameter ${key} is invalid:`, value);
          throw new Error(`Parameter ${key} is ${value}`);
        }
        console.log(`✅ ${key}:`, value);
      });

      console.log("Creating vault transaction with SDK...");

      // Create vault transaction using Enzyme SDK
      const vaultTransaction = LifeCycle.createVault(vaultParams);

      // Execute the transaction - Debug each property first
      console.log("Pre-execution debugging:");
      console.log("- vaultTransaction:", vaultTransaction);
      console.log("- vaultTransaction.params:", vaultTransaction.params);
      console.log("- address:", vaultTransaction.params?.address);
      console.log("- abi:", vaultTransaction.params?.abi);
      console.log("- abi length:", vaultTransaction.params?.abi?.length);
      console.log("- functionName:", vaultTransaction.params?.functionName);
      console.log("- args:", vaultTransaction.params?.args);
      console.log("- args length:", vaultTransaction.params?.args?.length);

      // Extract transaction parameters correctly
      const txParams = vaultTransaction.params;

      // Validate each property before using it
      if (!txParams?.address) {
        throw new Error('Transaction address is undefined');
      }
      if (!txParams?.abi) {
        throw new Error('Transaction ABI is undefined');
      }
      if (!txParams?.functionName) {
        throw new Error('Transaction functionName is undefined');
      }
      if (!txParams?.args) {
        throw new Error('Transaction args is undefined');
      }

      console.log("✅ All transaction properties validated");
      console.log("Executing transaction...");

      const hash = await walletClient.writeContract({
        address: txParams.address,
        abi: txParams.abi,
        functionName: txParams.functionName,
        args: txParams.args,
      });

      console.log('✅ Transaction submitted:', hash);

      // Wait for transaction confirmation
      const receipt = await waitForTransactionReceipt(publicClient, {
        hash,
        confirmations: 1
      });

      console.log('✅ Transaction confirmed:', receipt);

      // Parse the result (simplified for now)
      const result = parseVaultCreationResult(receipt.logs, hash);

      // Show success message
      alert(`✅ Vault Created Successfully using Enzyme SDK!

Vault Name: ${data.vaultName}
Symbol: ${data.vaultSymbol}
Owner: ${address}
Network: ${currentDeployment}

🔗 Transaction: ${hash}

Check Sepolia Etherscan:
https://sepolia.etherscan.io/tx/${hash}

${result.message}`);

    } catch (error) {
      console.error('=== VAULT CREATION ERROR ===');
      console.error('Full error object:', error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      alert(`❌ Vault creation failed: ${errorMessage}

Check the browser console for detailed error information.`);
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof CreateVaultFormData)[] = [];

    switch (currentStep) {
      case 0:
        fieldsToValidate = ['vaultName', 'vaultSymbol', 'denominationAsset'];
        break;
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        // Other steps are optional for now
        break;
    }

    if (fieldsToValidate.length > 0) {
      const isValid = await trigger(fieldsToValidate);
      if (!isValid) return;
    }

    const nextStepIndex = Math.min(currentStep + 1, STEPS.length - 1);
    setCurrentStep(nextStepIndex);
    setVisitedSteps(prev => new Set([...prev, nextStepIndex]));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
    setVisitedSteps(prev => new Set([...prev, stepIndex]));
  };

  const isStepCompleted = (stepIndex: number) => {
    if (!visitedSteps.has(stepIndex)) {
      return false;
    }

    switch (stepIndex) {
      case 0:
        return watchedValues.vaultName && watchedValues.vaultSymbol && watchedValues.denominationAsset;
      default:
        return true; // Other steps are optional for basic vault creation
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
            deployment={currentDeployment}
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
          <DepositsPolicyStep
            watchedValues={watchedValues}
            setValue={setValue}
          />
        );
      case 3:
        return (
          <SharesTransferabilityStep
            watchedValues={watchedValues}
            setValue={setValue}
          />
        );
      case 4:
        return <RedemptionsPolicyStep />;
      case 5:
        return <AssetManagementStep />;
      case 6:
        return (
          <ReviewStep
            watchedValues={watchedValues}
            policies={policies}
            deployment={currentDeployment}
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
        <p className="text-muted-foreground">Deploy a new on-chain asset management vault using Enzyme SDK</p>
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
                <Button
                  type="submit"
                  disabled={isSubmitting || deploymentState.needsNetworkSwitch}
                  className={deploymentState.needsNetworkSwitch ? "opacity-50" : ""}
                >
                  {isSubmitting
                    ? "Creating Vault with SDK..."
                    : deploymentState.needsNetworkSwitch
                      ? "Switch Network to Create Vault"
                      : "Create Vault with Enzyme SDK"
                  }
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
