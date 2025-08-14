"use client";

import { useQuery } from "@tanstack/react-query";
import { type Address, zeroAddress } from "viem";
import { Depositor } from "@enzymefinance/sdk";
import { getPublicClient } from "../rpc";
import type { Network } from "../consts";

interface SharesActionTimelockProps {
  network: Network;
  comptrollerProxy: Address;
  enabled?: boolean;
}

export function useSharesActionTimelock({ 
  network, 
  comptrollerProxy, 
  enabled = true 
}: SharesActionTimelockProps) {
  return useQuery({
    queryKey: ["useSharesActionTimelock", network, comptrollerProxy],
    queryFn: async () => {
      console.log("[useSharesActionTimelock] Starting query", {
        network,
        comptrollerProxy,
        enabled
      });
      
      const publicClient = getPublicClient(network);
      console.log("[useSharesActionTimelock] Got public client", publicClient);
      
      const timelock = await Depositor.getSharesActionTimelock(publicClient, {
        comptrollerProxy,
      });
      
      console.log("[useSharesActionTimelock] Raw timelock from SDK", {
        timelock,
        type: typeof timelock,
        asBigInt: timelock.toString()
      });
      
      // Convert bigint to number (assuming timelock is in seconds)
      const timelockNumber = Number(timelock);
      console.log("[useSharesActionTimelock] Converted to number", timelockNumber);
      
      return timelockNumber;
    },
    enabled: enabled && !!comptrollerProxy && comptrollerProxy !== zeroAddress,
    staleTime: 5 * 60 * 1000, // 5 minutes - timelock settings don't change often
    retry: 3,
    onError: (error) => {
      console.error("[useSharesActionTimelock] Error:", error);
    },
    onSuccess: (data) => {
      console.log("[useSharesActionTimelock] Success:", data);
    }
  });
}