"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, type SelectOption } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { UseFormSetValue, UseFormWatch } from "react-hook-form";

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
    defaultRate: 0.5,
    hasRecipient: false,
    hasAllocation: true,
    hasMultipleRates: true
  },
];

// Fee allocation options
const FEE_ALLOCATION_OPTIONS: SelectOption[] = [
  { value: "vault", label: "Vault" },
  { value: "manager", label: "Manager or other recipient" },
];

interface FeeConfigStepProps {
  watchedValues: any;
  setValue: UseFormSetValue<any>;
}

export function FeeConfigStep({ watchedValues, setValue }: FeeConfigStepProps) {
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
        {FEE_TYPES.map((feeType) => (
          <div key={feeType.id} className="space-y-6 p-6 border border-border rounded-lg">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1 pr-4">
                <h3 className="text-xl font-semibold">{feeType.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feeType.description}
                </p>
              </div>
              <Switch
                checked={watchedValues.fees?.[feeType.id as keyof typeof watchedValues.fees]?.enabled || false}
                onCheckedChange={(enabled) => {
                  setValue(`fees.${feeType.id}.enabled`, enabled);
                  if (enabled) {
                    setValue(`fees.${feeType.id}.rate`, feeType.defaultRate);
                  }
                }}
              />
            </div>
            
            {watchedValues.fees?.[feeType.id as keyof typeof watchedValues.fees]?.enabled && (
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
                          value={watchedValues.fees?.exit?.inKindRate || 1.0}
                          onChange={(e) => setValue('fees.exit.inKindRate', parseFloat(e.target.value) || 0)}
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
                          value={watchedValues.fees?.exit?.specificAssetRate || 5.0}
                          onChange={(e) => setValue('fees.exit.specificAssetRate', parseFloat(e.target.value) || 0)}
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
                            value={watchedValues.fees?.exit?.allocation || "vault"}
                            onChange={(value) => setValue('fees.exit.allocation', value)}
                            className="max-w-xs"
                          />
                        </div>
                        
                        {watchedValues.fees?.exit?.allocation === "manager" && (
                          <div className="space-y-2">
                            <Label htmlFor={`${feeType.id}-recipient`}>Recipient Address (optional)</Label>
                            <Input
                              id={`${feeType.id}-recipient`}
                              type="text"
                              placeholder="Enter address ..."
                              value={watchedValues.fees?.exit?.recipient || ""}
                              onChange={(e) => setValue('fees.exit.recipient', e.target.value)}
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
                        value={watchedValues.fees?.[feeType.id as keyof typeof watchedValues.fees]?.rate || feeType.defaultRate}
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
                          value={watchedValues.fees?.[feeType.id as keyof typeof watchedValues.fees]?.recipient || ""}
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
                          <Label htmlFor={`${feeType.id}-allocation`}>Entrance Fee allocated to</Label>
                          <Select
                            options={FEE_ALLOCATION_OPTIONS}
                            placeholder="Select allocation"
                            value={watchedValues.fees?.entrance?.allocation || "vault"}
                            onChange={(value) => setValue('fees.entrance.allocation', value)}
                          />
                        </div>
                        
                        {watchedValues.fees?.entrance?.allocation === "manager" && (
                          <div className="space-y-2 col-span-full">
                            <Label htmlFor={`${feeType.id}-recipient`}>Recipient Address (optional)</Label>
                            <Input
                              id={`${feeType.id}-recipient`}
                              type="text"
                              placeholder="Enter address ..."
                              value={watchedValues.fees?.entrance?.recipient || ""}
                              onChange={(e) => setValue('fees.entrance.recipient', e.target.value)}
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
          </div>
        ))}
      </div>
    </div>
  );
}
