"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WalletAddressManager } from "@/components/WalletAddressManager";
import { AlertTriangle } from "lucide-react";
import type { CreateVaultFormData } from '@/types/vault';
import { UseFormSetValue, type FieldErrors } from "react-hook-form";
import { useEffect, useState } from "react";

interface DepositsPolicyStepProps {
  watchedValues: CreateVaultFormData;
  setValue: UseFormSetValue<CreateVaultFormData>;
  errors?: FieldErrors<CreateVaultFormData>;
}

export function DepositsPolicyStep({ watchedValues, setValue, errors }: DepositsPolicyStepProps) {

  // Simple debug logging like BasicInfoStep
  console.log('DepositsPolicyStep errors:', errors);

  // Destructure values from watchedValues.policies for deposit-related policies
  const minMaxInvestment = watchedValues.policies?.minMaxInvestment || { enabled: false };
  const allowedDepositRecipients = watchedValues.policies?.allowedDepositRecipients || { enabled: false };

  // Extract settings with defaults
  const minInvestmentAmount = minMaxInvestment.settings?.minInvestmentAmount || "";
  const maxInvestmentAmount = minMaxInvestment.settings?.maxInvestmentAmount || "";
  const depositRecipientsList = allowedDepositRecipients.settings?.newListsArgs?.[0]?.initialItems || [];

  // Track "disallow all" and "reject all" states
  const [disallowAllAddresses, setDisallowAllAddresses] = useState(false);
  const [rejectAllDeposits, setRejectAllDeposits] = useState(false);

  // useEffect to set initial default values if they are undefined in watchedValues.
  useEffect(() => {
    if (!watchedValues.policies?.minMaxInvestment) {
      setValue("policies.minMaxInvestment", { enabled: false });
    }
    if (!watchedValues.policies?.allowedDepositRecipients) {
      setValue("policies.allowedDepositRecipients", { enabled: false });
    }
  }, [watchedValues, setValue]);


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Deposits</h2>
        <p className="text-muted-foreground">Configure deposit policies for your vault</p>
      </div>

      {/* General Warning */}
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-700">
          <strong>Settings in this section are restrictive.</strong> Enable them to control who can deposit in your vault, and in what amounts. If disabled, anyone can deposit any amount into your vault.
        </AlertDescription>
      </Alert>

      {/* Limit Wallets Permitted To Deposit */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg">Limit Wallets Permitted To Deposit</CardTitle>
          </div>
          <Switch
            // Bind checked state to the value from react-hook-form
            checked={allowedDepositRecipients.enabled}
            // Update the form state using setValue when the switch changes
            onCheckedChange={(checked) => {
              setValue("policies.allowedDepositRecipients", {
                enabled: checked,
                settings: checked ? {
                  existingListIds: [],
                  newListsArgs: [{
                    updateType: "0",
                    initialItems: depositRecipientsList,
                  }],
                } : undefined,
              });
            }}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            This policy acts in concert with but not as a replacement for the policy restricting wallets permitted to receive a share transfer. For example, if you enable this policy but allow your vault shares to be freely transferable, you will limit access to new shares but not to existing ones.
          </p>

          {allowedDepositRecipients.enabled && (
            <>
              <Button variant="outline" size="sm" className="text-green-600 border-green-600">
                Editable Setting
              </Button>

              <div className="space-y-4 p-4 border border-blue-500 rounded-lg bg-blue-50/50">
                <h4 className="font-medium text-blue-900">Limit Wallets Permitted To Deposit</h4>
                <WalletAddressManager
                  // Bind addresses to the value from react-hook-form
                  addresses={depositRecipientsList}
                  // Update the form state using setValue when addresses change
                  setAddresses={(newAddresses) => {
                    setValue("policies.allowedDepositRecipients", {
                      enabled: true,
                      settings: {
                        existingListIds: [],
                        newListsArgs: [{
                          updateType: "0",
                          initialItems: newAddresses,
                        }],
                      },
                    });
                  }}
                  placeholder="Enter address ..."
                  showOwnerButton={true}
                />
                {errors?.policies?.allowedDepositRecipients?.settings && (
                  <p className="text-red-500 text-xs">{errors.policies.allowedDepositRecipients.settings.message}</p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Deposit Limits */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg">Deposit Limits</CardTitle>
          </div>
          <Switch
            // Bind checked state to the value from react-hook-form
            checked={minMaxInvestment.enabled}
            // Update the form state using setValue when the switch changes
            onCheckedChange={(checked) => {
              setValue("policies.minMaxInvestment", {
                enabled: checked,
                settings: checked ? {
                  minInvestmentAmount: "",
                  maxInvestmentAmount: "",
                } : undefined,
              });
            }}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">
              Restricts the amount of a single deposit with either a minimum, a maximum, or both.
            </p>
            <p className="text-muted-foreground text-sm">
              You can also reject all deposits into this vault using <span className="font-medium">this policy</span>.
            </p>
          </div>

          {minMaxInvestment.enabled && (
            <>
              <Button variant="outline" size="sm" className="text-green-600 border-green-600">
                Editable Setting
              </Button>

              <div className="space-y-4 p-4 border border-blue-500 rounded-lg bg-blue-50/50">
                <h4 className="font-medium text-blue-900">Specify deposit limits</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Minimum Deposit Amount</Label>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <Input
                        placeholder="100"
                        type="number"
                        step="0.01"
                        min="0"
                        // Bind value to the form state
                        value={minInvestmentAmount}
                        // Update form state using setValue on change
                        onChange={(e) => {
                          setValue("policies.minMaxInvestment", {
                            enabled: true,
                            settings: {
                              minInvestmentAmount: e.target.value,
                              maxInvestmentAmount: maxInvestmentAmount,
                            },
                          });
                        }}
                        className={`flex-1 ${errors?.policies?.minMaxInvestment?.settings ? 'border-red-500' : ''}`}
                      />
                      <span className="text-sm text-muted-foreground">DAI</span>
                    </div>
                    {errors?.policies?.minMaxInvestment?.settings && (
                      <p className="text-red-500 text-xs">{errors.policies.minMaxInvestment.settings.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Maximum Deposit Amount</Label>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <Input
                        placeholder="1000000"
                        type="number"
                        step="0.01"
                        min="0"
                        // Bind value to the form state
                        value={maxInvestmentAmount}
                        // Update form state using setValue on change
                        onChange={(e) => {
                          setValue("policies.minMaxInvestment", {
                            enabled: true,
                            settings: {
                              minInvestmentAmount: minInvestmentAmount,
                              maxInvestmentAmount: e.target.value,
                            },
                          });
                        }}
                        className={`flex-1 ${errors?.policies?.minMaxInvestment?.settings ? 'border-red-500' : ''}`}
                      />
                      <span className="text-sm text-muted-foreground">DAI</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
