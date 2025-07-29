"use client";

import { useAccount } from "wagmi";
import { getDeploymentByChainId, getDefaultDeployment, isSupportedChainId } from "@/lib/chain-utils";
import { type Deployment } from "@/lib/consts";
import { useMemo } from "react";

export interface DeploymentState {
  deployment: Deployment;
  isConnected: boolean;
  isSupported: boolean;
  chainId?: number;
  needsNetworkSwitch: boolean;
}

/**
 * Hook to get the current deployment based on connected wallet chain
 */
export function useDeployment(): DeploymentState {
  const { isConnected, chain } = useAccount();

  const state = useMemo((): DeploymentState => {
    if (!isConnected || !chain) {
      return {
        deployment: getDefaultDeployment(),
        isConnected: false,
        isSupported: true,
        needsNetworkSwitch: false,
      };
    }

    const deployment = getDeploymentByChainId(chain.id);
    const isSupported = isSupportedChainId(chain.id);

    return {
      deployment: deployment || getDefaultDeployment(),
      isConnected: true,
      isSupported,
      chainId: chain.id,
      needsNetworkSwitch: !isSupported,
    };
  }, [isConnected, chain]);

  return state;
}

/**
 * Hook to check if the current network matches a specific deployment
 */
export function useIsCorrectNetwork(targetDeployment: Deployment): boolean {
  const { deployment, isConnected, isSupported } = useDeployment();
  
  if (!isConnected) {
    return true; // Allow when not connected
  }
  
  return isSupported && deployment === targetDeployment;
}
