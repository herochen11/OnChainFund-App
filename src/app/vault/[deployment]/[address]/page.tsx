import { PageLayout } from "@/components/PageLayout";
import { VaultTabsLayout } from "@/components/vault/VaultTabsLayout";
import { assertParams } from "@/lib/params";
import { z } from "@/lib/zod";
import { getVaultBasicInfo } from "@/lib/vault-data";

export default async function VaultPage({ 
  params 
}: { 
  params: Promise<{ deployment: string; address: string }> 
}) {
  const { address, deployment } = assertParams({
    params: await params,
    schema: z.object({
      deployment: z.deployment(),
      address: z.address(),
    }),
  });

  // Load vault basic information
  const basicInfo = await getVaultBasicInfo(address, deployment);
  const name = basicInfo.name || `Vault ${address.slice(0, 6)}...${address.slice(-4)}`;
  const denominationAsset = basicInfo.denominationSymbol || "USDC";
  const comptrollerProxy = basicInfo.comptroller;
  const denominationAssetAddress = basicInfo.denominationAsset;

  return (
    <PageLayout>
      <VaultTabsLayout
        name={name}
        vault={address}
        deployment={deployment}
        denominationAsset={denominationAsset}
        comptrollerProxy={comptrollerProxy}
        denominationAssetAddress={denominationAssetAddress}
      />
    </PageLayout>
  );
}
