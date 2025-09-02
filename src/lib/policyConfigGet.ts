// src/lib/policyConfigGet.ts
import { type Deployment, getContract } from "@/lib/consts";
import { getPublicClientForDeployment } from "@/lib/rpc";
import { type VaultPolicyData, type VaultPolicyConfiguration, type PolicyTypeId } from "@/types/policies";
import { Configuration, Vault, Asset } from "@enzymefinance/sdk";
import { type Address, type Client, formatUnits } from "viem";

// Get policy contract addresses using the getContract function
// Only include contracts that actually exist in the Contracts type
const getPolicyContractAddresses = (deployment: Deployment) => {
  return {
    // Deposit Controls
    minMaxInvestmentPolicy: getContract(deployment, "MinMaxInvestmentPolicy"),
    allowedDepositRecipientsPolicy: getContract(deployment, "AllowedDepositRecipientsPolicy"),

    // Trading Controls
    cumulativeSlippageTolerancePolicy: getContract(deployment, "CumulativeSlippageTolerancePolicy"),
    allowedAdaptersPolicy: getContract(deployment, "AllowedAdaptersPolicy"),
    allowedAdapterIncomingAssetsPolicy: getContract(deployment, "AllowedAdapterIncomingAssetsPolicy"),
    allowedAdaptersPerManager: getContract(deployment, "AllowedAdaptersPerManager"),

    // External Position Controls
    allowedExternalPositionTypesPolicy: getContract(deployment, "AllowedExternalPositionTypesPolicy"),
    allowedExternalPositionTypesPerManagerPolicy: getContract(deployment, "AllowedExternalPositionTypesPerManagerPolicy"),

    // Redemption Controls
    allowedAssetsForRedemptionPolicy: getContract(deployment, "AllowedAssetsForRedemptionPolicy"),
    minAssetBalancesPostRedemptionPolicy: getContract(deployment, "MinAssetBalancesPostRedemptionPolicy"),

    // Share Transfer Controls
    allowedSharesTransferRecipientsPolicy: getContract(deployment, "AllowedSharesTransferRecipientsPolicy"),

    // Other Policies
    onlyRemoveDustExternalPositionPolicy: getContract(deployment, "OnlyRemoveDustExternalPositionPolicy"),
    onlyUntrackDustOrPricelessAssets: getContract(deployment, "OnlyUntrackDustOrPricelessAssets"),
  };
};

// Policy type mapping helper - maps contract address to policy type ID
// Only include contracts that actually exist in the Contracts type
const getPolicyTypeMapping = (deployment: Deployment) => {
  const addresses = getPolicyContractAddresses(deployment);
  return {
    // Deposit Controls
    [addresses.minMaxInvestmentPolicy]: 'minMaxInvestment' as const,
    [addresses.allowedDepositRecipientsPolicy]: 'allowedDepositRecipients' as const,

    // Trading Controls
    [addresses.cumulativeSlippageTolerancePolicy]: 'cumulativeSlippageTolerance' as const,
    [addresses.allowedAdaptersPolicy]: 'allowedAdapters' as const,
    [addresses.allowedAdapterIncomingAssetsPolicy]: 'allowedAdapterIncomingAssets' as const,
    [addresses.allowedAdaptersPerManager]: 'allowedAdaptersPerManager' as const,

    // External Position Controls
    [addresses.allowedExternalPositionTypesPolicy]: 'allowedExternalPositionTypes' as const,
    [addresses.allowedExternalPositionTypesPerManagerPolicy]: 'allowedExternalPositionTypesPerManager' as const,

    // Redemption Controls
    [addresses.allowedAssetsForRedemptionPolicy]: 'allowedAssetsForRedemption' as const,
    [addresses.minAssetBalancesPostRedemptionPolicy]: 'minAssetBalancesPostRedemption' as const,

    // Share Transfer Controls
    [addresses.allowedSharesTransferRecipientsPolicy]: 'allowedSharesTransferRecipients' as const,
  };
};

/**
 * Step 1: Get enabled policies for a vault
 */
export async function getEnabledPolicies(
  client: Client,
  comptrollerProxy: Address,
  policyManager: Address
): Promise<Address[]> {
  try {
    const enabledPolicies = await Configuration.getEnabledPolicies(client, {
      comptrollerProxy,
      policyManager,
    });

    console.log(`Found ${enabledPolicies.length} enabled policies:`, enabledPolicies);
    // Convert readonly array to mutable array
    return [...enabledPolicies];
  } catch (error) {
    console.error("Failed to get enabled policies:", error);
    return [];
  }
}

/**
 * Get min/max investment policy information - IMPLEMENTED
 */
async function getMinMaxInvestmentPolicyInfo(
  client: Client,
  comptrollerProxy: Address,
  policyAddress: Address
): Promise<any> {
  try {
    const settings = await Configuration.Policies.MinMaxInvestment.getSettings(client, {
      comptrollerProxy,
      minMaxInvestmentPolicy: policyAddress,
    });

    // Get denomination asset info using the same approach as OverviewTab
    let denominationAsset = null;
    let denominationSymbol = null;

    try {
      denominationAsset = await Vault.getDenominationAsset(client, { 
        comptrollerProxy 
      });
      
      if (denominationAsset) {
        denominationSymbol = await Asset.getSymbol(client, { asset: denominationAsset });
      }
    } catch (assetError) {
      console.warn("Failed to fetch denomination asset info:", assetError);
      // Use fallback values
      denominationSymbol = "tokens";
    }

    console.log("[MinMax Policy] Raw data:", {
      rawMin: settings.minInvestmentAmount.toString(),
      rawMax: settings.maxInvestmentAmount.toString(),
      denominationSymbol,
      denominationAsset
    });

    return {
      enabled: true,
      settings: {
        // Return raw bigint values - formatting will be done in frontend with useTokenDecimals
        minInvestmentAmount: settings.minInvestmentAmount.toString(),
        maxInvestmentAmount: settings.maxInvestmentAmount.toString(),
        assetSymbol: denominationSymbol,
        denominationAsset: denominationAsset,
      },
      policyAddress,
    };
  } catch (error) {
    console.error("Failed to get min/max investment policy info:", error);
    return {
      enabled: false,
    };
  }
}

/**
 * Get allowed deposit recipients policy information - IMPLEMENTED (enabled only)
 */
async function getAllowedDepositRecipientsPolicyInfo(
  client: Client,
  comptrollerProxy: Address,
  policyAddress: Address
): Promise<any> {
  try {
    // TODO: Implement real SDK call when available to get detailed settings
    // const settings = await Configuration.Policies.AllowedDepositRecipients.getSettings(client, {
    //   comptrollerProxy,
    //   policy: policyAddress,
    // });

    // For now, just return that it's enabled
    return {
      enabled: true,
      policyAddress,
    };
  } catch (error) {
    console.error("Failed to get allowed deposit recipients policy info:", error);
    return {
      enabled: false,
    };
  }
}

/**
 * Get allowed shares transfer recipients policy information - IMPLEMENTED (enabled only)
 */
async function getAllowedSharesTransferRecipientsPolicyInfo(
  client: Client,
  comptrollerProxy: Address,
  policyAddress: Address
): Promise<any> {
  try {
    // TODO: Implement real SDK call when available to get detailed settings
    // const settings = await Configuration.Policies.AllowedSharesTransferRecipients.getSettings(client, {
    //   comptrollerProxy,
    //   policy: policyAddress,
    // });

    // For now, just return that it's enabled
    return {
      enabled: true,
      policyAddress,
    };
  } catch (error) {
    console.error("Failed to get allowed shares transfer recipients policy info:", error);
    return {
      enabled: false,
    };
  }
}

/**
 * Get cumulative slippage tolerance policy information - PLACEHOLDER
 */
async function getCumulativeSlippagePolicyInfo(
  client: Client,
  comptrollerProxy: Address,
  policyAddress: Address
): Promise<any> {
  try {
    // TODO: Implement real SDK call
    return {
      enabled: true,
      policyAddress,
    };
  } catch (error) {
    console.error("Failed to get cumulative slippage policy info:", error);
    return {
      enabled: false,
    };
  }
}

/**
 * Get allowed adapters policy information - PLACEHOLDER
 */
async function getAllowedAdaptersPolicyInfo(
  client: Client,
  comptrollerProxy: Address,
  policyAddress: Address
): Promise<any> {
  try {
    // TODO: Implement real SDK call
    return {
      enabled: true,
      policyAddress,
    };
  } catch (error) {
    console.error("Failed to get allowed adapters policy info:", error);
    return {
      enabled: false,
    };
  }
}

/**
 * Get allowed adapter incoming assets policy information - PLACEHOLDER
 */
async function getAllowedAdapterIncomingAssetsPolicyInfo(
  client: Client,
  comptrollerProxy: Address,
  policyAddress: Address
): Promise<any> {
  try {
    // TODO: Implement real SDK call
    return {
      enabled: true,
      policyAddress,
    };
  } catch (error) {
    console.error("Failed to get allowed adapter incoming assets policy info:", error);
    return {
      enabled: false,
    };
  }
}

/**
 * Get allowed adapters per manager policy information - PLACEHOLDER
 */
async function getAllowedAdaptersPerManagerPolicyInfo(
  client: Client,
  comptrollerProxy: Address,
  policyAddress: Address
): Promise<any> {
  try {
    // TODO: Implement real SDK call
    return {
      enabled: true,
      policyAddress,
    };
  } catch (error) {
    console.error("Failed to get allowed adapters per manager policy info:", error);
    return {
      enabled: false,
    };
  }
}

/**
 * Get allowed external position types policy information - PLACEHOLDER
 */
async function getAllowedExternalPositionTypesPolicyInfo(
  client: Client,
  comptrollerProxy: Address,
  policyAddress: Address
): Promise<any> {
  try {
    // TODO: Implement real SDK call
    return {
      enabled: true,
      policyAddress,
    };
  } catch (error) {
    console.error("Failed to get allowed external position types policy info:", error);
    return {
      enabled: false,
    };
  }
}

/**
 * Get allowed external position types per manager policy information - PLACEHOLDER
 */
async function getAllowedExternalPositionTypesPerManagerPolicyInfo(
  client: Client,
  comptrollerProxy: Address,
  policyAddress: Address
): Promise<any> {
  try {
    // TODO: Implement real SDK call
    return {
      enabled: true,
      policyAddress,
    };
  } catch (error) {
    console.error("Failed to get allowed external position types per manager policy info:", error);
    return {
      enabled: false,
    };
  }
}

/**
 * Get allowed assets for redemption policy information - PLACEHOLDER
 */
async function getAllowedAssetsForRedemptionPolicyInfo(
  client: Client,
  comptrollerProxy: Address,
  policyAddress: Address
): Promise<any> {
  try {
    // TODO: Implement real SDK call
    return {
      enabled: true,
      policyAddress,
    };
  } catch (error) {
    console.error("Failed to get allowed assets for redemption policy info:", error);
    return {
      enabled: false,
    };
  }
}

/**
 * Get min asset balances post redemption policy information - PLACEHOLDER
 */
async function getMinAssetBalancesPostRedemptionPolicyInfo(
  client: Client,
  comptrollerProxy: Address,
  policyAddress: Address
): Promise<any> {
  try {
    // TODO: Implement real SDK call
    return {
      enabled: true,
      policyAddress,
    };
  } catch (error) {
    console.error("Failed to get min asset balances post redemption policy info:", error);
    return {
      enabled: false,
    };
  }
}

/**
 * Step 2: Process enabled policies and get detailed information
 */
export async function processPolicyDetails(
  client: Client,
  comptrollerProxy: Address,
  enabledPolicies: Address[],
  deployment: Deployment
): Promise<VaultPolicyConfiguration> {
  const policyTypeMap = getPolicyTypeMapping(deployment);

  // Initialize all policies as disabled
  const policies: VaultPolicyConfiguration = {
    minMaxInvestment: { enabled: false },
    allowedDepositRecipients: { enabled: false },
    cumulativeSlippageTolerance: { enabled: false },
    allowedAdapters: { enabled: false },
    allowedAdapterIncomingAssets: { enabled: false },
    disallowedAdapterIncomingAssets: { enabled: false },
    allowedAdaptersPerManager: { enabled: false },
    allowedExternalPositionTypes: { enabled: false },
    allowedExternalPositionTypesPerManager: { enabled: false },
    allowedAssetsForRedemption: { enabled: false },
    allowedRedeemersForSpecificAssets: { enabled: false },
    minAssetBalancesPostRedemption: { enabled: false },
    noDepegOnRedeemSharesForSpecificAssets: { enabled: false },
    allowedSharesTransferRecipients: { enabled: false },
  };

  console.log("🔄 Processing each enabled policy...");

  // Process each enabled policy
  for (const policyAddress of enabledPolicies) {
    console.log(`\n🔍 Processing policy address: ${policyAddress}`);

    const policyType = policyTypeMap[policyAddress];
    console.log(`📝 Policy type for ${policyAddress}:`, policyType);

    if (!policyType) {
      console.log(`❌ Unknown policy type for address: ${policyAddress}`);
      continue;
    }

    try {
      console.log(`⚙️ Processing ${policyType} policy...`);

      switch (policyType) {
        // IMPLEMENTED POLICIES
        case 'minMaxInvestment':
          const minMaxData = await getMinMaxInvestmentPolicyInfo(client, comptrollerProxy, policyAddress);
          policies.minMaxInvestment = minMaxData;
          break;

        case 'allowedDepositRecipients':
          const depositRecipientsData = await getAllowedDepositRecipientsPolicyInfo(client, comptrollerProxy, policyAddress);
          policies.allowedDepositRecipients = depositRecipientsData;
          break;

        case 'allowedSharesTransferRecipients':
          const sharesTransferData = await getAllowedSharesTransferRecipientsPolicyInfo(client, comptrollerProxy, policyAddress);
          policies.allowedSharesTransferRecipients = sharesTransferData;
          break;

        // PLACEHOLDER POLICIES (empty implementations)
        case 'cumulativeSlippageTolerance':
          const slippageData = await getCumulativeSlippagePolicyInfo(client, comptrollerProxy, policyAddress);
          policies.cumulativeSlippageTolerance = slippageData;
          break;

        case 'allowedAdapters':
          const adaptersData = await getAllowedAdaptersPolicyInfo(client, comptrollerProxy, policyAddress);
          policies.allowedAdapters = adaptersData;
          break;

        case 'allowedAdapterIncomingAssets':
          const adapterIncomingData = await getAllowedAdapterIncomingAssetsPolicyInfo(client, comptrollerProxy, policyAddress);
          policies.allowedAdapterIncomingAssets = adapterIncomingData;
          break;

        case 'allowedAdaptersPerManager':
          const adaptersPerManagerData = await getAllowedAdaptersPerManagerPolicyInfo(client, comptrollerProxy, policyAddress);
          policies.allowedAdaptersPerManager = adaptersPerManagerData;
          break;

        case 'allowedExternalPositionTypes':
          const externalPositionTypesData = await getAllowedExternalPositionTypesPolicyInfo(client, comptrollerProxy, policyAddress);
          policies.allowedExternalPositionTypes = externalPositionTypesData;
          break;

        case 'allowedExternalPositionTypesPerManager':
          const externalPositionTypesPerManagerData = await getAllowedExternalPositionTypesPerManagerPolicyInfo(client, comptrollerProxy, policyAddress);
          policies.allowedExternalPositionTypesPerManager = externalPositionTypesPerManagerData;
          break;

        case 'allowedAssetsForRedemption':
          const assetsForRedemptionData = await getAllowedAssetsForRedemptionPolicyInfo(client, comptrollerProxy, policyAddress);
          policies.allowedAssetsForRedemption = assetsForRedemptionData;
          break;

        case 'minAssetBalancesPostRedemption':
          const minAssetBalancesData = await getMinAssetBalancesPostRedemptionPolicyInfo(client, comptrollerProxy, policyAddress);
          policies.minAssetBalancesPostRedemption = minAssetBalancesData;
          break;

        // Note: Some policies from types don't have contracts available:
        // - allowedRedeemersForSpecificAssets
        // - noDepegOnRedeemSharesForSpecificAssets
        // - disallowedAdapterIncomingAssets
        // These will remain disabled until contracts are added to consts.ts

        default:
          console.log(`❌ Unhandled policy type: ${policyType}`);
          // Mark as enabled but without settings for now
          (policies as any)[policyType] = { enabled: true, policyAddress };
      }
    } catch (error) {
      console.error(`❌ Failed to get info for ${policyType} policy:`, error);
    }
  }

  console.log("🎯 Final processed policies:", policies);
  return policies;
}

/**
 * Main function: Get complete policy information for a vault
 */
export async function getVaultPolicyInformation(
  vaultAddress: Address,
  deployment: Deployment
): Promise<VaultPolicyData> {
  const client = getPublicClientForDeployment(deployment);

  console.log("[DEBUG] Starting getVaultPolicyInformation");
  console.log("Vault Address:", vaultAddress);
  console.log("Deployment:", deployment);

  try {
    const comptrollerProxy = await Vault.getComptrollerProxy(client, {
      vaultProxy: vaultAddress,
    });
    console.log("Comptroller Proxy:", comptrollerProxy);

    console.log("📡 Fetching policy manager...");
    const policyManager = await Vault.getPolicyManager(client, {
      comptrollerProxy,
    });
    console.log("Policy Manager:", policyManager);

    const enabledPolicies = await getEnabledPolicies(client, comptrollerProxy, policyManager);
    console.log("Enabled Policies:", enabledPolicies);

    const policies = await processPolicyDetails(client, comptrollerProxy, enabledPolicies, deployment);

    const result = {
      enabledPolicies,
      policies,
      totalEnabledCount: enabledPolicies.length,
      lastUpdated: Date.now(),
    };

    console.log("🎉 Final Result:", result);
    return result;

  } catch (error) {
    console.error("❌ Failed to get vault policy information:", error);

    // Return empty structure on error
    return {
      enabledPolicies: [],
      policies: {
        minMaxInvestment: { enabled: false },
        allowedDepositRecipients: { enabled: false },
        cumulativeSlippageTolerance: { enabled: false },
        allowedAdapters: { enabled: false },
        allowedAdapterIncomingAssets: { enabled: false },
        disallowedAdapterIncomingAssets: { enabled: false },
        allowedAdaptersPerManager: { enabled: false },
        allowedExternalPositionTypes: { enabled: false },
        allowedExternalPositionTypesPerManager: { enabled: false },
        allowedAssetsForRedemption: { enabled: false },
        allowedRedeemersForSpecificAssets: { enabled: false },
        minAssetBalancesPostRedemption: { enabled: false },
        noDepegOnRedeemSharesForSpecificAssets: { enabled: false },
        allowedSharesTransferRecipients: { enabled: false },
      },
      totalEnabledCount: 0,
      lastUpdated: Date.now(),
    };
  }
}

/**
 * Get policy contract addresses for debugging/display
 */
export function getPolicyContractInfo(deployment: Deployment): {
  addresses: ReturnType<typeof getPolicyContractAddresses>;
  mapping: Record<Address, string>;
} {
  const addresses = getPolicyContractAddresses(deployment);
  const mapping: Record<Address, string> = {
    // Deposit Controls
    [addresses.minMaxInvestmentPolicy]: 'Min/Max Investment Policy',
    [addresses.allowedDepositRecipientsPolicy]: 'Allowed Deposit Recipients Policy',

    // Trading Controls
    [addresses.cumulativeSlippageTolerancePolicy]: 'Cumulative Slippage Tolerance Policy',
    [addresses.allowedAdaptersPolicy]: 'Allowed Adapters Policy',
    [addresses.allowedAdapterIncomingAssetsPolicy]: 'Allowed Adapter Incoming Assets Policy',
    [addresses.allowedAdaptersPerManager]: 'Allowed Adapters Per Manager Policy',

    // External Position Controls
    [addresses.allowedExternalPositionTypesPolicy]: 'Allowed External Position Types Policy',
    [addresses.allowedExternalPositionTypesPerManagerPolicy]: 'Allowed External Position Types Per Manager Policy',

    // Redemption Controls
    [addresses.allowedAssetsForRedemptionPolicy]: 'Allowed Assets For Redemption Policy',
    [addresses.minAssetBalancesPostRedemptionPolicy]: 'Min Asset Balances Post Redemption Policy',

    // Share Transfer Controls
    [addresses.allowedSharesTransferRecipientsPolicy]: 'Allowed Shares Transfer Recipients Policy',

    // Other Policies
    [addresses.onlyRemoveDustExternalPositionPolicy]: 'Only Remove Dust External Position Policy',
    [addresses.onlyUntrackDustOrPricelessAssets]: 'Only Untrack Dust Or Priceless Assets Policy',
  };

  return { addresses, mapping };
}
