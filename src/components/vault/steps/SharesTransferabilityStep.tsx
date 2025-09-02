"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WalletAddressManager } from "@/components/WalletAddressManager";
import { AlertTriangle } from "lucide-react";
import type { CreateVaultFormData } from '@/types/vault';
import { UseFormSetValue, type FieldErrors } from "react-hook-form";
import { useEffect } from "react";

interface SharesTransferabilityStepProps {
  watchedValues: CreateVaultFormData;
  setValue: UseFormSetValue<CreateVaultFormData>;
  errors?: FieldErrors<CreateVaultFormData>;
}

export function SharesTransferabilityStep({ watchedValues, setValue, errors }: SharesTransferabilityStepProps) {

  // Simple debug logging like other steps
  console.log('SharesTransferabilityStep errors:', errors);

  // Destructure values from watchedValues.policies for share transfer policy
  const allowedSharesTransferRecipients = watchedValues.policies?.allowedSharesTransferRecipients || { enabled: false };

  // Extract settings with defaults
  const shareTransferRecipientsList = allowedSharesTransferRecipients.settings?.newListsArgs?.[0]?.initialItems || [];

  // useEffect to set initial default values if they are undefined in watchedValues
  useEffect(() => {
    if (!watchedValues.policies?.allowedSharesTransferRecipients) {
      setValue("policies.allowedSharesTransferRecipients", { enabled: false });
    }
  }, [watchedValues, setValue]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Shares Transferability</h2>
        <p className="text-muted-foreground">Configure share transfer policies for your vault</p>
      </div>

      {/* General Warning */}
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-700">
          <strong>Settings in this section are restrictive.</strong> Enable them to determine who can receive your vault's shares via direct transfer. If disabled, anyone can receive your vault's shares in the secondary market.
        </AlertDescription>
      </Alert>

      {/* Restrict Wallets Permitted To Receive A Share Transfer */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg">Restrict Wallets Permitted To Receive A Share Transfer</CardTitle>
          </div>
          <Switch
            // Bind checked state to the value from react-hook-form
            checked={allowedSharesTransferRecipients.enabled}
            // Update the form state using setValue when the switch changes
            onCheckedChange={(checked) => {
              setValue("policies.allowedSharesTransferRecipients", {
                enabled: checked,
                settings: checked ? {
                  existingListIds: [],
                  newListsArgs: [{
                    updateType: "0",
                    initialItems: shareTransferRecipientsList,
                  }],
                } : undefined,
              });
            }}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">
              If enabled, restricts the potential recipients of shares transferred outside of the normal asset deposit and share minting process.
            </p>
            <p className="text-muted-foreground text-sm">
              This policy acts in concert with but not as a replacement for the policy which restricts wallets able to receive minted shares.
            </p>
            <p className="text-muted-foreground text-sm">
              In general, if you enable this policy to restrict who can receive shares that are already minted, you should also restrict who can mint new shares to the same list of wallets.
            </p>
          </div>

          {
            allowedSharesTransferRecipients.enabled && (
              <>
                <Button variant="outline" size="sm" className="text-green-600 border-green-600">
                  Editable Setting
                </Button>

                <div className="space-y-4 p-4 border border-blue-500 rounded-lg bg-blue-50/50">
                  <h4 className="font-medium text-blue-900">Restrict Wallets Permitted To Receive A Share Transfer</h4>
                  <WalletAddressManager
                    // Bind addresses to the value from react-hook-form
                    addresses={shareTransferRecipientsList}
                    // Update the form state using setValue when addresses change
                    setAddresses={(newAddresses) => {
                      setValue("policies.allowedSharesTransferRecipients", {
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
                  {errors?.policies?.allowedSharesTransferRecipients?.settings && (
                    <p className="text-red-500 text-xs">{errors.policies.allowedSharesTransferRecipients.settings.message}</p>
                  )}
                </div>
              </>
            )
          }
        </CardContent >
      </Card >
    </div >
  );
}