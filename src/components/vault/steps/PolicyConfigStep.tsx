"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, type SelectOption } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { UseFormSetValue } from "react-hook-form";

// Policy types  
const POLICY_TYPES: SelectOption[] = [
  { value: "allowedAssets", label: "Allowed Assets for Redemption" },
  { value: "allowedAdapters", label: "Allowed Adapters" },
  { value: "minMaxInvestment", label: "Min/Max Investment" },
  { value: "slippageTolerance", label: "Slippage Tolerance" },
];

interface PolicyConfigStepProps {
  policies: { type: string; settings: string }[];
  setPolicies: (policies: { type: string; settings: string }[]) => void;
  setValue: UseFormSetValue<any>;
}

export function PolicyConfigStep({ policies, setPolicies, setValue }: PolicyConfigStepProps) {
  const addPolicy = () => {
    const newPolicies = [...policies, { type: "", settings: "" }];
    setPolicies(newPolicies);
    setValue("policies", newPolicies);
  };

  const removePolicy = (index: number) => {
    const newPolicies = policies.filter((_, i) => i !== index);
    setPolicies(newPolicies);
    setValue("policies", newPolicies);
  };

  const updatePolicy = (index: number, field: "type" | "settings", value: string) => {
    const newPolicies = [...policies];
    newPolicies[index] = { ...newPolicies[index], [field]: value };
    setPolicies(newPolicies);
    setValue("policies", newPolicies);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Policy Configuration</h2>
          <p className="text-muted-foreground">Set investment restrictions and operational policies (optional)</p>
        </div>
        <Button type="button" onClick={addPolicy} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Policy
        </Button>
      </div>

      <div className="space-y-4">
        {policies.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-lg">
            <div className="max-w-sm mx-auto">
              <h3 className="font-medium mb-2">No policies configured</h3>
              <p className="text-sm">Add policies to control how your vault operates</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {policies.map((policy, index) => (
              <div key={index} className="flex items-end gap-4 p-4 border rounded-lg">
                <div className="flex-1 space-y-2">
                  <Label>Policy Type</Label>
                  <Select
                    options={POLICY_TYPES}
                    placeholder="Select policy type"
                    value={policy.type}
                    onChange={(value) => updatePolicy(index, "type", value)}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label>Settings</Label>
                  <Input
                    placeholder="Policy configuration"
                    value={policy.settings}
                    onChange={(e) => updatePolicy(index, "settings", e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removePolicy(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
