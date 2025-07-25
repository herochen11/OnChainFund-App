"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, type SelectOption } from "@/components/ui/select";
import { Info } from "lucide-react";
import { UseFormRegister, UseFormSetValue, FieldErrors } from "react-hook-form";

// Asset options for now - WETH, WBTC, DAI
const ASSET_OPTIONS: SelectOption[] = [
  { value: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", label: "WETH - Wrapped Ether" },
  { value: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", label: "WBTC - Wrapped Bitcoin" },
  { value: "0x6B175474E89094C44Da98b954EedeAC495271d0F", label: "DAI - Dai Stablecoin" },
];

interface BasicInfoStepProps {
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  watchedValues: any;
  errors: FieldErrors<any>;
}

export function BasicInfoStep({ register, setValue, watchedValues, errors }: BasicInfoStepProps) {
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
            options={ASSET_OPTIONS}
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
        </div>

        {watchedValues.denominationAsset && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-medium mb-2">Selected Asset Details</h3>
            <p className="text-sm text-muted-foreground">
              {ASSET_OPTIONS.find(asset => asset.value === watchedValues.denominationAsset)?.label}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Contract: {watchedValues.denominationAsset}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
