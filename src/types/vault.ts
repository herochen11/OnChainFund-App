// Shared type definitions for vault creation and configuration
import { type Address } from "viem"
// Import policy types from the dedicated policy types file
import type {
  VaultPolicyConfiguration,
  PolicyTypeId,
  POLICY_TYPES,
  POLICY_CATEGORIES,
  EncodedPolicy,
  VaultPolicyData,
  PolicyValidationResult,
  PolicyRecommendation
} from './policies'

export interface FeeDetail {
  enabled: boolean;
  rate?: string; // Store as string to allow empty values
  inKindRate?: string; // Store as string to allow empty values
  specificAssetRate?: string; // Store as string to allow empty values
  recipient?: Address; // Optional recipient address
  allocation?: string; // For fees with allocation (entrance, exit)
}

export interface VaultFees {
  management: FeeDetail;
  performance: FeeDetail;
  entrance: FeeDetail;
  exit: FeeDetail;
}

// Clean vault form data structure
export interface CreateVaultFormData {
  vaultName: string;
  vaultSymbol: string;
  denominationAsset: string;
  sharesLockUpPeriod: {
    value: string; // The numeric value (e.g., "24", "0.5")
    unit: 'minutes' | 'hours' | 'days' | 'weeks'; // The time unit
  };
  fees: VaultFees;
  policies: VaultPolicyConfiguration;
}

// Props interface for components that need vault form data
export interface VaultFormComponentProps {
  watchedValues: CreateVaultFormData;
  setValue: any; // Will be typed properly when used with UseFormSetValue
}

// Fee configuration constants
export const FEE_TYPES = [
  {
    id: "management" as const,
    label: "Management Fee",
    title: "Charge Management Fee",
    description: "If enabled, a flat fee measured as an annual percent of total assets under management. The management fee accrues continuously and is automatically paid out with every deposit and redemption.",
    defaultRate: 2.0,
    hasRecipient: true,
    hasAllocation: false,
    hasMultipleRates: false
  },
  {
    id: "performance" as const,
    label: "Performance Fee",
    title: "Charge Performance Fee",
    description: "If enabled, measured based on the vault's performance. The performance fee is subject to a high-water mark.",
    defaultRate: 20.0,
    hasRecipient: true,
    hasAllocation: false,
    hasMultipleRates: false
  },
  {
    id: "entrance" as const,
    label: "Entrance Fee",
    title: "Charge Entrance Fee",
    description: "If enabled, entrance fees are charged with every new deposit.",
    defaultRate: 0.5,
    hasRecipient: false,
    hasAllocation: true,
    hasMultipleRates: false
  },
  {
    id: "exit" as const,
    label: "Exit Fee",
    title: "Charge Exit Fee",
    description: "If enabled, exit fees are charged with every redemption. This fee is set separately for in-kind redemptions or for specific asset redemptions.",
    defaultRate: 0.5,
    hasRecipient: false,
    hasAllocation: true,
    hasMultipleRates: true
  },
] as const;

export type FeeTypeId = typeof FEE_TYPES[number]['id'];

// Re-export policy types for convenience
export type {
  VaultPolicyConfiguration,
  PolicyTypeId,
  POLICY_TYPES,
  POLICY_CATEGORIES,
  EncodedPolicy,
  VaultPolicyData,
  PolicyValidationResult,
  PolicyRecommendation
} from './policies';