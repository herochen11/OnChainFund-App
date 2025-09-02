"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, type SelectOption } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { UseFormSetValue, FieldErrors } from "react-hook-form";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CreateVaultFormData, FeeTypeId } from '@/types/vault';
import { FEE_TYPES } from '@/types/vault';
import { type Address } from "viem";

interface FeeConfigStepProps {
  watchedValues: CreateVaultFormData;
  setValue: UseFormSetValue<CreateVaultFormData>;
  vaultOwnerAddress: Address;
  errors?: FieldErrors<CreateVaultFormData>;
}

// Fee allocation options
const FEE_ALLOCATION_OPTIONS: SelectOption[] = [
  { value: "vault", label: "Vault" },
  { value: "manager", label: "Manager or other recipient" },
];

export function FeeConfigStep({ watchedValues, setValue, vaultOwnerAddress, errors }: FeeConfigStepProps) {

  // Use useEffect to set initial default values for each fee type if they are undefined.
  useEffect(() => {
    console.log("Initializing fee configuration defaults...");
    console.log("VaultOwner Address:", vaultOwnerAddress);
    FEE_TYPES.forEach((feeType) => {
      const currentFee = watchedValues.fees[feeType.id];

      // Initialize enabled state
      if (currentFee?.enabled === undefined) {
        setValue(`fees.${feeType.id}.enabled` as any, false);
      }

      // Initialize rates as empty strings to allow proper placeholder behavior
      if (feeType.hasMultipleRates) {
        if (currentFee?.inKindRate === undefined) {
          setValue(`fees.${feeType.id}.inKindRate` as any, "");
        }
        if (currentFee?.specificAssetRate === undefined) {
          setValue(`fees.${feeType.id}.specificAssetRate` as any, "");
        }
      } else {
        if (currentFee?.rate === undefined) {
          setValue(`fees.${feeType.id}.rate` as any, "");
        }
      }

      // Initialize allocation if applicable
      if (feeType.hasAllocation && currentFee?.allocation === undefined) {
        setValue(`fees.${feeType.id}.allocation` as any, "vault");
      }

      // Initialize recipient if applicable
      if (feeType.hasRecipient && currentFee?.recipient === undefined) {
        setValue(`fees.${feeType.id}.recipient` as any, vaultOwnerAddress);
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
          const currentFeeState = watchedValues.fees[feeType.id];
          const isEnabled = currentFeeState?.enabled || false;

          return (
            <Card key={feeType.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg">{feeType.title}</CardTitle>
                </div>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={(enabled) => {
                    setValue(`fees.${feeType.id}.enabled` as any, enabled);
                    if (enabled) {
                      // When enabling, set empty values to ensure proper validation
                      if (feeType.hasMultipleRates) {
                        setValue(`fees.${feeType.id}.inKindRate` as any, "");
                        setValue(`fees.${feeType.id}.specificAssetRate` as any, "");
                      } else {
                        setValue(`fees.${feeType.id}.rate` as any, "");
                      }
                      // Set default allocation if applicable
                      if (feeType.hasAllocation) {
                        setValue(`fees.${feeType.id}.allocation` as any, "vault");
                      }
                      // Set default recipient if applicable
                      if (feeType.hasRecipient) {
                        setValue(`fees.${feeType.id}.recipient` as any, vaultOwnerAddress);
                      }
                    } else {
                      // When disabling, clear all values
                      if (feeType.hasMultipleRates) {
                        setValue(`fees.${feeType.id}.inKindRate` as any, "");
                        setValue(`fees.${feeType.id}.specificAssetRate` as any, "");
                      } else {
                        setValue(`fees.${feeType.id}.rate` as any, "");
                      }
                      if (feeType.hasRecipient) {
                        setValue(`fees.${feeType.id}.recipient` as any, "");
                      }
                      if (feeType.hasAllocation) {
                        setValue(`fees.${feeType.id}.allocation` as any, "vault");
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
                              placeholder="1.0"
                              step="0.01"
                              min="0"
                              max="100"
                              value={currentFeeState?.inKindRate || ""}
                              onChange={(e) => setValue(`fees.${feeType.id}.inKindRate` as any, e.target.value)}
                              className={`max-w-xs ${errors?.fees?.[feeType.id]?.inKindRate ? 'border-red-500' : ''}`}
                            />
                            <span className="text-muted-foreground">%</span>
                          </div>
                          {errors?.fees?.exit?.inKindRate && (
                            <p className="text-red-500 text-xs">{errors.fees.exit.inKindRate.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`${feeType.id}-specific`}>Exit Fee Rate for redemptions in specific assets</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id={`${feeType.id}-specific`}
                              type="number"
                              placeholder="5.0"
                              step="0.01"
                              min="0"
                              max="100"
                              value={currentFeeState?.specificAssetRate || ""}
                              onChange={(e) => setValue(`fees.${feeType.id}.specificAssetRate` as any, e.target.value)}
                              className={`max-w-xs ${errors?.fees?.[feeType.id]?.specificAssetRate ? 'border-red-500' : ''}`}
                            />
                            <span className="text-muted-foreground">%</span>
                          </div>
                          {errors?.fees?.exit?.specificAssetRate && (
                            <p className="text-red-500 text-xs">{errors.fees.exit.specificAssetRate.message}</p>
                          )}
                        </div>

                        {feeType.hasAllocation && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor={`${feeType.id}-allocation`}>Exit Fee allocated to</Label>
                              <Select
                                options={FEE_ALLOCATION_OPTIONS}
                                placeholder="Select allocation"
                                value={currentFeeState?.allocation || "vault"}
                                onChange={(value) => {
                                  setValue(`fees.${feeType.id}.allocation` as any, value)

                                  // Clear recipient when switching to vault, set owner when switching to manager
                                  if (value === "vault") {
                                    // Clear recipient when allocation is set to vault
                                    setValue(`fees.${feeType.id}.recipient` as any, "");
                                  } else if (value === "manager") {
                                    // Set to owner address when switching to manager (if not already set)
                                    if (!currentFeeState?.recipient) {
                                      setValue(`fees.${feeType.id}.recipient` as any, vaultOwnerAddress || "");
                                    }
                                  }
                                }
                                }
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
                                  onChange={(e) => setValue(`fees.${feeType.id}.recipient` as any, e.target.value)}
                                  onBlur={(e) => {
                                    // If user clears the field and leaves it empty, reset to owner
                                    if (!e.target.value.trim() && vaultOwnerAddress && currentFeeState?.enabled) {
                                      setValue(`fees.${feeType.id}.recipient` as any, vaultOwnerAddress);
                                    }
                                  }}
                                  className="max-w-md"
                                />
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setValue(`fees.${feeType.id}.recipient` as any, vaultOwnerAddress || "")}
                                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                                  >
                                    Use vault owner address
                                  </button>
                                  <span className="text-xs text-muted-foreground">
                                    ({vaultOwnerAddress ? `${vaultOwnerAddress.slice(0, 6)}...${vaultOwnerAddress.slice(-4)}` : 'not set'})
                                  </span>
                                </div>
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
                            placeholder={feeType.id === "management" ? "2.0" : feeType.id === "performance" ? "20.0" : "0.5"}
                            step="0.01"
                            min="0"
                            max="100"
                            value={currentFeeState?.rate || ""}
                            onChange={(e) => setValue(`fees.${feeType.id}.rate` as any, e.target.value)}
                            className={errors?.fees?.[feeType.id]?.rate ? 'border-red-500' : ''}
                          />
                          {errors?.fees?.[feeType.id as 'management' | 'performance' | 'entrance' | 'exit']?.rate && (
                            <p className="text-red-500 text-xs">{errors.fees[feeType.id as 'management' | 'performance' | 'entrance' | 'exit']?.rate?.message}</p>
                          )}
                        </div>

                        {feeType.hasRecipient && (
                          <div className="space-y-2">
                            <Label htmlFor={`${feeType.id}-recipient`}>Recipient Address</Label>
                            <Input
                              id={`${feeType.id}-recipient`}
                              type="text"
                              placeholder="Enter recipient address..."
                              value={currentFeeState?.recipient || ""}
                              onChange={(e) => setValue(`fees.${feeType.id}.recipient` as any, e.target.value)}
                              className="max-w-md"
                              onBlur={(e) => {
                                // If user clears the field and leaves it empty, reset to owner
                                if (!e.target.value.trim() && vaultOwnerAddress && currentFeeState?.enabled) {
                                  setValue(`fees.${feeType.id}.recipient` as any, vaultOwnerAddress);
                                }
                              }}
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setValue(`fees.${feeType.id}.recipient` as any, vaultOwnerAddress || "")}
                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                              >
                                Use vault owner address
                              </button>
                              <span className="text-xs text-muted-foreground">
                                ({vaultOwnerAddress ? `${vaultOwnerAddress.slice(0, 6)}...${vaultOwnerAddress.slice(-4)}` : 'not set'})
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              The recipient address defaults to the vault owner when the fee is enabled
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
                                onChange={(value) => {
                                  setValue(`fees.${feeType.id}.allocation` as any, value)
                                  // Clear recipient when switching to vault, set owner when switching to manager
                                  if (value === "vault") {
                                    // Clear recipient when allocation is set to vault
                                    setValue(`fees.${feeType.id}.recipient` as any, "");
                                  } else if (value === "manager") {
                                    // Set to owner address when switching to manager (if not already set)
                                    if (!currentFeeState?.recipient) {
                                      setValue(`fees.${feeType.id}.recipient` as any, vaultOwnerAddress || "");
                                    }
                                  }
                                }
                                }
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
                                  onChange={(e) => setValue(`fees.${feeType.id}.recipient` as any, e.target.value)}
                                  onBlur={(e) => {
                                    // If user clears the field and leaves it empty, reset to owner
                                    if (!e.target.value.trim() && vaultOwnerAddress && currentFeeState?.enabled) {
                                      setValue(`fees.${feeType.id}.recipient` as any, vaultOwnerAddress);
                                    }
                                  }}
                                />
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setValue(`fees.${feeType.id}.recipient` as any, vaultOwnerAddress || "")}
                                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                                  >
                                    Use vault owner address
                                  </button>
                                  <span className="text-xs text-muted-foreground">
                                    ({vaultOwnerAddress ? `${vaultOwnerAddress.slice(0, 6)}...${vaultOwnerAddress.slice(-4)}` : 'not set'})
                                  </span>
                                </div>
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
