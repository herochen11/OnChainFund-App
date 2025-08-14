"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { Address } from "viem";
import { useAccount } from "wagmi";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDeployment } from "@/lib/hooks/useDeployment";
import { querySubgraph, type AllVaultsResponse, type VaultsByCreatorResponse, type VaultData } from "@/lib/gql";
import { VAULT_QUERIES } from "@/lib/subgraphs/core/vaultList";
import { useBalanceOf } from "@/lib/hooks/useBalanceOf";
import { VaultTile } from "@/components/vault/VaultTile";
import { Copy, ExternalLink, Wallet, Calendar, DollarSign, User, Grid, List, Loader2 } from "lucide-react";

// Helper function to transform vault data for the UI
function transformVaultData(vault: VaultData, deployment: string) {
  return {
    name: vault.fundName,
    symbol: vault.fundSymbol,
    vaultProxy: vault.vaultProxy as Address,
    comptrollerProxy: vault.comptrollerProxy as Address,
    creator: vault.creator.id as Address,
    denominationAsset: vault.denominationAsset as Address,
    deployment,
    createdAt: vault.createdAtTimestamp ? new Date(parseInt(vault.createdAtTimestamp) * 1000) : undefined,
  };
}

function useVaultListByAccount(account?: Address) {
  const result = useQuery({
    enabled: !!account,
    queryKey: ["useVaultListByAccount", account?.toLowerCase()],
    queryFn: async () => {
      if (!account) return [];

      const data = await querySubgraph<VaultsByCreatorResponse>(
        'testnet', // Using testnet since this is Sepolia
        VAULT_QUERIES.VAULTS_BY_CREATOR,
        {
          creator: account.toLowerCase()
        }
      );

      return data.vaults.map((vault: VaultData) => transformVaultData(vault, 'testnet'));
    },
    staleTime: 30000,
    retry: 3,
  });

  return result;
}

function useAllVaults() {
  const result = useQuery({
    queryKey: ["useAllVaults"],
    queryFn: async () => {
      const data = await querySubgraph<AllVaultsResponse>(
        'testnet', // Using testnet since this is Sepolia
        VAULT_QUERIES.ALL_VAULTS
      );

      return data.vaults.map((vault: VaultData) => transformVaultData(vault, 'testnet'));
    },
    staleTime: 30000,
    retry: 3,
  });

  return result;
}

// Copy to clipboard function
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error('Failed to copy: ', err);
  }
};

// Address component with copy functionality
function AddressDisplay({ address, label }: { address: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await copyToClipboard(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-1">
      {label && <div className="text-xs text-muted-foreground font-medium">{label}</div>}
      <div className="flex items-center space-x-2 group">
        <code className="text-xs font-mono bg-muted/50 px-2 py-1 rounded border">
          {address}
        </code>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleCopy}
          title="Copy address"
        >
          <Copy className="h-3 w-3" />
        </Button>
        {copied && (
          <span className="text-xs text-green-600 font-medium">Copied!</span>
        )}
      </div>
    </div>
  );
}

// Network badge component
function NetworkBadge({ network }: { network: string | undefined | null }) {
  // Safely handle network value
  const safeNetwork = network || 'unknown';

  const getNetworkColor = (net: string) => {
    // Ensure we have a string before calling toLowerCase
    const normalizedNet = typeof net === 'string' ? net.toLowerCase() : 'unknown';

    switch (normalizedNet) {
      case 'ethereum':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'polygon':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'testnet':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getDisplayName = (net: string) => {
    const normalizedNet = typeof net === 'string' ? net.toLowerCase() : 'unknown';

    switch (normalizedNet) {
      case 'testnet':
        return 'Sepolia';
      case 'ethereum':
        return 'Ethereum';
      case 'polygon':
        return 'Polygon';
      default:
        return 'Unknown';
    }
  };

  return (
    <Badge variant="secondary" className={`${getNetworkColor(safeNetwork)} border-0`}>
      {getDisplayName(safeNetwork)}
    </Badge>
  );
}

// Vault Card Component using VaultTile
function VaultCard({ vault, onClick }: { vault: any; onClick: () => void }) {
  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const formatDate = (date?: Date) => {
    if (!date) return "Unknown";
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const balance = useBalanceOf({
    network: 'sepolia',
    token: vault.denominationAsset,
    account: vault.vaultProxy
  });

  // Helper function to format the balance with 8 decimals
  const formatBalance = (value: bigint | undefined) => {
    if (balance.isLoading) return 'Loading...';
    if (balance.isError) return 'Error';
    if (value === undefined || value === null) return '0';

    // Convert the bigint to a number to avoid scientific notation, and then to a string.
    const balanceNum = Number(value) / 1000000000000000000;
    return balanceNum.toString();
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{vault.name}</CardTitle>
          <NetworkBadge network={vault.deployment} />
        </div>
        <Badge variant="outline" className="w-fit">
          {vault.symbol}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-2">
          <div>
            <div className="text-xs text-muted-foreground font-medium">Vault Balance</div>
            <div className="flex items-center gap-1 text-sm font-mono p-1 rounded transition-colors cursor-help"
            >
              {balance.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                formatBalance(balance.data)
              )}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Vault Proxy</div>
            <div
              className="text-sm font-mono hover:bg-muted/50 p-1 rounded transition-colors cursor-help"
              title={vault.vaultProxy}
            >
              {formatAddress(vault.vaultProxy)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Denomination Asset</div>
            <div
              className="text-sm font-mono hover:bg-muted/50 p-1 rounded transition-colors cursor-help"
              title={vault.denominationAsset}
            >
              {formatAddress(vault.denominationAsset)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Creator</div>
            <div
              className="text-sm font-mono hover:bg-muted/50 p-1 rounded transition-colors cursor-help"
              title={vault.creator}
            >
              {formatAddress(vault.creator)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Created</div>
            <div className="text-sm flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(vault.createdAt)}
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading States
function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/4"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({ showMyVaults, isConnected }: { showMyVaults: boolean; isConnected: boolean }) {
  return (
    <div className="text-center py-12">
      <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">
        {showMyVaults
          ? (isConnected ? 'No vaults found' : 'Connect your wallet')
          : 'No vaults available'
        }
      </h3>
      <p className="text-muted-foreground max-w-md mx-auto">
        {showMyVaults
          ? (isConnected
            ? 'You haven\'t created any vaults yet.'
            : 'Connect your wallet to view and manage your vaults.')
          : 'There are no vaults on this network yet.'
        }
      </p>
    </div>
  );
}

export function VaultList() {
  const account = useAccount();
  const deploymentState = useDeployment();
  const deployment = deploymentState.deployment;
  const [showMyVaults, setShowMyVaults] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const myVaults = useVaultListByAccount(account.address);
  const allVaultsQuery = useAllVaults();

  const vaults = showMyVaults ? myVaults : allVaultsQuery;
  const router = useRouter();

  const formatDate = (date?: Date) => {
    if (!date) return "Unknown";
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleVaultClick = (vault: any) => {
    router.push(`/${vault.deployment}/${vault.vaultProxy}`);
  };

  return (
    <Card className="w-full mb-12 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              {showMyVaults ? 'My Vaults' : 'All Vaults'}
            </CardTitle>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <span>Network:</span>
              <NetworkBadge network={deployment} />
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* Vault Filter Buttons */}
            <div className="flex gap-1">
              <Button
                variant={showMyVaults ? "default" : "outline"}
                size="sm"
                onClick={() => setShowMyVaults(true)}
                disabled={!account.address}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                My Vaults ({myVaults.data?.length || 0})
              </Button>
              <Button
                variant={!showMyVaults ? "default" : "outline"}
                size="sm"
                onClick={() => setShowMyVaults(false)}
                className="flex items-center gap-2"
              >
                <DollarSign className="h-4 w-4" />
                All Vaults ({allVaultsQuery.data?.length || 0})
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {vaults.isLoading ? (
          viewMode === 'grid' ? (
            <LoadingGrid />
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Loading vaults...</span>
            </div>
          )
        ) : vaults.error ? (
          <div className="text-center py-8">
            <div className="text-destructive font-medium mb-2">Error loading vaults</div>
            <p className="text-sm text-muted-foreground mb-4">{vaults.error.message}</p>
            <Button variant="outline" onClick={() => vaults.refetch()}>
              Try Again
            </Button>
          </div>
        ) : !vaults.data || vaults.data.length === 0 ? (
          <EmptyState showMyVaults={showMyVaults} isConnected={!!account.address} />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vaults.data.map((vault) => (
              <VaultCard
                key={`${vault.deployment}-${vault.vaultProxy}`}
                vault={vault}
                onClick={() => handleVaultClick(vault)}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Fund Details</TableHead>
                  <TableHead className="font-semibold">Vault Contract</TableHead>
                  <TableHead className="font-semibold">Denomination Asset</TableHead>
                  <TableHead className="font-semibold">Creator</TableHead>
                  <TableHead className="font-semibold">Created</TableHead>
                  <TableHead className="font-semibold">Network</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vaults.data.map((vault) => (
                  <TableRow
                    key={`${vault.deployment}-${vault.vaultProxy}`}
                    className="cursor-pointer hover:bg-muted/30 transition-colors border-b"
                    onClick={() => handleVaultClick(vault)}
                  >
                    <TableCell className="py-4">
                      <div className="space-y-1">
                        <div className="font-semibold text-foreground">{vault.name}</div>
                        <Badge variant="outline" className="text-xs">
                          {vault.symbol}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <AddressDisplay address={vault.vaultProxy} label="Vault Proxy" />
                    </TableCell>
                    <TableCell className="py-4">
                      <AddressDisplay address={vault.denominationAsset} label="Asset Contract" />
                    </TableCell>
                    <TableCell className="py-4">
                      <AddressDisplay address={vault.creator} label="Creator" />
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground font-medium">Created</div>
                        <div className="text-sm flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {formatDate(vault.createdAt)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <NetworkBadge network={vault.deployment} />
                    </TableCell>
                    <TableCell className="py-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVaultClick(vault);
                        }}
                        title="View vault details"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Debug information - only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <CardContent className="pt-0">
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
              Debug Information
            </summary>
            <div className="mt-3 p-3 bg-muted/50 rounded-md space-y-1 font-mono">
              <div><span className="font-semibold">Deployment:</span> {deployment}</div>
              <div><span className="font-semibold">Chain ID:</span> {deploymentState.chainId || 'N/A'}</div>
              <div><span className="font-semibold">Is Supported:</span> {deploymentState.isSupported.toString()}</div>
              <div><span className="font-semibold">Connected Account:</span> {account.address || 'Not connected'}</div>
              <div><span className="font-semibold">Show My Vaults:</span> {showMyVaults.toString()}</div>
              <div><span className="font-semibold">View Mode:</span> {viewMode}</div>
              <div><span className="font-semibold">Query State:</span> {vaults.isLoading ? 'Loading' : vaults.error ? 'Error' : 'Success'}</div>
              <div><span className="font-semibold">Data Count:</span> {vaults.data?.length || 0}</div>
            </div>
          </details>
        </CardContent>
      )}
    </Card>
  );
}
