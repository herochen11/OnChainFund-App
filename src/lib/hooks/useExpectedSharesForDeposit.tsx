"use client";

import { useQuery } from "@tanstack/react-query";
import { type Address, parseUnits, zeroAddress } from "viem";
import { Depositor } from "@enzymefinance/sdk";
import { getPublicClient } from "../rpc";
import type { Network } from "../consts";

interface ExpectedSharesForDepositProps {
  network: Network;
  comptrollerProxy: Address;
  amount: string; // Amount as string to handle input
  depositor: Address;
  decimals?: number;
  enabled?: boolean;
}

export function useExpectedSharesForDeposit({ 
  network, 
  comptrollerProxy, 
  amount,
  depositor,
  decimals = 18,
  enabled = true 
}: ExpectedSharesForDepositProps) {
  return useQuery({
    queryKey: ["useExpectedSharesForDeposit", network, comptrollerProxy, amount, depositor, decimals],
    queryFn: async () => {
      if (!amount || amount === "" || parseFloat(amount) <= 0) {
        return 0n;
      }

      const publicClient = getPublicClient(network);
      const amountBigInt = parseUnits(amount, decimals);
      
      const expectedShares = await Depositor.getExpectedSharesForDeposit(publicClient, {
        comptrollerProxy,
        amount: amountBigInt,
        depositor,
      });
      
      return expectedShares;
    },
    enabled: enabled && 
             !!comptrollerProxy && 
             comptrollerProxy !== zeroAddress &&
             !!depositor && 
             depositor !== zeroAddress &&
             !!amount && 
             parseFloat(amount) > 0,
    staleTime: 30 * 1000, // 30 seconds - share prices can change
    retry: 2,
  });
}