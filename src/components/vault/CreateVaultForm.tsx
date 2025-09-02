"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getNetworkByDeployment, type Deployment } from "@/lib/consts";
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
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { type Address, type Hex } from 'viem';
import { type CreateVaultFormData } from '@/types/vault';
import { createVaultSchema, stepSchemas } from '@/types/vaultSchemas';
import { defaultVaultFormData } from '@/types/vaultDefaults';
import { VAULT_CREATION_STEPS, getStepIndex, getRequiredFields, getValidationSchema, getStepById, getNextStep, getPreviousStep, type VaultCreationStepId } from '@/types/vaultSteps';
import { logFeesConfig } from '@/lib/feeConfigLog';
import { logPoliciesConfig } from "@/lib/policyConfigLog";
import { encodeFeeData } from '@/lib/feeConfigEncode';
import { encodePolicyData, type PolicyEncodingContext } from '@/lib/policyConfigEncode';
import { Fee, Policy } from "@enzymefinance/sdk/Configuration";

// Import Enzyme SDK
import { LifeCycle } from "@enzymefinance/sdk";
import { CUSTOM_SEPOLIA_ENVIRONMENT } from '@/config/sepolia-environment';
import { waitForTransactionReceipt } from 'viem/actions';
import { convertToSeconds } from './steps/RedemptionsPolicyStep';

interface CreateVaultFormProps {
  deployment: Deployment;
}

export function CreateVaultForm({ deployment }: CreateVaultFormProps) {
  const deploymentState = useDeployment();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Use the detected deployment from wallet, fallback to prop
  const currentDeployment = deploymentState.deployment || deployment;

  const [currentStepId, setCurrentStepId] = useState<VaultCreationStepId>('basic');
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([0]));

  // Derived values using vaultSteps utilities
  const currentStepIndex = getStepIndex(currentStepId);
  const currentStepConfig = getStepById(currentStepId);


  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateVaultFormData>({
    resolver: zodResolver(createVaultSchema),
    defaultValues: defaultVaultFormData,
    // Keep form data in React state for step navigation
    // Data persists during session but clears when leaving form
    mode: "onChange",
  });

  const watchedValues = watch();


  // Clean up when component unmounts (user leaves create vault form)
  useEffect(() => {
    return () => {
      console.log('CreateVaultForm unmounting - form data will be cleared');
      // React Hook Form state is automatically cleared on unmount
      // No localStorage persistence needed
    };
  }, []);

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

    // Safety check: only allow submission on the review step
    if (currentStepId !== 'review') {
      console.warn('⚠️ Form submission attempted on non-review step:', currentStepId);
      console.warn('This should not happen - preventing submission');
      return;
    }

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

      logFeesConfig(data);

      // Fee validation and encoding - this is where validation errors are caught
      console.log("🔍 Starting fee validation and encoding...");
      const encodedFees = encodeFeeData(data.fees, currentDeployment);
      console.log("✅ Fees encoded successfully:", encodedFees);
      const feeManagerConfigData = encodedFees.length === 0
        ? "0x" as Hex
        : Fee.encodeSettings(encodedFees);

      // Store original fee rates for future reference (optional)
      // const originalFeeRates = {
      //   management: data.fees.management.enabled ? data.fees.management.rate : null,
      //   performance: data.fees.performance.enabled ? data.fees.performance.rate : null,
      //   entrance: data.fees.entrance.enabled ? data.fees.entrance.rate : null,
      //   exit: data.fees.exit.enabled ? {
      //     inKind: data.fees.exit.inKindRate,
      //     specificAsset: data.fees.exit.specificAssetRate
      //   } : null,
      // };
      // console.log("💾 Original fee rates:", originalFeeRates);

      logPoliciesConfig(data);

      // Policy validation and encoding with list creation
      console.log("🔍 Policy configuration:", data.policies);

      // Create policy encoding context
      const policyContext: PolicyEncodingContext = {
        walletClient,
        publicClient,
        vaultOwner: address
      };

      console.log("🏠 Creating address lists and encoding policies...");

      const encodedPolicies = encodePolicyData(data.policies, data.denominationAsset as Address, currentDeployment);
      console.log("✅ Policies encoded successfully:", encodedPolicies);

      const policyManagerConfigData = encodedPolicies.length === 0
        ? "0x" as Hex
        : Policy.encodeSettings(encodedPolicies);

      // Convert shares lock-up period to seconds
      const sharesActionTimelockInSeconds = BigInt(
        convertToSeconds(data.sharesLockUpPeriod.value, data.sharesLockUpPeriod.unit)
      );
      console.log("🔒 Shares lock-up period:", {
        original: `${data.sharesLockUpPeriod.value} ${data.sharesLockUpPeriod.unit}`,
        seconds: sharesActionTimelockInSeconds.toString()
      });

      // Validate required fields
      if (!data.vaultName || !data.vaultSymbol || !data.denominationAsset || !data.sharesLockUpPeriod) {
        throw new Error('Missing required fields: vaultName, vaultSymbol, denominationAsset, or sharesLockUpPeriod');
      }

      // Prepare parameters with detailed logging
      const vaultParams = {
        fundDeployer: CUSTOM_SEPOLIA_ENVIRONMENT.contracts.fundDeployer,
        owner: address,
        name: data.vaultName,
        symbol: data.vaultSymbol,
        denominationAsset: data.denominationAsset as Address,
        sharesActionTimelockInSeconds: sharesActionTimelockInSeconds,
        feeManagerConfigData: feeManagerConfigData,
        policyManagerConfigData: policyManagerConfigData, // Use empty policy config for now
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

      console.log("Creating vault transaction ...");

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

      console.log("Vault created successfully:", data.vaultName, data.vaultSymbol);

    } catch (error) {
      console.error('=== VAULT CREATION ERROR ===');
      console.error('Full error object:', error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

      // Handle other types of errors
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      alert(`❌ Vault creation failed: ${errorMessage}\n\nCheck the browser console for detailed error information.`);

      console.log("Vault creation failed:", errorMessage);
    }
  };

  const nextStep = async () => {
    // Get required fields for current step
    const requiredFields = getRequiredFields(currentStepId);

    // Get validation schema for current step
    const validationSchemaKey = getValidationSchema(currentStepId);

    // For fees step, we need to trigger validation on all fee fields to populate errors
    if (currentStepId === 'fees') {
      const isValid = await trigger('fees');
      if (!isValid) {
        console.log('Fee validation failed');
        return;
      }
    } else if (currentStepId === 'deposits') {
      // For deposits step, trigger policy validation
      const isValid = await trigger('policies');
      if (!isValid) {
        console.log('Policy validation failed');
        return;
      }
    } else if (currentStepId === 'transferability') {
      // For transferability step, trigger policy validation
      const isValid = await trigger('policies');
      if (!isValid) {
        console.log('Transferability policy validation failed');
        return;
      }
    } else if (currentStepId === 'redemptions') {
      // For redemptions step, trigger validation on required fields
      const isValid = await trigger('sharesLockUpPeriod');
      if (!isValid) {
        console.log('Redemptions validation failed');
        return;
      }
    } else if (requiredFields.length > 0) {
      // For other steps, validate required fields
      const isValid = await trigger(requiredFields as any);
      if (!isValid) {
        console.log('Validation failed for step:', currentStepId);
        return;
      }
    }

    // Navigate using utility functions
    const nextStepId = getNextStep(currentStepId);
    if (nextStepId) {
      setCurrentStepId(nextStepId);
      setVisitedSteps(prev => new Set([...prev, getStepIndex(nextStepId)]));
    }
  };

  const prevStep = () => {
    const previousStepId = getPreviousStep(currentStepId);
    if (previousStepId) {
      setCurrentStepId(previousStepId);
    }
  };

  const goToStep = (stepId: VaultCreationStepId) => {
    setCurrentStepId(stepId);
    setVisitedSteps(prev => new Set([...prev, getStepIndex(stepId)]));
  };

  const isStepCompleted = (stepIndex: number) => {
    if (!visitedSteps.has(stepIndex)) {
      return false;
    }

    const step = VAULT_CREATION_STEPS[stepIndex];
    if (!step) {
      return false;
    }

    switch (step.id) {
      case 'basic':
        return watchedValues.vaultName && watchedValues.vaultSymbol && watchedValues.denominationAsset;
      case 'redemptions':
        return watchedValues.sharesLockUpPeriod?.value && watchedValues.sharesLockUpPeriod?.unit;
      case 'fees':
        // Fee step is always considered complete (fees are optional)
        return true;
      case 'deposits':
      case 'transferability':
      case 'assets':
        // Policy steps are always considered complete (policies are optional)
        return true;
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    switch (currentStepId) {
      case 'basic':
        return (
          <BasicInfoStep
            register={register}
            setValue={setValue}
            watchedValues={watchedValues}
            errors={errors}
            deployment={currentDeployment}
          />
        );
      case 'fees':
        return (
          <FeeConfigStep
            watchedValues={watchedValues}
            setValue={setValue}
            vaultOwnerAddress={address || undefined}
            errors={errors}
          />
        );
      case 'deposits':
        return (
          <DepositsPolicyStep
            watchedValues={watchedValues}
            setValue={setValue}
            errors={errors}
          />
        );
      case 'transferability':
        return (
          <SharesTransferabilityStep
            watchedValues={watchedValues}
            setValue={setValue}
            errors={errors}
          />
        );
      case 'redemptions':
        return (
          <RedemptionsPolicyStep
            watchedValues={watchedValues}
            setValue={setValue}
            errors={errors}
          />
        );
      case 'assets':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">Trading Policies</h3>
            <p className="text-muted-foreground">
              Asset policy configuration will be available here soon.
            </p>
          </div>
        );
      case 'review':
        return (
          <ReviewStep
            watchedValues={watchedValues}
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
            {VAULT_CREATION_STEPS.map((step, index) => (
              <button
                key={step.id}
                type="button"
                onClick={() => goToStep(step.id)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${step.id === currentStepId
                  ? 'bg-primary/10 border-primary text-primary'
                  : index < currentStepIndex
                    ? 'bg-muted/50 border-muted-foreground/20 text-muted-foreground hover:bg-muted'
                    : 'border-border hover:bg-muted/50'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${step.id === currentStepId
                    ? 'bg-primary text-primary-foreground'
                    : isStepCompleted(index)
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                    }`}>
                    {isStepCompleted(index) && step.id !== currentStepId ? (
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
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  prevStep();
                }}
                disabled={currentStepIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {currentStepIndex === VAULT_CREATION_STEPS.length - 1 ? (
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
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    nextStep();
                  }}
                >
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
