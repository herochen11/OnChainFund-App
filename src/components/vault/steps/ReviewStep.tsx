"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getAssetOptions, getAssetDisplayName } from "@/lib/assets";
import { type Deployment } from "@/lib/consts";
import { useMemo } from "react";
import type { CreateVaultFormData } from '@/types/vault';
import { FEE_TYPES as FEE_TYPE_LABELS } from '@/types/vault';
import { POLICY_TYPES, POLICY_CATEGORIES } from '@/types/policies';

interface ReviewStepProps {
  watchedValues: CreateVaultFormData;
  deployment?: Deployment;
}

export function ReviewStep({ watchedValues, deployment = "ethereum" }: ReviewStepProps) {
  // Generate asset options dynamically using getContract
  const assetOptions = useMemo(() => {
    return getAssetOptions(deployment);
  }, [deployment]);

  const selectedAssetLabel = useMemo(() => {
    if (!watchedValues.denominationAsset) return "Not set";
    return getAssetDisplayName(watchedValues.denominationAsset, deployment);
  }, [watchedValues.denominationAsset, deployment]);

  // Helper function to get enabled policies with their details
  const getEnabledPolicies = () => {
    if (!watchedValues.policies) return [];
    
    const enabledPolicies = [];
    
    // Check each policy in the configuration
    Object.entries(watchedValues.policies).forEach(([policyId, policyConfig]) => {
      if (policyConfig?.enabled) {
        const policyType = POLICY_TYPES.find(p => p.id === policyId);
        if (policyType) {
          enabledPolicies.push({
            id: policyId,
            config: policyConfig,
            type: policyType,
          });
        }
      }
    });
    
    return enabledPolicies;
  };

  // Helper function to format policy settings for display
  const formatPolicySettings = (policyId: string, settings: any) => {
    if (!settings) return "Enabled";

    switch (policyId) {
      case "minMaxInvestment":
        const parts = [];
        if (settings.minInvestmentAmount) {
          parts.push(`Min: ${settings.minInvestmentAmount} DAI`);
        }
        if (settings.maxInvestmentAmount) {
          parts.push(`Max: ${settings.maxInvestmentAmount} DAI`);
        }
        return parts.length > 0 ? parts.join(", ") : "Deposit limits configured";

      case "allowedDepositRecipients":
        const addresses = settings.newListsArgs?.[0]?.initialItems || [];
        if (addresses.length === 0) {
          return "No addresses specified";
        }
        return `${addresses.length} address${addresses.length !== 1 ? 'es' : ''} allowed`;

      case "cumulativeSlippageTolerance":
        return settings.slippageTolerance ? `${settings.slippageTolerance} basis points` : "Configured";

      case "allowedAdapters":
      case "allowedAdapterIncomingAssets":
      case "disallowedAdapterIncomingAssets":
      case "allowedAssetsForRedemption":
      case "allowedRedeemersForSpecificAssets":
      case "allowedSharesTransferRecipients":
        const itemCount = settings.newListsArgs?.[0]?.initialItems?.length || 0;
        return `${itemCount} item${itemCount !== 1 ? 's' : ''} configured`;

      case "allowedExternalPositionTypes":
        const typeCount = settings.externalPositionTypeIds?.length || 0;
        return `${typeCount} position type${typeCount !== 1 ? 's' : ''} allowed`;

      case "minAssetBalancesPostRedemption":
        const assetCount = settings.assetToMinBalance?.length || 0;
        return `${assetCount} asset${assetCount !== 1 ? 's' : ''} with minimum balances`;

      case "noDepegOnRedeemSharesForSpecificAssets":
        const configCount = settings.assetConfigs?.length || 0;
        return `${configCount} asset${configCount !== 1 ? 's' : ''} protected from depeg`;

      case "allowedAdaptersPerManager":
      case "allowedExternalPositionTypesPerManager":
        const userCount = settings.users?.length || 0;
        return `${userCount} manager${userCount !== 1 ? 's' : ''} configured`;

      default:
        return "Configured";
    }
  };

  // Helper function to truncate address for display
  const truncateAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Group enabled policies by category
  const groupPoliciesByCategory = () => {
    const enabledPolicies = getEnabledPolicies();
    const grouped = POLICY_CATEGORIES.map(category => ({
      ...category,
      policies: enabledPolicies.filter(p => p.type.category === category.id)
    })).filter(category => category.policies.length > 0);
    
    return grouped;
  };

  const policiesByCategory = groupPoliciesByCategory();
  const totalEnabledPolicies = getEnabledPolicies().length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Review & Deploy</h2>
        <p className="text-muted-foreground">Review your vault configuration before deployment</p>
      </div>

      <div className="space-y-4">
        {/* Vault Overview */}
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
              <div className="col-span-2">
                <Label className="text-sm text-muted-foreground">Shares Lock-Up Period</Label>
                <p className="font-medium">
                  {watchedValues.sharesLockUpPeriod?.value || "24"} {watchedValues.sharesLockUpPeriod?.unit || "hours"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fees Review */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fee Configuration</CardTitle>
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

        {/* Policies Review */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Policy Configuration</CardTitle>
              <Badge variant="secondary">
                {totalEnabledPolicies} polic{totalEnabledPolicies !== 1 ? 'ies' : 'y'} enabled
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {totalEnabledPolicies === 0 ? (
              <p className="text-muted-foreground">No policies configured</p>
            ) : (
              <div className="space-y-6">
                {policiesByCategory.map((category) => (
                  <div key={category.id} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm text-primary">{category.label}</h4>
                      <Badge variant="outline" className="text-xs">
                        {category.policies.length} enabled
                      </Badge>
                    </div>
                    <div className="space-y-2 ml-4">
                      {category.policies.map((policy) => (
                        <div key={policy.id} className="flex flex-col space-y-1">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <span className="font-medium text-sm">{policy.type.label}</span>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatPolicySettings(policy.id, policy.config.settings)}
                              </p>
                            </div>
                            <Badge variant="secondary" className="text-xs">Enabled</Badge>
                          </div>
                          
                          {/* Show detailed settings for complex policies */}
                          {policy.id === "minMaxInvestment" && policy.config.settings && (
                            <div className="ml-2 text-xs text-muted-foreground space-y-1">
                              {policy.config.settings.minInvestmentAmount && (
                                <div>• Minimum: {policy.config.settings.minInvestmentAmount} DAI</div>
                              )}
                              {policy.config.settings.maxInvestmentAmount && (
                                <div>• Maximum: {policy.config.settings.maxInvestmentAmount} DAI</div>
                              )}
                            </div>
                          )}

                          {/* Show addresses for address list policies */}
                          {policy.config.settings?.newListsArgs?.[0]?.initialItems && (
                            <div className="ml-2 text-xs text-muted-foreground">
                              <div className="font-medium mb-1">Addresses:</div>
                              {policy.config.settings.newListsArgs[0].initialItems.slice(0, 3).map((address: string, idx: number) => (
                                <div key={idx}>• {truncateAddress(address)}</div>
                              ))}
                              {policy.config.settings.newListsArgs[0].initialItems.length > 3 && (
                                <div>• ... and {policy.config.settings.newListsArgs[0].initialItems.length - 3} more</div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-green-800">Ready to Deploy</h3>
              <p className="text-sm text-green-700">
                Your vault is configured with {Object.entries(watchedValues.fees).filter(([_, fee]) => fee?.enabled).length} fee{Object.entries(watchedValues.fees).filter(([_, fee]) => fee?.enabled).length !== 1 ? 's' : ''} and {totalEnabledPolicies} polic{totalEnabledPolicies !== 1 ? 'ies' : 'y'}. 
                Click "Create Vault" to deploy to the blockchain.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}