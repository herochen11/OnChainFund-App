import { getContract, type Deployment } from "@/lib/consts";
import { type SelectOption } from "@/components/ui/select";

/**
 * Asset configuration for all supported tokens
 */
const SUPPORTED_ASSETS = [
  {
    key: "Usdc" as const,
    label: "USDC - USD Coin",
    symbol: "USDC"
  },
  {
    key: "WETH" as const,
    label: "WETH - Wrapped Ether",
    symbol: "WETH"
  },
  {
    key: "WBTC" as const,
    label: "WBTC - Wrapped Bitcoin",
    symbol: "WBTC"
  },
  {
    key: "DAI" as const,
    label: "DAI - Dai Stablecoin",
    symbol: "DAI"
  },
  {
    key: "ASVT" as const,
    label: "ASVT - Asset Vault Token for Sepolia Testnet (RON)",
    symbol: "ASVT"
  }
] as const;

/**
 * Generate asset options dynamically based on deployment
 * Uses getContract for all assets across all deployments
 */
export function getAssetOptions(deployment: Deployment): SelectOption[] {
  try {
    const options: SelectOption[] = [];

    // Get all supported assets using getContract
    SUPPORTED_ASSETS.forEach(asset => {
      try {
        const address = getContract(deployment, asset.key);
        options.push({
          value: address,
          label: asset.label
        });
      } catch (error) {
        console.warn(`Asset ${asset.key} not found in ${deployment} deployment:`, error);
      }
    });

    return options;
  } catch (error) {
    console.error("Error generating asset options:", error);
    return [];
  }
}

/**
 * Get the display name for an asset by its address
 */
export function getAssetDisplayName(address: string, deployment: Deployment): string {
  const options = getAssetOptions(deployment);
  return options.find(option => option.value.toLowerCase() === address.toLowerCase())?.label || "Unknown Asset";
}

/**
 * Get deployment display name
 */
export function getDeploymentDisplayName(deployment: Deployment): string {
  switch (deployment) {
    case "ethereum":
      return "Ethereum Mainnet";
    case "polygon":
      return "Polygon Mainnet";
    case "testnet":
      return "Sepolia Testnet";
    default:
      return deployment.charAt(0).toUpperCase() + deployment.slice(1);
  }
}

/**
 * Get asset symbol by address
 */
export function getAssetSymbol(address: string, deployment: Deployment): string {
  // Find the asset by comparing addresses
  for (const asset of SUPPORTED_ASSETS) {
    try {
      const assetAddress = getContract(deployment, asset.key);
      if (assetAddress.toLowerCase() === address.toLowerCase()) {
        return asset.symbol;
      }
    } catch (error) {
      // Asset not available in this deployment
      continue;
    }
  }
  return "UNKNOWN";
}

/**
 * Get all supported asset keys for a deployment
 */
export function getSupportedAssetKeys(deployment: Deployment): Array<keyof typeof SUPPORTED_ASSETS[number]> {
  const availableKeys: Array<keyof typeof SUPPORTED_ASSETS[number]> = [];

  SUPPORTED_ASSETS.forEach(asset => {
    try {
      getContract(deployment, asset.key);
      availableKeys.push(asset.key);
    } catch (error) {
      // Asset not available in this deployment
    }
  });

  return availableKeys;
}

/**
 * Check if an asset is supported in a deployment
 */
export function isAssetSupported(assetKey: string, deployment: Deployment): boolean {
  try {
    const asset = SUPPORTED_ASSETS.find(a => a.key === assetKey);
    if (!asset) return false;

    getContract(deployment, asset.key);
    return true;
  } catch (error) {
    return false;
  }
}
