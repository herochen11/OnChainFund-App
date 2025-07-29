"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { getAssetOptions, getDeploymentDisplayName, getAssetDisplayName } from "@/lib/assets";
import { type Deployment } from "@/lib/consts";
import { Info } from "lucide-react";
import { UseFormRegister, UseFormSetValue, FieldErrors } from "react-hook-form";
import { useMemo } from "react";

interface BasicInfoStepProps {
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  watchedValues: any;
  errors: FieldErrors<any>;
  deployment?: Deployment;
}

export function BasicInfoStep({
  register,
  setValue,
  watchedValues,
  errors,
  deployment
}: BasicInfoStepProps) {

  // Generate asset options dynamically using getContract
  const assetOptions = useMemo(() => {
    return getAssetOptions(deployment);
  }, [deployment]);

  const selectedAssetLabel = useMemo(() => {
    if (!watchedValues.denominationAsset) return null;
    return getAssetDisplayName(watchedValues.denominationAsset, deployment);
  }, [watchedValues.denominationAsset, deployment]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Basic Information</h2>
        <p className="text-muted-foreground">Configure the fundamental details of your vault</p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="vaultName">Vault Name</Label>
            <Input
              id="vaultName"
              placeholder="e.g., DeFi Growth Fund"
              {...register("vaultName")}
              className={errors.vaultName ? "border-red-500" : ""}
            />
            {errors.vaultName && (
              <p className="text-sm text-red-500">{errors.vaultName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="vaultSymbol">Vault Symbol</Label>
            <Input
              id="vaultSymbol"
              placeholder="e.g., DGF"
              {...register("vaultSymbol")}
              className={errors.vaultSymbol ? "border-red-500" : ""}
            />
            {errors.vaultSymbol && (
              <p className="text-sm text-red-500">{errors.vaultSymbol.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="denominationAsset">Denomination Asset</Label>
          <Select
            options={assetOptions}
            placeholder="Select denomination asset"
            value={watchedValues.denominationAsset}
            onChange={(value) => setValue("denominationAsset", value)}
            className={errors.denominationAsset ? "border-red-500" : ""}
          />
          {errors.denominationAsset && (
            <p className="text-sm text-red-500">{errors.denominationAsset.message}</p>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            <span>The asset users will deposit to invest in this vault</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Network: {getDeploymentDisplayName(deployment)}
          </div>
        </div>

        {watchedValues.denominationAsset && selectedAssetLabel && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-medium mb-2">Selected Asset Details</h3>
            <p className="text-sm text-muted-foreground">
              {selectedAssetLabel}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Contract: {watchedValues.denominationAsset}
            </p>
            <p className="text-xs text-muted-foreground">
              Network: {getDeploymentDisplayName(deployment)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
