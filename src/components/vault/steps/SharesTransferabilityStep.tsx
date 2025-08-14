"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WalletAddressManager } from "@/components/WalletAddressManager";
import { AlertTriangle, X } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { UseFormSetValue } from "react-hook-form";
import type { CreateVaultFormData } from '@/types/vault';

interface SharesTransferabilityStepProps {
  watchedValues: CreateVaultFormData;
  setValue: UseFormSetValue<CreateVaultFormData>;
}

export function SharesTransferabilityStep({ watchedValues, setValue }: SharesTransferabilityStepProps) {
  const { address, isConnected } = useAccount();

  // Helper function to format wallet addresses
  const formatAddress = (addr: string) => {
    if (!addr || addr.length <= 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Get shares policies from form data
  const sharesPolicies = watchedValues.sharesPolicies || {};
  const {
    restrictSharesTransfer = false,
    allowedTransferWallets = [],
  } = sharesPolicies;

  // Local state for disallow all transfers
  const [disallowAllTransfers, setDisallowAllTransfers] = useState(false);

  // Initialize form values
  useEffect(() => {
    if (sharesPolicies.restrictSharesTransfer === undefined) {
      setValue("sharesPolicies.restrictSharesTransfer", false);
    }
    if (sharesPolicies.allowedTransferWallets === undefined) {
      setValue("sharesPolicies.allowedTransferWallets", []);
    }
  }, [sharesPolicies, setValue]);

  // Update policies when settings change
  useEffect(() => {
    if (restrictSharesTransfer) {
      const policies = [...(watchedValues.policies || [])];
      const existingPolicyIndex = policies.findIndex(p => p.type === 'AllowedSharesTransferRecipientsPolicy');
      
      const policyData = {
        type: 'AllowedSharesTransferRecipientsPolicy',
        settings: JSON.stringify({
          allowedRecipients: allowedTransferWallets,
          disallowAllTransfers
        })
      };

      if (existingPolicyIndex >= 0) {
        policies[existingPolicyIndex] = policyData;
      } else {
        policies.push(policyData);
      }

      setValue('policies', policies);
    } else {
      // Remove the policy if disabled
      const policies = (watchedValues.policies || []).filter(p => p.type !== 'AllowedSharesTransferRecipientsPolicy');
      setValue('policies', policies);
    }
  }, [restrictSharesTransfer, allowedTransferWallets, disallowAllTransfers, setValue, watchedValues.policies]);



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
            checked={restrictSharesTransfer}
            onCheckedChange={(checked) => setValue("sharesPolicies.restrictSharesTransfer", checked)}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              If enabled, restricts the potential recipients of shares transferred outside of the normal asset deposit and share minting process.
            </p>
            <p>
              This policy acts in concert with but not as a replacement for the policy which restricts wallets able to receive minted shares.
            </p>
            <p>
              In general, if you enable this policy to restrict who can receive shares that are already minted, you should also restrict who can mint new shares to the same list of wallets.
            </p>
          </div>

          {restrictSharesTransfer && (
            <>
              <Button variant="outline" size="sm" className="text-green-600 border-green-600">
                Editable Setting
              </Button>

              <div className="space-y-4 p-4 border border-blue-500 rounded-lg bg-blue-50/50">
                <h4 className="font-medium text-blue-900">Restrict Wallets Permitted To Receive A Share Transfer</h4>

                <WalletAddressManager
                  addresses={allowedTransferWallets}
                  setAddresses={(addresses) => setValue("sharesPolicies.allowedTransferWallets", addresses)}
                  placeholder="Enter address ..."
                  showOwnerButton={true}
                />

                <div className="pt-4 border-t space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="disallow-all-transfers"
                      checked={disallowAllTransfers}
                      onCheckedChange={setDisallowAllTransfers}
                    />
                    <Label htmlFor="disallow-all-transfers" className="font-medium">
                      Disallow all transfers
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    If enabled, no shares can be transferred to any wallet (including the owner). This setting can be changed later.
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
