// Complete Policy type definitions based on Enzyme SDK patterns
import { type Address } from "viem"

// Base policy interface - similar to SDK pattern
export interface BasePolicyDetail {
  enabled: boolean;
}

// Common settings interfaces for different policy patterns

// 1. AddressListRegistry pattern (used by many policies)
export interface AddressListRegistrySettings {
  existingListIds: string[]; // bigint[] in SDK, but we use string[] in forms
  newListsArgs: Array<{
    updateType: string; // bigint in SDK
    initialItems: Address[];
  }>;
}

// 2. AddressListRegistryPerUser pattern
export interface AddressListRegistryPerUserSettings {
  users: Address[];
  listsData: AddressListRegistrySettings[];
}

// 3. AssetConfig pattern for depeg protection
export interface AssetConfigSettings {
  assetConfigs: Array<{
    asset: Address;
    referenceAsset: Address;
    deviationToleranceInBps: string; // number in SDK, string in forms
  }>;
}

// Specific policy settings interfaces

// 1. MinMaxInvestment Policy
export interface MinMaxInvestmentSettings {
  minInvestmentAmount: string; // Form stores as string, converts to bigint for encoding
  maxInvestmentAmount: string;
}

export interface MinMaxInvestmentPolicy extends BasePolicyDetail {
  settings?: MinMaxInvestmentSettings;
}

// 2. AllowedDepositRecipients Policy (Address List Registry)
export interface AllowedDepositRecipientsPolicy extends BasePolicyDetail {
  settings?: AddressListRegistrySettings;
}

// 3. CumulativeSlippageTolerance Policy  
export interface CumulativeSlippageToleranceSettings {
  slippageTolerance: string; // bigint in SDK, string in forms (basis points)
}

export interface CumulativeSlippageTolerancePolicy extends BasePolicyDetail {
  settings?: CumulativeSlippageToleranceSettings;
}

// 4. AllowedAdapters Policy (Address List Registry)
export interface AllowedAdaptersPolicy extends BasePolicyDetail {
  settings?: AddressListRegistrySettings;
}

// 5. AllowedAdapterIncomingAssets Policy (Address List Registry)
export interface AllowedAdapterIncomingAssetsPolicy extends BasePolicyDetail {
  settings?: AddressListRegistrySettings;
}

// 6. DisallowedAdapterIncomingAssets Policy (Address List Registry)
export interface DisallowedAdapterIncomingAssetsPolicy extends BasePolicyDetail {
  settings?: AddressListRegistrySettings;
}

// 7. AllowedAdaptersPerManager Policy (Address List Registry Per User)
export interface AllowedAdaptersPerManagerPolicy extends BasePolicyDetail {
  settings?: AddressListRegistryPerUserSettings;
}

// 8. AllowedAssetsForRedemption Policy (Address List Registry)
export interface AllowedAssetsForRedemptionPolicy extends BasePolicyDetail {
  settings?: AddressListRegistrySettings;
}

// 9. AllowedSharesTransferRecipients Policy (Address List Registry)
export interface AllowedSharesTransferRecipientsPolicy extends BasePolicyDetail {
  settings?: AddressListRegistrySettings;
}

// 10. AllowedRedeemersForSpecificAssets Policy (Address List Registry)
export interface AllowedRedeemersForSpecificAssetsPolicy extends BasePolicyDetail {
  settings?: AddressListRegistrySettings;
}

// 11. AllowedExternalPositionTypes Policy
export interface AllowedExternalPositionTypesSettings {
  externalPositionTypeIds: string[]; // bigint[] in SDK, string[] in forms
}

export interface AllowedExternalPositionTypesPolicy extends BasePolicyDetail {
  settings?: AllowedExternalPositionTypesSettings;
}

// 12. AllowedExternalPositionTypesPerManager Policy (Address List Registry Per User)
export interface AllowedExternalPositionTypesPerManagerPolicy extends BasePolicyDetail {
  settings?: AddressListRegistryPerUserSettings;
}

// 13. MinAssetBalancesPostRedemption Policy
export interface MinAssetBalancesPostRedemptionSettings {
  assetToMinBalance: Array<{
    asset: Address;
    minBalance: string; // bigint in SDK, string in forms
  }>;
}

export interface MinAssetBalancesPostRedemptionPolicy extends BasePolicyDetail {
  settings?: MinAssetBalancesPostRedemptionSettings;
}

// 14. NoDepegOnRedeemSharesForSpecificAssets Policy
export interface NoDepegOnRedeemSharesForSpecificAssetsPolicy extends BasePolicyDetail {
  settings?: AssetConfigSettings;
}

// Master policy configuration interface - COMPLETE VERSION
export interface VaultPolicyConfiguration {
  // Investment/Deposit Controls
  minMaxInvestment: MinMaxInvestmentPolicy;
  allowedDepositRecipients: AllowedDepositRecipientsPolicy;

  // Trading/Adapter Controls
  cumulativeSlippageTolerance: CumulativeSlippageTolerancePolicy;
  allowedAdapters: AllowedAdaptersPolicy;
  allowedAdapterIncomingAssets: AllowedAdapterIncomingAssetsPolicy;
  disallowedAdapterIncomingAssets: DisallowedAdapterIncomingAssetsPolicy;
  allowedAdaptersPerManager: AllowedAdaptersPerManagerPolicy;

  // External Position Controls
  allowedExternalPositionTypes: AllowedExternalPositionTypesPolicy;
  allowedExternalPositionTypesPerManager: AllowedExternalPositionTypesPerManagerPolicy;

  // Redemption Controls
  allowedAssetsForRedemption: AllowedAssetsForRedemptionPolicy;
  allowedRedeemersForSpecificAssets: AllowedRedeemersForSpecificAssetsPolicy;
  minAssetBalancesPostRedemption: MinAssetBalancesPostRedemptionPolicy;
  noDepegOnRedeemSharesForSpecificAssets: NoDepegOnRedeemSharesForSpecificAssetsPolicy;

  // Share Transfer Controls
  allowedSharesTransferRecipients: AllowedSharesTransferRecipientsPolicy;
}

// Complete policy type definitions for configuration
export const POLICY_TYPES = [
  // Investment/Deposit Controls
  {
    id: "minMaxInvestment" as const,
    label: "Min/Max Investment",
    title: "Set Investment Limits",
    category: "deposits",
    description: "Set minimum and maximum deposit amounts per transaction to control fund accessibility.",
    hasAddressList: false,
    hasAmountLimits: true,
    hasTimeRestrictions: false,
    isRecommended: true,
    settingsType: "minMax" as const,
  },
  {
    id: "allowedDepositRecipients" as const,
    label: "Allowed Deposit Recipients",
    title: "Restrict Who Can Deposit",
    category: "deposits",
    description: "Limit deposits to a specific list of addresses. Useful for private funds or KYC-compliant vaults.",
    hasAddressList: true,
    hasAmountLimits: false,
    hasTimeRestrictions: false,
    isRecommended: false,
    settingsType: "addressList" as const,
  },

  // Trading/Adapter Controls
  {
    id: "cumulativeSlippageTolerance" as const,
    label: "Slippage Tolerance",
    title: "Control Trading Slippage",
    category: "trading",
    description: "Limit the cumulative slippage tolerance for trades to protect against MEV and sandwich attacks.",
    hasAddressList: false,
    hasAmountLimits: true,
    hasTimeRestrictions: true,
    isRecommended: true,
    settingsType: "slippage" as const,
  },
  {
    id: "allowedAdapters" as const,
    label: "Allowed Adapters",
    title: "Restrict Trading Protocols",
    category: "trading",
    description: "Limit which DeFi protocols (adapters) the fund manager can use for trading and investing.",
    hasAddressList: true,
    hasAmountLimits: false,
    hasTimeRestrictions: false,
    isRecommended: false,
    settingsType: "addressList" as const,
  },
  {
    id: "allowedAdapterIncomingAssets" as const,
    label: "Allowed Adapter Incoming Assets",
    title: "Control Which Assets Can Be Received",
    category: "trading",
    description: "Restrict which assets can be received through adapter interactions (trading protocols).",
    hasAddressList: true,
    hasAmountLimits: false,
    hasTimeRestrictions: false,
    isRecommended: false,
    settingsType: "addressList" as const,
  },
  {
    id: "disallowedAdapterIncomingAssets" as const,
    label: "Disallowed Adapter Incoming Assets",
    title: "Block Specific Assets",
    category: "trading",
    description: "Explicitly block specific assets from being received through adapter interactions.",
    hasAddressList: true,
    hasAmountLimits: false,
    hasTimeRestrictions: false,
    isRecommended: false,
    settingsType: "addressList" as const,
  },
  {
    id: "allowedAdaptersPerManager" as const,
    label: "Allowed Adapters Per Manager",
    title: "Manager-Specific Adapter Access",
    category: "trading",
    description: "Set different allowed adapters for different managers in multi-manager setups.",
    hasAddressList: true,
    hasAmountLimits: false,
    hasTimeRestrictions: false,
    isRecommended: false,
    settingsType: "addressListPerUser" as const,
  },

  // External Position Controls
  {
    id: "allowedExternalPositionTypes" as const,
    label: "Allowed External Position Types",
    title: "Control External Positions",
    category: "trading",
    description: "Restrict which types of external positions (e.g., Uniswap LP, Compound lending) can be created.",
    hasAddressList: false,
    hasAmountLimits: false,
    hasTimeRestrictions: false,
    isRecommended: false,
    settingsType: "externalPositionTypes" as const,
  },
  {
    id: "allowedExternalPositionTypesPerManager" as const,
    label: "External Position Types Per Manager",
    title: "Manager-Specific External Positions",
    category: "trading",
    description: "Set different allowed external position types for different managers.",
    hasAddressList: true,
    hasAmountLimits: false,
    hasTimeRestrictions: false,
    isRecommended: false,
    settingsType: "addressListPerUser" as const,
  },

  // Redemption Controls
  {
    id: "allowedAssetsForRedemption" as const,
    label: "Allowed Redemption Assets",
    title: "Control Redemption Assets",
    category: "redemptions",
    description: "Specify which assets investors can redeem in. Default allows redemption in any vault asset.",
    hasAddressList: true,
    hasAmountLimits: false,
    hasTimeRestrictions: false,
    isRecommended: false,
    settingsType: "addressList" as const,
  },
  {
    id: "allowedRedeemersForSpecificAssets" as const,
    label: "Allowed Redeemers For Specific Assets",
    title: "Restrict Asset-Specific Redemptions",
    category: "redemptions",
    description: "Control which addresses can redeem specific assets from the vault.",
    hasAddressList: true,
    hasAmountLimits: false,
    hasTimeRestrictions: false,
    isRecommended: false,
    settingsType: "addressList" as const,
  },
  {
    id: "minAssetBalancesPostRedemption" as const,
    label: "Min Asset Balances",
    title: "Maintain Minimum Balances",
    category: "redemptions",
    description: "Prevent redemptions that would leave the vault with insufficient balances of specific assets.",
    hasAddressList: false,
    hasAmountLimits: true,
    hasTimeRestrictions: false,
    isRecommended: false,
    settingsType: "assetBalances" as const,
  },
  {
    id: "noDepegOnRedeemSharesForSpecificAssets" as const,
    label: "No Depeg Protection",
    title: "Prevent Depegged Asset Redemptions",
    category: "redemptions",
    description: "Prevent redemptions when specific assets have depegged from their reference assets.",
    hasAddressList: false,
    hasAmountLimits: true,
    hasTimeRestrictions: false,
    isRecommended: false,
    settingsType: "assetConfig" as const,
  },

  // Share Transfer Controls
  {
    id: "allowedSharesTransferRecipients" as const,
    label: "Share Transfer Recipients",
    title: "Control Share Transfers",
    category: "shares",
    description: "Restrict who can receive vault shares through transfers (not direct deposits).",
    hasAddressList: true,
    hasAmountLimits: false,
    hasTimeRestrictions: false,
    isRecommended: false,
    settingsType: "addressList" as const,
  },
] as const;

export type PolicyTypeId = typeof POLICY_TYPES[number]['id'];
export type PolicyCategory = typeof POLICY_TYPES[number]['category'];
export type PolicySettingsType = typeof POLICY_TYPES[number]['settingsType'];

// Policy categories for UI organization (updated)
export const POLICY_CATEGORIES = [
  {
    id: "deposits" as const,
    label: "Deposit Controls",
    description: "Control who can deposit and how much",
    icon: "ArrowDownToLine",
  },
  {
    id: "shares" as const,
    label: "Share Management",
    description: "Control share transfers and ownership",
    icon: "Share2",
  },
  {
    id: "trading" as const,
    label: "Trading & Investment",
    description: "Manage trading permissions and risk controls",
    icon: "TrendingUp",
  },
  {
    id: "redemptions" as const,
    label: "Redemption Controls",
    description: "Set rules for how investors can exit",
    icon: "ArrowUpFromLine",
  },
] as const;

// Policy encoding result (for vault creation)
export interface EncodedPolicy {
  address: Address;
  settings: `0x${string}`; // Hex encoded settings
}

// Policy display/decoding interfaces (for vault display)
export interface DecodedPolicyDetail extends BasePolicyDetail {
  policyAddress?: Address;
  policyType?: PolicyTypeId;
  lastUpdated?: number;
}

export interface VaultPolicyData {
  enabledPolicies: Address[];
  policies: VaultPolicyConfiguration;
  totalEnabledCount: number;
  lastUpdated: number;
}

// Utility types for policy validation
export interface PolicyValidationResult {
  isValid: boolean;
  errors: Partial<Record<PolicyTypeId, string[]>>;
  warnings: Partial<Record<PolicyTypeId, string[]>>;
}

export interface PolicyRecommendation {
  policyId: PolicyTypeId;
  reason: string;
  priority: 'low' | 'medium' | 'high';
  category: PolicyCategory;
}

// Helper type for getting policy settings by ID (COMPLETE VERSION)
export type PolicySettingsById<T extends PolicyTypeId> =
  T extends "minMaxInvestment" ? MinMaxInvestmentSettings :
  T extends "allowedDepositRecipients" ? AddressListRegistrySettings :
  T extends "cumulativeSlippageTolerance" ? CumulativeSlippageToleranceSettings :
  T extends "allowedAdapters" ? AddressListRegistrySettings :
  T extends "allowedAdapterIncomingAssets" ? AddressListRegistrySettings :
  T extends "disallowedAdapterIncomingAssets" ? AddressListRegistrySettings :
  T extends "allowedAdaptersPerManager" ? AddressListRegistryPerUserSettings :
  T extends "allowedExternalPositionTypes" ? AllowedExternalPositionTypesSettings :
  T extends "allowedExternalPositionTypesPerManager" ? AddressListRegistryPerUserSettings :
  T extends "allowedAssetsForRedemption" ? AddressListRegistrySettings :
  T extends "allowedRedeemersForSpecificAssets" ? AddressListRegistrySettings :
  T extends "minAssetBalancesPostRedemption" ? MinAssetBalancesPostRedemptionSettings :
  T extends "noDepegOnRedeemSharesForSpecificAssets" ? AssetConfigSettings :
  T extends "allowedSharesTransferRecipients" ? AddressListRegistrySettings :
  never;

// Type-safe policy accessor (COMPLETE VERSION)
export type PolicyByIdType<T extends PolicyTypeId> =
  T extends "minMaxInvestment" ? MinMaxInvestmentPolicy :
  T extends "allowedDepositRecipients" ? AllowedDepositRecipientsPolicy :
  T extends "cumulativeSlippageTolerance" ? CumulativeSlippageTolerancePolicy :
  T extends "allowedAdapters" ? AllowedAdaptersPolicy :
  T extends "allowedAdapterIncomingAssets" ? AllowedAdapterIncomingAssetsPolicy :
  T extends "disallowedAdapterIncomingAssets" ? DisallowedAdapterIncomingAssetsPolicy :
  T extends "allowedAdaptersPerManager" ? AllowedAdaptersPerManagerPolicy :
  T extends "allowedExternalPositionTypes" ? AllowedExternalPositionTypesPolicy :
  T extends "allowedExternalPositionTypesPerManager" ? AllowedExternalPositionTypesPerManagerPolicy :
  T extends "allowedAssetsForRedemption" ? AllowedAssetsForRedemptionPolicy :
  T extends "allowedRedeemersForSpecificAssets" ? AllowedRedeemersForSpecificAssetsPolicy :
  T extends "minAssetBalancesPostRedemption" ? MinAssetBalancesPostRedemptionPolicy :
  T extends "noDepegOnRedeemSharesForSpecificAssets" ? NoDepegOnRedeemSharesForSpecificAssetsPolicy :
  T extends "allowedSharesTransferRecipients" ? AllowedSharesTransferRecipientsPolicy :
  never;