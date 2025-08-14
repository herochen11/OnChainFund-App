import { VaultTile } from "@/components/vault/VaultTile";
import { type Deployment } from "@/lib/consts";
import { type Address } from "viem";

interface ConfigurationTabProps {
  vault: Address;
  deployment: Deployment;
}

export function ConfigurationTab({ vault, deployment }: ConfigurationTabProps) {
  return (
    <div className="grid grid-cols-1 gap-4 pt-2">
      <VaultTile title="Fee Settings" description="Management and performance fees" />
      <VaultTile title="Policy Configuration" description="Investment policies and restrictions" />
      <VaultTile title="Access Control" description="Deposit and redemption permissions" />
    </div>
  );
}
