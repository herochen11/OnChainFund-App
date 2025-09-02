"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { CreateVaultFormData } from '@/types/vault';
import { UseFormSetValue, type FieldErrors } from "react-hook-form";

interface RedemptionsPolicyStepProps {
  watchedValues: CreateVaultFormData;
  setValue: UseFormSetValue<CreateVaultFormData>;
  errors?: FieldErrors<CreateVaultFormData>;
}

// Time unit options for the select
const TIME_UNITS = [
  { value: "minutes", label: "Minutes" },
  { value: "hours", label: "Hours" },
  { value: "days", label: "Days" },
  { value: "weeks", label: "Weeks" },
] as const;

// Utility function to convert time to seconds
export const convertToSeconds = (value: string, unit: string): number => {
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return 0;

  switch (unit) {
    case 'minutes':
      return Math.floor(numValue * 60);
    case 'hours':
      return Math.floor(numValue * 60 * 60);
    case 'days':
      return Math.floor(numValue * 24 * 60 * 60);
    case 'weeks':
      return Math.floor(numValue * 7 * 24 * 60 * 60);
    default:
      return 0;
  }
};

// Utility function to get recommended value display
const getRecommendedDisplay = (value: string, unit: string): string => {
  const seconds = convertToSeconds(value, unit);
  if (seconds === 86400) return "24 hours (recommended)";
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 604800) return `${Math.round(seconds / 86400)} days`;
  return `${Math.round(seconds / 604800)} weeks`;
};

export function RedemptionsPolicyStep({ watchedValues, setValue, errors }: RedemptionsPolicyStepProps) {

  // State for collapsible section
  const [isRequiredSectionOpen, setIsRequiredSectionOpen] = useState(true);

  // Simple debug logging like other steps
  console.log('RedemptionsPolicyStep errors:', errors);

  // Extract shares lock-up period values
  const lockUpPeriod = watchedValues.sharesLockUpPeriod || { value: "24", unit: "hours" };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Redemptions</h2>
        <p className="text-muted-foreground">Configure redemption policies for your vault</p>
      </div>

      {/* General Warning */}
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-700">
          <strong>Settings in this section are restrictive.</strong> Enable them to control how your depositors can redeem their shares. Read the individual setting descriptions carefully to understand their implications and how they might work together.
        </AlertDescription>
      </Alert>

      {/* Required Section */}
      <Card>
        <CardHeader className="pb-2">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setIsRequiredSectionOpen(!isRequiredSectionOpen)}
          >
            <CardTitle className="text-lg">Required</CardTitle>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isRequiredSectionOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </CardHeader>

        {isRequiredSectionOpen && (
          <CardContent className="space-y-6">
            {/* Shares Lock-Up Period */}
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold">Shares Lock-Up Period</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Defines the amount of time that must pass after a user's last receipt of shares via deposit before that user is allowed to either redeem or transfer any shares. This is an arbitrage protection, and funds that have untrusted depositors should use a non-zero value. The recommended value is 24 hours.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="text-yellow-600 border-yellow-600 bg-yellow-50"
              >
                Semi-permanent Setting
              </Button>

              <div className="space-y-4 p-4 border border-gray-300 rounded-lg bg-gray-50/50">
                <Label className="text-sm font-medium">Shares Lock-Up Period</Label>

                <div className="flex gap-3 items-start">
                  {/* Value Input */}
                  <div className="flex-1">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="24"
                      value={lockUpPeriod.value}
                      onChange={(e) => {
                        setValue("sharesLockUpPeriod", {
                          value: e.target.value,
                          unit: lockUpPeriod.unit,
                        });
                      }}
                      className={`${errors?.sharesLockUpPeriod?.value ? 'border-red-500' : ''}`}
                    />
                    {errors?.sharesLockUpPeriod?.value && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.sharesLockUpPeriod.value.message}
                      </p>
                    )}
                  </div>

                  {/* Unit Select */}
                  <div className="w-32">
                    <Select
                      options={TIME_UNITS}
                      value={lockUpPeriod.unit}
                      onChange={(value) => {
                        setValue("sharesLockUpPeriod", {
                          value: lockUpPeriod.value,
                          unit: value as 'minutes' | 'hours' | 'days' | 'weeks',
                        });
                      }}
                      className={`${errors?.sharesLockUpPeriod?.unit ? 'border-red-500' : ''}`}
                    />
                    {errors?.sharesLockUpPeriod?.unit && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.sharesLockUpPeriod.unit.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Display current value in seconds and user-friendly format
                {lockUpPeriod.value && !isNaN(parseFloat(lockUpPeriod.value)) && (
                  <div className="text-sm text-muted-foreground">
                    <p>
                      <strong>Current setting:</strong> {getRecommendedDisplay(lockUpPeriod.value, lockUpPeriod.unit)}
                    </p>
                    <p>
                      <strong>In seconds:</strong> {convertToSeconds(lockUpPeriod.value, lockUpPeriod.unit).toLocaleString()} seconds
                    </p>
                  </div>
                )} */}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Optional Policies Section (placeholder for future implementation) */}
      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className="text-lg">Optional Redemption Policies</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Additional redemption policies will be implemented here in a future update.
            These will include settings for allowed redemption assets, minimum balances, and specific redemption restrictions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}