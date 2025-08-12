"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WalletAddressManager } from "@/components/WalletAddressManager";
import { AlertTriangle } from "lucide-react";
import { UseFormSetValue, UseFormWatch } from "react-hook-form";
import { useEffect } from "react"; // Import useEffect to potentially set initial values if needed

// Define the structure of the form data for this step
interface DepositsFormData {
  limitWalletsEnabled: boolean;
  depositLimitsEnabled: boolean;
  allowedWallets: string[];
  minDeposit: string;
  maxDeposit: string;
  rejectAllDeposits: boolean;
}

interface DepositsPolicyStepProps {
  // watchedValues will contain the current values of the form fields
  watchedValues: DepositsFormData;
  // setValue is used to programmatically update form field values
  setValue: UseFormSetValue<DepositsFormData>;
}

export function DepositsPolicyStep({ watchedValues, setValue }: DepositsPolicyStepProps) {

  // Destructure values from watchedValues for easier access
  // These values are now controlled by react-hook-form
  const {
    limitWalletsEnabled,
    depositLimitsEnabled,
    allowedWallets,
    minDeposit,
    maxDeposit,
    rejectAllDeposits, // This state is not yet used in the UI, but kept for consistency
  } = watchedValues;

  // useEffect to set initial default values if they are undefined in watchedValues.
  // This is important if the parent form doesn't provide initial values for these fields.
  useEffect(() => {
    if (watchedValues.limitWalletsEnabled === undefined) {
      setValue("limitWalletsEnabled", false);
    }
    if (watchedValues.depositLimitsEnabled === undefined) {
      setValue("depositLimitsEnabled", false);
    }
    if (watchedValues.allowedWallets === undefined) {
      setValue("allowedWallets", []);
    }
    if (watchedValues.minDeposit === undefined) {
      setValue("minDeposit", "");
    }
    if (watchedValues.maxDeposit === undefined) {
      setValue("maxDeposit", "");
    }
    if (watchedValues.rejectAllDeposits === undefined) {
      setValue("rejectAllDeposits", false);
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
            checked={limitWalletsEnabled}
            // Update the form state using setValue when the switch changes
            onCheckedChange={(checked) => setValue("limitWalletsEnabled", checked)}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            This policy acts in concert with but not as a replacement for the policy restricting wallets permitted to receive a share transfer. For example, if you enable this policy but allow your vault shares to be freely transferable, you will limit access to new shares but not to existing ones.
          </p>

          {limitWalletsEnabled && (
            <>
              <Button variant="outline" size="sm" className="text-green-600 border-green-600">
                Editable Setting
              </Button>

              <div className="space-y-4 p-4 border border-blue-500 rounded-lg bg-blue-50/50">
                <h4 className="font-medium text-blue-900">Limit Wallets Permitted To Deposit</h4>

                <WalletAddressManager
                  // Bind addresses to the value from react-hook-form
                  addresses={allowedWallets}
                  // Update the form state using setValue when addresses change
                  setAddresses={(newAddresses) => setValue("allowedWallets", newAddresses)}
                  placeholder="Enter address ..."
                  showOwnerButton={true}
                />

                <div className="pt-4 border-t">
                  <h5 className="font-medium mb-2">Disallow all depositor addresses</h5>
                  <p className="text-sm text-muted-foreground">This setting can be changed later</p>
                  {/* Assuming there might be a switch here for rejectAllDeposits for this section */}
                  {/* For example: */}
                  <Switch
                    checked={rejectAllDeposits}
                    onCheckedChange={(checked) => setValue("rejectAllDeposits", checked)}
                  />
                </div>
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
            checked={depositLimitsEnabled}
            // Update the form state using setValue when the switch changes
            onCheckedChange={(checked) => setValue("depositLimitsEnabled", checked)}
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

          {depositLimitsEnabled && (
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
                        placeholder="0"
                        // Bind value to the form state
                        value={minDeposit}
                        // Update form state using setValue on change
                        onChange={(e) => setValue("minDeposit", e.target.value)}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground">DAI</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Maximum Deposit Amount</Label>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <Input
                        placeholder="0"
                        // Bind value to the form state
                        value={maxDeposit}
                        // Update form state using setValue on change
                        onChange={(e) => setValue("maxDeposit", e.target.value)}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground">DAI</span>
                    </div>
                  </div>
                </div>

                {(!minDeposit && !maxDeposit && !rejectAllDeposits) && ( // Added rejectAllDeposits to condition
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">
                      Must specify either minimum or maximum amount, select "Reject all deposits", or disable the policy to unrestrict deposits.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="pt-4 border-t space-y-2">
                  <h5 className="font-medium">Reject all deposits</h5>
                  <p className="text-sm text-muted-foreground">
                    If you choose to reject all deposits, no one (including yourself) will be able to invest in the vault. This setting can be changed later.
                  </p>
                  {/* Switch for "Reject all deposits" */}
                  <div className="flex items-center space-x-2 mt-4">
                    <Switch
                      checked={rejectAllDeposits}
                      onCheckedChange={(checked) => setValue("rejectAllDeposits", checked)}
                      id="reject-all-deposits"
                    />
                    <Label htmlFor="reject-all-deposits">Reject all deposits</Label>
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
