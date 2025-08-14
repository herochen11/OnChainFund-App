import { VaultTile } from "@/components/vault/VaultTile";
import { type Deployment } from "@/lib/consts";
import { getAllVaultData } from "@/lib/vault-data";
import { type Address } from "viem";

interface OverviewTabProps {
  vault: Address;
  deployment: Deployment;
}

export async function OverviewTab({ vault, deployment }: OverviewTabProps) {
  try {
    // Fetch vault data once for the entire tab with error handling
    const vaultData = await getAllVaultData(vault, deployment);
    
    return (
      <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-3">
        {/* Static information - immediate display */}
        <VaultTile title="Vault Address" description={vault} />
        <VaultTile title="Network" description={deployment.toUpperCase()} />
        <VaultTile title="Status" description="Active" />
        
        {/* Pass fetched data to child components */}
        <VaultBasicInfo data={vaultData.basicInfo} vault={vault} />
        <VaultOwnership data={vaultData.ownership} />
        <VaultLiveData data={vaultData.liveData} />
      </div>
    );
  } catch (error) {
    console.error("Error loading vault data:", error);
    
    // Return error state instead of throwing (prevents retry loop)
    return (
      <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-3">
        <VaultTile title="Vault Address" description={vault} />
        <VaultTile title="Network" description={deployment.toUpperCase()} />
        <VaultTile title="Status" description="Error" />
        <VaultTile title="Error" description="Failed to load vault data" />
        <VaultTile title="Retry" description="Please refresh the page" />
        <VaultTile title="Note" description="API rate limit may have been reached" />
      </div>
    );
  }
}

// Basic info component - receives data as prop
function VaultBasicInfo({ data, vault }: { data: any; vault: Address }) {
  
  if (!data) {
    return (
      <>
        <VaultTile title="Name" description="Error loading" />
        <VaultTile title="Symbol" description="Error loading" />
        <VaultTile title="Denomination Asset" description="Error loading" />
      </>
    );
  }

  const displayName = data.name || `Vault ${vault.slice(0, 6)}...${vault.slice(-4)}`;
  const displaySymbol = data.symbol || "N/A";
  const displayDenom = data.denominationSymbol || 
    (data.denominationAsset ? `${data.denominationAsset.slice(0, 6)}...${data.denominationAsset.slice(-4)}` : "N/A");

  return (
    <>
      <VaultTile title="Name" description={displayName} />
      <VaultTile title="Symbol" description={displaySymbol} />
      <VaultTile title="Denomination Asset" description={displayDenom} />
    </>
  );
}

// Ownership info component - receives data as prop
function VaultOwnership({ data }: { data: any }) {
  
  if (!data || !data.owner) {
    return <VaultTile title="Owner" description="Error loading" />;
  }

  return <VaultTile title="Owner" description={data.shortOwner || data.owner} />;
}

// Live data component - receives data as prop
function VaultLiveData({ data }: { data: any }) {
  
  const totalSupplyDisplay = data?.formattedTotalSupply 
    ? `${parseFloat(data.formattedTotalSupply).toFixed(4)} shares`
    : "Error loading";

  return (
    <>
      <VaultTile title="Total Supply" description={totalSupplyDisplay} />
      <VaultTile title="GAV" description="Coming Soon" />
      <VaultTile title="Share Price" description="Coming Soon" />
    </>
  );
}
