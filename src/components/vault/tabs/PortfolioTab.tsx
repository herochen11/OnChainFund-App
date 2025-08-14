import { VaultTile } from "@/components/vault/VaultTile";
import { type Deployment } from "@/lib/consts";
import { type Address } from "viem";

interface PortfolioTabProps {
  vault: Address;
  deployment: Deployment;
}

export function PortfolioTab({ vault, deployment }: PortfolioTabProps) {
  return (
    <div className="grid grid-cols-1 gap-4 pt-2">
      <VaultTile title="Portfolio Holdings" description="Coming Soon" />
      <VaultTile title="Asset Allocation" description="Feature in development" />
      <VaultTile title="Performance Chart" description="Charts will be displayed here" />
    </div>
  );
}
