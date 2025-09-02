// src/components/vault/VaultTabsLayout.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DepositModal } from "./DepositModal";
import { RedeemModal } from "./RedeemModal";
import { OverviewTab, PortfolioTab, ConfigurationTab, FeeTab, PolicyTab } from "./tabs";
import { UniswapTab } from "./tabs/UniswapTab";
import { VaultErrorBoundary } from "./VaultErrorBoundary";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpCircle, ArrowDownCircle, TrendingUp, Info, Home, Repeat } from "lucide-react";
import { type Address } from "viem";
import { useAccount } from "wagmi";
import { useVaultSharesBalance } from "@/lib/hooks/useVaultSharesBalance";
import { getNetworkByDeployment } from "@/lib/consts";

interface VaultTabsLayoutProps {
  name: string;
  vault: string;
  deployment: string;
  denominationAsset?: string;
  comptrollerProxy?: Address | null;
  denominationAssetAddress?: Address | null;
}

export function VaultTabsLayout({
  name,
  vault,
  deployment,
  denominationAsset = "USDC",
  comptrollerProxy,
  denominationAssetAddress,
}: VaultTabsLayoutProps) {
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);

  // 獲取用戶地址
  const { address: userAddress } = useAccount();

  // 獲取用戶的 vault shares 餘額
  const network = getNetworkByDeployment(deployment as any);
  const balanceQuery = useVaultSharesBalance({
    network,
    vaultProxy: vault as Address,
    userAddress: userAddress!,
    enabled: !!userAddress
  });

  const {
    formattedBalance: userSharesBalance,
    isLoading: isLoadingBalance,
    error: balanceError,
    refetch: refetchBalance
  } = balanceQuery;

  // 在打開 Redeem Modal 時刷新餘額
  const handleOpenRedeemModal = async () => {
    if (refetchBalance) {
      await refetchBalance();
    }
    setIsRedeemModalOpen(true);
  };

  // Debug logging for balance
  if (process.env.NODE_ENV === 'development') {
    console.log("[VaultTabsLayout] Balance Debug", {
      userAddress,
      vaultProxy: vault,
      network,
      userSharesBalance,
      isLoadingBalance,
      balanceError
    });
  }

  return (
    <>
      {/* Vault Header with Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">
              {name}
            </h1>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Active
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            <p className="break-all font-mono">{vault}</p>
          </div>
        </div>

        {/* Trading Actions */}
        <div className="flex flex-col sm:flex-row gap-2 min-w-fit">
          <Button
            onClick={() => setIsDepositModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
            size="default"
          >
            <ArrowUpCircle className="h-4 w-4 mr-2" />
            Deposit
          </Button>

          <Button
            onClick={handleOpenRedeemModal}
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            size="default"
            disabled={isLoadingBalance || !userAddress || parseFloat(userSharesBalance || "0") === 0}
          >
            <ArrowDownCircle className="h-4 w-4 mr-2" />
            {isLoadingBalance ? "Loading..." : "Redeem Shares"}
          </Button>

          <Button
            asChild
            variant="ghost"
            size="default"
          >
            <Link href={`/vault/${deployment}/${vault}/analytics`} className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs Navigation with Home Button */}
      <div className="flex items-center justify-between mb-4">
        <Tabs defaultValue="overview" className="flex-1">
          <TabsList className="grid grid-cols-6 w-full max-w-3xl">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              Overview
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="flex items-center gap-2">
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="uniswap" className="flex items-center gap-2">
              <Repeat className="h-4 w-4" />
              Swap
            </TabsTrigger>
            <TabsTrigger value="fee" className="flex items-center gap-2">
              Fee
            </TabsTrigger>
            <TabsTrigger value="policy" className="flex items-center gap-2">
              Policy
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              Settings
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="overview" className="mt-0">
              <VaultErrorBoundary>
                <Suspense fallback={
                  <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-3">
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                  </div>
                }>
                  <OverviewTab vault={vault as Address} deployment={deployment as any} />
                </Suspense>
              </VaultErrorBoundary>
            </TabsContent>
            <TabsContent value="portfolio" className="mt-0">
              <PortfolioTab vault={vault as Address} deployment={deployment as any} />
            </TabsContent>
            <TabsContent value="uniswap" className="mt-0">
              <UniswapTab 
                vault={vault as Address} 
                deployment={deployment as any}
                comptrollerProxy={comptrollerProxy}
                denominationAsset={denominationAssetAddress}
              />
            </TabsContent>
            <TabsContent value="fee" className="mt-0">
              <FeeTab 
                vault={vault as Address} 
                deployment={deployment as any}
                comptrollerProxy={comptrollerProxy}
              />
            </TabsContent>
            <TabsContent value="policy" className="mt-0">
              <PolicyTab vault={vault as Address} deployment={deployment as any} />
            </TabsContent>
            <TabsContent value="settings" className="mt-0">
              <ConfigurationTab vault={vault as Address} deployment={deployment as any} />
            </TabsContent>
          </div>
        </Tabs>

        {/* Home Button */}
        <Button
          asChild
          variant="outline"
          size="default"
          className="ml-4"
        >
          <Link href="/" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Home
          </Link>
        </Button>
      </div>

      {/* Deposit Modal */}
      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        vaultName={name}
        denominationAsset={denominationAsset}
        comptrollerProxy={comptrollerProxy}
        denominationAssetAddress={denominationAssetAddress}
        deployment={deployment}
      />

      {/* Redeem Modal */}
      <RedeemModal
        isOpen={isRedeemModalOpen}
        onClose={() => setIsRedeemModalOpen(false)}
        vaultName={name}
        denominationAsset={denominationAsset}
        currentBalance={userSharesBalance || "0"}
        isLoadingBalance={isLoadingBalance}
        comptrollerProxy={comptrollerProxy}
        vaultProxy={vault as Address}
        deployment={deployment}
        onBalanceRefresh={refetchBalance}
      />
    </>
  );
}