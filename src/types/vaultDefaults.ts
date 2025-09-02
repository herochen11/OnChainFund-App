import { type CreateVaultFormData } from './vault';
import { type VaultPolicyConfiguration } from './policies';

// Default fee configuration values
export const defaultFeeValues = {
  management: { enabled: false, rate: "", recipient: undefined },
  performance: { enabled: false, rate: "", recipient: undefined },
  entrance: { enabled: false, rate: "", allocation: "vault", recipient: undefined },
  exit: { enabled: false, inKindRate: "", specificAssetRate: "", allocation: "vault", recipient: undefined },
} as const;

// Default policy configuration values (all policies disabled by default)
export const defaultPolicyValues: VaultPolicyConfiguration = {
  // Investment/Deposit Controls
  minMaxInvestment: { enabled: false },
  allowedDepositRecipients: { enabled: false },

  // Trading/Adapter Controls
  cumulativeSlippageTolerance: { enabled: false },
  allowedAdapters: { enabled: false },
  allowedAdapterIncomingAssets: { enabled: false },
  disallowedAdapterIncomingAssets: { enabled: false },
  allowedAdaptersPerManager: { enabled: false },

  // External Position Controls
  allowedExternalPositionTypes: { enabled: false },
  allowedExternalPositionTypesPerManager: { enabled: false },

  // Redemption Controls
  allowedAssetsForRedemption: { enabled: false },
  allowedRedeemersForSpecificAssets: { enabled: false },
  minAssetBalancesPostRedemption: { enabled: false },
  noDepegOnRedeemSharesForSpecificAssets: { enabled: false },

  // Share Transfer Controls
  allowedSharesTransferRecipients: { enabled: false },
} as const;

// Complete default form data
export const defaultVaultFormData: CreateVaultFormData = {
  // Basic information
  vaultName: "",
  vaultSymbol: "",
  denominationAsset: "",

  // Shares lock-up period (required)
  sharesLockUpPeriod: {
    value: "24",
    unit: "hours",
  },

  // Fee configuration
  fees: defaultFeeValues,

  // Policy configuration
  policies: defaultPolicyValues,
} as const;

// Helper function to get clean default values (useful for reset)
export const getCleanDefaultValues = (): CreateVaultFormData => ({
  // Basic information
  vaultName: "",
  vaultSymbol: "",
  denominationAsset: "",

  // Shares lock-up period (required)
  sharesLockUpPeriod: {
    value: "24",
    unit: "hours",
  },

  // Fee configuration - deep clone to avoid reference issues
  fees: {
    management: { enabled: false, rate: "", recipient: undefined },
    performance: { enabled: false, rate: "", recipient: undefined },
    entrance: { enabled: false, rate: "", allocation: "vault", recipient: undefined },
    exit: { enabled: false, inKindRate: "", specificAssetRate: "", allocation: "vault", recipient: undefined },
  },

  // Policy configuration - deep clone to avoid reference issues
  policies: {
    // Investment/Deposit Controls
    minMaxInvestment: { enabled: false },
    allowedDepositRecipients: { enabled: false },

    // Trading/Adapter Controls
    cumulativeSlippageTolerance: { enabled: false },
    allowedAdapters: { enabled: false },
    allowedAdapterIncomingAssets: { enabled: false },
    disallowedAdapterIncomingAssets: { enabled: false },
    allowedAdaptersPerManager: { enabled: false },

    // External Position Controls
    allowedExternalPositionTypes: { enabled: false },
    allowedExternalPositionTypesPerManager: { enabled: false },

    // Redemption Controls
    allowedAssetsForRedemption: { enabled: false },
    allowedRedeemersForSpecificAssets: { enabled: false },
    minAssetBalancesPostRedemption: { enabled: false },
    noDepegOnRedeemSharesForSpecificAssets: { enabled: false },

    // Share Transfer Controls
    allowedSharesTransferRecipients: { enabled: false },
  },
});

// Default values for specific policy types (useful for when policies are enabled)
export const defaultPolicySettings = {
  minMaxInvestment: {
    minInvestmentAmount: "100",
    maxInvestmentAmount: "1000000",
  },
  allowedDepositRecipients: {
    existingListIds: [],
    newListsArgs: [{
      updateType: "0", // AddOnly
      initialItems: [],
    }],
  },
  cumulativeSlippageTolerance: {
    slippageTolerance: "500", // 5% in basis points
  },
  allowedAdapters: {
    existingListIds: [],
    newListsArgs: [{
      updateType: "0", // AddOnly
      initialItems: [],
    }],
  },
  allowedAdapterIncomingAssets: {
    existingListIds: [],
    newListsArgs: [{
      updateType: "0", // AddOnly
      initialItems: [],
    }],
  },
  disallowedAdapterIncomingAssets: {
    existingListIds: [],
    newListsArgs: [{
      updateType: "0", // AddOnly
      initialItems: [],
    }],
  },
  allowedAdaptersPerManager: {
    users: [],
    listsData: [],
  },
  allowedExternalPositionTypes: {
    externalPositionTypeIds: [],
  },
  allowedExternalPositionTypesPerManager: {
    users: [],
    listsData: [],
  },
  allowedAssetsForRedemption: {
    existingListIds: [],
    newListsArgs: [{
      updateType: "0", // AddOnly
      initialItems: [],
    }],
  },
  allowedRedeemersForSpecificAssets: {
    existingListIds: [],
    newListsArgs: [{
      updateType: "0", // AddOnly
      initialItems: [],
    }],
  },
  minAssetBalancesPostRedemption: {
    assetToMinBalance: [],
  },
  noDepegOnRedeemSharesForSpecificAssets: {
    assetConfigs: [],
  },
  allowedSharesTransferRecipients: {
    existingListIds: [],
    newListsArgs: [{
      updateType: "0", // AddOnly
      initialItems: [],
    }],
  },
} as const;