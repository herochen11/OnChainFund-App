import { type Deployment, type Network, getNetworkByDeployment } from "./consts";
import { isServer } from "./environment";
import { cache } from "react";
import { createPublicClient, http } from "viem";
import platformConfig from "./environment";

export function getRpcUrl(network: Network) {
  switch (network) {
    case "ethereum":
      return isServer
        ? `https://mainnet.infura.io/v3/${platformConfig.infuraApiKey}`
        : `/api/rpc/ethereum`;
    case "polygon":
      return isServer
        ? `https://polygon-mainnet.infura.io/v3/${platformConfig.infuraApiKey}`
        : `/api/rpc/polygon`;
    case "sepolia":
      // Use public Sepolia RPC as fallback if Infura fails
      return isServer
        ? platformConfig.infuraApiKey && platformConfig.infuraApiKey !== '<YOUR API KEY>'
          ? `https://sepolia.infura.io/v3/${platformConfig.infuraApiKey}`
          : 'https://rpc.sepolia.org'
        : `/api/rpc/sepolia`;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
}

export const getPublicClient = cache(function getPublicClient(network: Network) {
  return createPublicClient({
    transport: http(getRpcUrl(network)),
    name: network,
    batch: {
      multicall: {
        wait: 1,
      },
    },
  });
});

export function getPublicClientForDeployment(deployment: Deployment) {
  return getPublicClient(getNetworkByDeployment(deployment));
}