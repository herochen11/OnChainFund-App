"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { SelectOption } from "@/components/ui/select";
import { getAssetOptions, getAssetDisplayName } from "@/lib/assets";
import { type Deployment } from "@/lib/consts";
import { useMemo } from "react";
import type { CreateVaultFormData, VaultPolicy } from '@/types/vault';
import { FEE_TYPES } from '@/types/vault';

// Use FEE_TYPES from shared types
const FEE_TYPE_LABELS = [
  { id: "management", label: "Management Fee" },
  { id: "performance", label: "Performance Fee" },
  { id: "entrance", label: "Entrance Fee" },
  { id: "exit", label: "Exit Fee" },
];

// Policy types for display
const POLICY_TYPES: SelectOption[] = [
  { value: "allowedAssets", label: "Allowed Assets for Redemption" },
  { value: "allowedAdapters", label: "Allowed Adapters" },
  { value: "minMaxInvestment", label: "Min/Max Investment" },
  { value: "slippageTolerance", label: "Slippage Tolerance" },
];

interface ReviewStepProps {
  watchedValues: CreateVaultFormData;
  policies: VaultPolicy[];
  deployment?: Deployment;
}

export function ReviewStep({ watchedValues, policies, deployment = "ethereum" }: ReviewStepProps) {
  // Generate asset options dynamically using getContract
  const assetOptions = useMemo(() => {
    return getAssetOptions(deployment);
  }, [deployment]);

  const selectedAssetLabel = useMemo(() => {
    if (!watchedValues.denominationAsset) return "Not set";
    return getAssetDisplayName(watchedValues.denominationAsset, deployment);
  }, [watchedValues.denominationAsset, deployment]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Review & Deploy</h2>
        <p className="text-muted-foreground">Review your vault configuration before deployment</p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vault Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Name</Label>
                <p className="font-medium">{watchedValues.vaultName || "Not set"}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Symbol</Label>
                <p className="font-medium">{watchedValues.vaultSymbol || "Not set"}</p>
              </div>
              <div className="col-span-2">
                <Label className="text-sm text-muted-foreground">Denomination Asset</Label>
                <p className="font-medium">{selectedAssetLabel}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fees</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.entries(watchedValues.fees).filter(([_, fee]) => fee?.enabled).length === 0 ? (
              <p className="text-muted-foreground">No fees enabled</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(watchedValues.fees).map(([feeId, fee]) => {
                  if (!fee?.enabled) return null;
                  const feeType = FEE_TYPE_LABELS.find(f => f.id === feeId);
                  
                  if (feeId === 'exit') {
                    return (
                      <div key={feeId} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span>{feeType?.label || feeId} (In-Kind)</span>
                          <span className="font-medium">{fee.inKindRate}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>{feeType?.label || feeId} (Specific Assets)</span>
                          <span className="font-medium">{fee.specificAssetRate}%</span>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div key={feeId} className="flex justify-between items-center">
                      <span>{feeType?.label || feeId}</span>
                      <span className="font-medium">{fee.rate}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Policies ({policies.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {policies.length === 0 ? (
              <p className="text-muted-foreground">No policies configured</p>
            ) : (
              <div className="space-y-2">
                {policies.map((policy, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span>{POLICY_TYPES.find(p => p.value === policy.type)?.label || policy.type}</span>
                    <span className="text-sm text-muted-foreground">{policy.settings}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
