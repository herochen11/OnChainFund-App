"use client";

import { useBalanceOf } from "./useBalanceOf";
import { formatUnits } from "viem";
import { type Address } from "viem";
import { type Network } from "../consts";

interface UseVaultSharesBalanceProps {
  network: Network;
  vaultProxy: Address;
  userAddress: Address;
  enabled?: boolean;
}

export function useVaultSharesBalance({ 
  network, 
  vaultProxy, 
  userAddress, 
  enabled = true 
}: UseVaultSharesBalanceProps) {
  const balanceQuery = useBalanceOf({
    network,
    token: vaultProxy, // vault proxy is the ERC-20 token for shares
    account: userAddress,
  });

  // 添加額外的 enabled 控制
  const query = {
    ...balanceQuery,
    enabled: enabled && !!vaultProxy && !!userAddress && balanceQuery.enabled,
  };

  return {
    ...query,
    data: balanceQuery.data,
    // 格式化的餘額 (18 decimals to readable format)
    formattedBalance: balanceQuery.data ? formatUnits(balanceQuery.data, 18) : undefined,
    // 原始 BigInt 值
    rawBalance: balanceQuery.data,
  };
}