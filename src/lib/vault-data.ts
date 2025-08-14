// src/lib/vault-data.ts
import { type Deployment, getContract } from "@/lib/consts";
import { getPublicClientForDeployment } from "@/lib/rpc";
import { Vault, Asset } from "@enzymefinance/sdk";
import { type Address, formatUnits } from "viem";

// 1. 長緩存數據 - 基本信息 (1小時緩存)
export async function getVaultBasicInfo(vault: Address, deployment: Deployment) {
  const client = getPublicClientForDeployment(deployment);
  
  try {
    const [name, symbol, comptroller] = await Promise.allSettled([
      Vault.getName(client, { vaultProxy: vault }),
      Vault.getSymbol(client, { vaultProxy: vault }),
      Vault.getComptrollerProxy(client, { vaultProxy: vault })
    ]);

    let denominationAsset = null;
    let denominationSymbol = null;

    if (comptroller.status === 'fulfilled') {
      try {
        denominationAsset = await Vault.getDenominationAsset(client, { 
          comptrollerProxy: comptroller.value 
        });
        denominationSymbol = await Asset.getSymbol(client, { asset: denominationAsset });
      } catch (error) {
        console.warn("Failed to fetch denomination asset info:", error);
      }
    }

    return {
      name: name.status === 'fulfilled' ? name.value : null,
      symbol: symbol.status === 'fulfilled' ? symbol.value : null,
      denominationAsset,
      denominationSymbol,
      comptroller: comptroller.status === 'fulfilled' ? comptroller.value : null,
    };
  } catch (error) {
    console.error("Failed to fetch vault basic info:", error);
    return {
      name: null,
      symbol: null,
      denominationAsset: null,
      denominationSymbol: null,
      comptroller: null,
    };
  }
}

// 2. 中緩存數據 - 所有權信息 (5分鐘緩存)
export async function getVaultOwnership(vault: Address, deployment: Deployment) {
  const client = getPublicClientForDeployment(deployment);
  
  try {
    const owner = await Vault.getOwner(client, { vaultProxy: vault });
    return {
      owner,
      shortOwner: `${owner.slice(0, 6)}...${owner.slice(-4)}`,
    };
  } catch (error) {
    console.error("Failed to fetch vault ownership:", error);
    return {
      owner: null,
      shortOwner: null,
    };
  }
}

// 3. 實時數據 - 動態信息 (無緩存)
export async function getVaultLiveData(vault: Address, deployment: Deployment) {
  const client = getPublicClientForDeployment(deployment);
  
  try {
    // 並行獲取實時數據
    const [totalSupplyResult] = await Promise.allSettled([
      Asset.getTotalSupply(client, { asset: vault }),
    ]);

    const totalSupply = totalSupplyResult.status === 'fulfilled' 
      ? totalSupplyResult.value 
      : null;

    return {
      totalSupply,
      formattedTotalSupply: totalSupply 
        ? formatUnits(totalSupply, 18) 
        : null,
      // GAV 和 Share Price 待實現
      gav: null,
      sharePrice: null,
    };
  } catch (error) {
    console.error("Failed to fetch vault live data:", error);
    return {
      totalSupply: null,
      formattedTotalSupply: null,
      gav: null,
      sharePrice: null,
    };
  }
}

// 4. 組合函數 - 獲取所有需要的數據 (with rate limiting protection)
export async function getAllVaultData(vault: Address, deployment: Deployment) {
  try {
    // Add a small delay to prevent overwhelming the RPC
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 並行獲取所有數據
    const [basicInfo, ownership, liveData] = await Promise.allSettled([
      getVaultBasicInfo(vault, deployment),
      getVaultOwnership(vault, deployment),
      getVaultLiveData(vault, deployment),
    ]);

    return {
      basicInfo: basicInfo.status === 'fulfilled' ? basicInfo.value : null,
      ownership: ownership.status === 'fulfilled' ? ownership.value : null,
      liveData: liveData.status === 'fulfilled' ? liveData.value : null,
    };
  } catch (error) {
    console.error("Failed to fetch vault data:", error);
    
    // Return partial data instead of throwing
    return {
      basicInfo: null,
      ownership: null,
      liveData: null,
    };
  }
}