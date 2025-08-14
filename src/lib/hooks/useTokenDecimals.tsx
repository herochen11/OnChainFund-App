"use client";

import { useQuery } from "@tanstack/react-query";
import { type Address, parseAbi } from "viem";
import { getPublicClient } from "../rpc";
import type { Network } from "../consts";

interface UseTokenDecimalsProps {
  network: Network;
  tokenAddress: Address;
  enabled?: boolean;
}

export function useTokenDecimals({ 
  network, 
  tokenAddress, 
  enabled = true 
}: UseTokenDecimalsProps) {
  return useQuery({
    queryKey: ["useTokenDecimals", network, tokenAddress],
    queryFn: async () => {
      const publicClient = getPublicClient(network);
      
      const decimals = await publicClient.readContract({
        address: tokenAddress,
        abi: parseAbi(["function decimals() view returns (uint8)"]),
        functionName: "decimals",
      });

      return Number(decimals);
    },
    enabled: enabled && !!tokenAddress,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes since decimals rarely change
    retry: 2,
  });
}
