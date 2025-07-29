import { type Deployment, getNetworkByDeployment } from "@/lib/consts";
import { mainnet, polygon, sepolia } from "viem/chains";

/**
 * Map chain IDs to deployment names
 */
export function getDeploymentByChainId(chainId: number): Deployment | null {
  switch (chainId) {
    case mainnet.id: // 1
      return "ethereum";
    case polygon.id: // 137
      return "polygon";
    case sepolia.id: // 11155111
      return "testnet";
    default:
      return null;
  }
}

/**
 * Map deployment to chain ID
 */
export function getChainIdByDeployment(deployment: Deployment): number {
  switch (deployment) {
    case "ethereum":
      return mainnet.id;
    case "polygon":
      return polygon.id;
    case "testnet":
      return sepolia.id;
  }
}

/**
 * Get the default deployment when no wallet is connected
 */
export function getDefaultDeployment(): Deployment {
  return "ethereum";
}

/**
 * Check if a chain ID is supported
 */
export function isSupportedChainId(chainId: number): boolean {
  return getDeploymentByChainId(chainId) !== null;
}

/**
 * Get supported chain IDs
 */
export function getSupportedChainIds(): number[] {
  return [mainnet.id, polygon.id, sepolia.id];
}

/**
 * Get chain name for display
 */
export function getChainDisplayName(chainId: number): string {
  switch (chainId) {
    case mainnet.id:
      return "Ethereum Mainnet";
    case polygon.id:
      return "Polygon Mainnet";
    case sepolia.id:
      return "Sepolia Testnet";
    default:
      return `Chain ${chainId}`;
  }
}
