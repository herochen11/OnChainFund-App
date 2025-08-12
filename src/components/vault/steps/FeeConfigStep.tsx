"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, type SelectOption } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { UseFormSetValue, UseFormWatch } from "react-hook-form";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Import Card components

// Define the structure for individual fee types
interface FeeDetail {
  enabled: boolean;
  rate?: number; // For management, performance, entrance
  inKindRate?: number; // Specific to exit fee
  specificAssetRate?: number; // Specific to exit fee
  recipient?: string; // For fees with a recipient
  allocation?: string; // For fees with allocation (entrance, exit)
}

// Define the overall form data structure for fees
interface FeesFormData {
  fees?: {
    management?: FeeDetail;
    performance?: FeeDetail;
    entrance?: FeeDetail;
    exit?: FeeDetail;
  };
}

interface FeeConfigStepProps {
  watchedValues: FeesFormData; // Now correctly typed
  setValue: UseFormSetValue<FeesFormData>; // Now correctly typed
}

// Fee types with descriptions
const FEE_TYPES = [
  {
    id: "management",
    label: "Management Fee",
    title: "Charge Management Fee",
    description: "If enabled, a flat fee measured as an annual percent of total assets under management. The management fee accrues continuously and is automatically paid out with every deposit and redemption.",
    defaultRate: 2.0,
    hasRecipient: true,
    hasAllocation: false,
    hasMultipleRates: false
  },
  {
    id: "performance",
    label: "Performance Fee",
    title: "Charge Performance Fee",
    description: "If enabled, measured based on the vault's performance. The performance fee is subject to a high-water mark.",
    defaultRate: 20.0,
    hasRecipient: true,
    hasAllocation: false,
    hasMultipleRates: false
  },
  {
    id: "entrance",
    label: "Entrance Fee",
    title: "Charge Entrance Fee",
    description: "If enabled, entrance fees are charged with every new deposit.",
    defaultRate: 0.5,
    hasRecipient: false,
    hasAllocation: true,
    hasMultipleRates: false
  },
  {
    id: "exit",
    label: "Exit Fee",
    title: "Charge Exit Fee",
    description: "If enabled, exit fees are charged with every redemption. This fee is set separately for in-kind redemptions or for specific asset redemptions.",
    defaultRate: 0.5, // This default rate is less relevant for multiple rates, but kept for consistency
    hasRecipient: false, // Recipient is dependent on allocation for exit fee
    hasAllocation: true,
    hasMultipleRates: true
  },
];

// Fee allocation options
const FEE_ALLOCATION_OPTIONS: SelectOption[] = [
  { value: "vault", label: "Vault" },
  { value: "manager", label: "Manager or other recipient" },
];

export function FeeConfigStep({ watchedValues, setValue }: FeeConfigStepProps) {

  // Use useEffect to set initial default values for each fee type if they are undefined.
  // This ensures that react-hook-form has a starting state for these fields.
  useEffect(() => {
    FEE_TYPES.forEach((feeType) => {
      const feePath = `fees.${feeType.id}`;
      // Initialize enabled state
      if (watchedValues.fees?.[feeType.id as keyof typeof watchedValues.fees]?.enabled === undefined) {
        setValue(`${feePath}.enabled`, false);
      }
      // Initialize rates based on whether it has multiple rates or a single rate
      if (feeType.hasMultipleRates) {
        if (watchedValues.fees?.[feeType.id as keyof typeof watchedValues.fees]?.inKindRate === undefined) {
          setValue(`${feePath}.inKindRate`, 1.0); // Default for in-kind exit fee
        }
        if (watchedValues.fees?.[feeType.id as keyof typeof watchedValues.fees]?.specificAssetRate === undefined) {
          setValue(`${feePath}.specificAssetRate`, 5.0); // Default for specific asset exit fee
        }
      } else {
        if (watchedValues.fees?.[feeType.id as keyof typeof watchedValues.fees]?.rate === undefined) {
          setValue(`${feePath}.rate`, feeType.defaultRate);
        }
      }
      // Initialize allocation if applicable
      if (feeType.hasAllocation && watchedValues.fees?.[feeType.id as keyof typeof watchedValues.fees]?.allocation === undefined) {
        setValue(`${feePath}.allocation`, "vault"); // Default allocation
      }
      // Initialize recipient if applicable
      // Note: Recipient is only relevant if hasRecipient is true OR if hasAllocation is true AND allocation is 'manager'
      if (feeType.hasRecipient && watchedValues.fees?.[feeType.id as keyof typeof watchedValues.fees]?.recipient === undefined) {
        setValue(`${feePath}.recipient`, "");
      }
    });
  }, [watchedValues, setValue]);


  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Fees</h2>
        <p className="text-muted-foreground">
          Vault managers can charge several types of fees, all of which are paid out in shares of the vault.{" "}
          <span className="font-medium">To enable a fee, toggle it on and configure it below.</span>
        </p>
      </div>

      <div className="space-y-8">
        {FEE_TYPES.map((feeType) => {
          // Get the current fee state from watchedValues for this specific feeType
          const currentFeeState = watchedValues.fees?.[feeType.id as keyof typeof watchedValues.fees];
          const isEnabled = currentFeeState?.enabled || false;

          return (
            // Each fee type is now wrapped in a Card component
            <Card key={feeType.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg">{feeType.title}</CardTitle>
                </div>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={(enabled) => {
                    setValue(`fees.${feeType.id}.enabled`, enabled);
                    // When enabling, set default rate(s) if not already set
                    if (enabled) {
                      if (feeType.hasMultipleRates) {
                        if (currentFeeState?.inKindRate === undefined) setValue(`fees.${feeType.id}.inKindRate`, 1.0);
                        if (currentFeeState?.specificAssetRate === undefined) setValue(`fees.${feeType.id}.specificAssetRate`, 5.0);
                      } else {
                        if (currentFeeState?.rate === undefined) setValue(`fees.${feeType.id}.rate`, feeType.defaultRate);
                      }
                      // Set default allocation if applicable and not set
                      if (feeType.hasAllocation && currentFeeState?.allocation === undefined) {
                        setValue(`fees.${feeType.id}.allocation`, "vault");
                      }
                      // Set default recipient if applicable and not set
                      if (feeType.hasRecipient && currentFeeState?.recipient === undefined) {
                        setValue(`fees.${feeType.id}.recipient`, "");
                      }
                    }
                  }}
                />
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  {feeType.description}
                </p>

                {isEnabled && (
                  <div className="space-y-4 pt-4 border-t border-border">
                    {feeType.hasMultipleRates ? (
                      // Exit fee with multiple rates
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor={`${feeType.id}-inKind`}>Exit Fee Rate for in kind redemptions</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id={`${feeType.id}-inKind`}
                              type="number"
                              placeholder="1"
                              step="0.01"
                              min="0"
                              max="100"
                              value={currentFeeState?.inKindRate ?? 1.0}
                              onChange={(e) => setValue(`fees.${feeType.id}.inKindRate`, parseFloat(e.target.value) || 0)}
                              className="max-w-xs"
                            />
                            <span className="text-muted-foreground">%</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`${feeType.id}-specific`}>Exit Fee Rate for redemptions in specific assets</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id={`${feeType.id}-specific`}
                              type="number"
                              placeholder="5"
                              step="0.01"
                              min="0"
                              max="100"
                              value={currentFeeState?.specificAssetRate ?? 5.0}
                              onChange={(e) => setValue(`fees.${feeType.id}.specificAssetRate`, parseFloat(e.target.value) || 0)}
                              className="max-w-xs"
                            />
                            <span className="text-muted-foreground">%</span>
                          </div>
                        </div>

                        {feeType.hasAllocation && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor={`${feeType.id}-allocation`}>Exit Fee allocated to</Label>
                              <Select
                                options={FEE_ALLOCATION_OPTIONS}
                                placeholder="Select allocation"
                                value={currentFeeState?.allocation || "vault"}
                                onChange={(value) => setValue(`fees.${feeType.id}.allocation`, value)}
                                className="max-w-xs"
                              />
                            </div>

                            {currentFeeState?.allocation === "manager" && (
                              <div className="space-y-2">
                                <Label htmlFor={`${feeType.id}-recipient`}>Recipient Address (optional)</Label>
                                <Input
                                  id={`${feeType.id}-recipient`}
                                  type="text"
                                  placeholder="Enter address ..."
                                  value={currentFeeState?.recipient || ""}
                                  onChange={(e) => setValue(`fees.${feeType.id}.recipient`, e.target.value)}
                                  className="max-w-md"
                                />
                                <p className="text-xs text-muted-foreground">
                                  By default, the fee recipient is the vault owner
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      // Standard rate configuration
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor={`${feeType.id}-rate`}>Rate (%)</Label>
                          <Input
                            id={`${feeType.id}-rate`}
                            type="number"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            max="100"
                            value={currentFeeState?.rate ?? feeType.defaultRate}
                            onChange={(e) => setValue(`fees.${feeType.id}.rate`, parseFloat(e.target.value) || 0)}
                          />
                        </div>

                        {feeType.hasRecipient && (
                          <div className="space-y-2">
                            <Label htmlFor={`${feeType.id}-recipient`}>Recipient Address (optional)</Label>
                            <Input
                              id={`${feeType.id}-recipient`}
                              type="text"
                              placeholder="Enter address ..."
                              value={currentFeeState?.recipient || ""}
                              onChange={(e) => setValue(`fees.${feeType.id}.recipient`, e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                              By default, the fee recipient is the vault owner
                            </p>
                          </div>
                        )}

                        {feeType.hasAllocation && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor={`${feeType.id}-allocation`}>
                                {feeType.id === "entrance" ? "Entrance Fee allocated to" : "Allocation"}
                              </Label>
                              <Select
                                options={FEE_ALLOCATION_OPTIONS}
                                placeholder="Select allocation"
                                value={currentFeeState?.allocation || "vault"}
                                onChange={(value) => setValue(`fees.${feeType.id}.allocation`, value)}
                              />
                            </div>

                            {currentFeeState?.allocation === "manager" && (
                              <div className="space-y-2 col-span-full">
                                <Label htmlFor={`${feeType.id}-recipient-allocation`}>Recipient Address (optional)</Label>
                                <Input
                                  id={`${feeType.id}-recipient-allocation`}
                                  type="text"
                                  placeholder="Enter address ..."
                                  value={currentFeeState?.recipient || ""}
                                  onChange={(e) => setValue(`fees.${feeType.id}.recipient`, e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                  By default, the fee recipient is the vault owner
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    <div className="flex justify-start">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                        Semi-permanent Setting
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
