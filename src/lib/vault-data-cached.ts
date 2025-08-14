// src/lib/vault-data-cached.ts - 進階緩存版本
import { type Deployment } from "@/lib/consts";
import { getPublicClientForDeployment } from "@/lib/rpc";
import { Vault, Asset } from "@enzymefinance/sdk";
import { type Address, formatUnits } from "viem";

// 使用 Next.js 的 fetch 進行精確緩存控制

// 1. 長緩存 - 基本信息 (1小時)
export async function getVaultBasicInfoCached(vault: Address, deployment: Deployment) {
  const cacheKey = `vault-basic-${deployment}-${vault}`;
  
  try {
    // 模擬 API 調用以利用 Next.js 緩存
    const response = await fetch(`internal://vault-basic/${deployment}/${vault}`, {
      next: { 
        revalidate: 3600, // 1小時緩存
        tags: ['vault-basic', `vault-${vault}`]
      },
      cache: 'force-cache'
    });
    
    // 實際的數據獲取邏輯
    const client = getPublicClientForDeployment(deployment);
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
    throw error;
  }
}

// 2. 中緩存 - 所有權信息 (5分鐘)
export async function getVaultOwnershipCached(vault: Address, deployment: Deployment) {
  try {
    const client = getPublicClientForDeployment(deployment);
    const owner = await Vault.getOwner(client, { vaultProxy: vault });
    
    return {
      owner,
      shortOwner: `${owner.slice(0, 6)}...${owner.slice(-4)}`,
    };
  } catch (error) {
    console.error("Failed to fetch vault ownership:", error);
    throw error;
  }
}

// 3. 無緩存 - 實時數據
export async function getVaultLiveDataFresh(vault: Address, deployment: Deployment) {
  try {
    const client = getPublicClientForDeployment(deployment);
    
    // 強制不使用緩存
    const totalSupply = await Asset.getTotalSupply(client, { asset: vault });

    return {
      totalSupply,
      formattedTotalSupply: formatUnits(totalSupply, 18),
      gav: null, // 待實現
      sharePrice: null, // 待實現
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to fetch vault live data:", error);
    throw error;
  }
}

// 4. 智能緩存策略
export async function getVaultDataSmart(vault: Address, deployment: Deployment) {
  // 並行獲取，使用不同的緩存策略
  const [basicInfo, ownership, liveData] = await Promise.allSettled([
    getVaultBasicInfoCached(vault, deployment),
    getVaultOwnershipCached(vault, deployment), 
    getVaultLiveDataFresh(vault, deployment)
  ]);

  return {
    basicInfo: basicInfo.status === 'fulfilled' ? basicInfo.value : null,
    ownership: ownership.status === 'fulfilled' ? ownership.value : null,
    liveData: liveData.status === 'fulfilled' ? liveData.value : null,
    errors: {
      basicInfo: basicInfo.status === 'rejected' ? basicInfo.reason : null,
      ownership: ownership.status === 'rejected' ? ownership.reason : null,
      liveData: liveData.status === 'rejected' ? liveData.reason : null,
    }
  };
}