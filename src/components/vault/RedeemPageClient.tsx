// src/components/vault/RedeemPageClient.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RedeemModal } from "./RedeemModal";
import { Badge } from "@/components/ui/badge";
import { ArrowDownCircle, ArrowLeft, Info, Wallet, Home, Loader2 } from "lucide-react";
import Link from "next/link";
import { type Address } from "viem";
import { useAccount } from "wagmi";
import { useVaultSharesBalance } from "@/lib/hooks/useVaultSharesBalance";
import { type Network } from "@/lib/consts";

interface RedeemPageClientProps {
  vault: Address;
  deployment: string;
}

export function RedeemPageClient({ vault, deployment }: RedeemPageClientProps) {
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { address: userAddress } = useAccount();

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch user's vault shares balance
  const balanceQuery = useVaultSharesBalance({
    network: deployment as Network,
    vaultProxy: vault,
    userAddress: userAddress as Address,
    enabled: !!userAddress && mounted
  });

  // Mock data - in real implementation, vault metadata would come from hooks/queries
  const vaultData = {
    name: `Vault ${vault.slice(0, 6)}...${vault.slice(-4)}`,
    symbol: "VAULT",
    denominationAsset: "aArbWETH",
    currentBalance: balanceQuery.formattedBalance || "0",
    status: "Active"
  };

  // Function to refresh balance when modal opens
  const handleOpenRedeemModal = async () => {
    // Refetch the latest balance before opening the modal
    await balanceQuery.refetch();
    setIsRedeemModalOpen(true);
  };

  if (!mounted) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">
              Redeem Shares
            </h1>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              {vaultData.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            <p className="break-all font-mono">{vault}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>Network: {deployment.toUpperCase()}</span>
          </div>
        </div>

        {/* Navigation Actions */}
        <div className="flex gap-2">
          <Button
            asChild
            variant="outline"
            size="default"
          >
            <Link href={`/${deployment}/${vault}`} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Vault
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="default"
          >
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Home
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vault Information Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Vault Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground font-medium">Vault Name</div>
                <div className="font-mono">{vaultData.name}</div>
              </div>
              <div>
                <div className="text-muted-foreground font-medium">Symbol</div>
                <div className="font-mono">{vaultData.symbol}</div>
              </div>
              <div>
                <div className="text-muted-foreground font-medium">Denomination Asset</div>
                <div className="font-mono">{vaultData.denominationAsset}</div>
              </div>
              <div>
                <div className="text-muted-foreground font-medium">Network</div>
                <div className="font-mono">{deployment.toUpperCase()}</div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="text-muted-foreground font-medium mb-2">Your Current Balance</div>
              <div className="text-2xl font-bold text-foreground">
                {balanceQuery.isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-lg">Loading...</span>
                  </div>
                ) : balanceQuery.isError ? (
                  <span className="text-red-500">Error loading balance</span>
                ) : (
                  <>{vaultData.currentBalance} <span className="text-lg font-normal text-muted-foreground">shares</span></>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Redeem Action Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownCircle className="h-5 w-5" />
              Redeem Shares
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Redeem your vault shares to receive the underlying assets. The redemption will be processed based on the current share price and vault composition.
            </p>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Available to Redeem:</span>
                <span className="font-mono">{vaultData.currentBalance} shares</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Redemption Asset:</span>
                <span className="font-mono">{vaultData.denominationAsset}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Processing Time:</span>
                <span>~1-2 minutes</span>
              </div>
            </div>

            <div className="pt-4">
              <Button
                onClick={handleOpenRedeemModal}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3"
                size="lg"
                disabled={balanceQuery.isLoading || parseFloat(vaultData.currentBalance) === 0 || !userAddress}
              >
                {balanceQuery.isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading Balance...
                  </>
                ) : (
                  <>
                    <ArrowDownCircle className="h-4 w-4 mr-2" />
                    {!userAddress ? "Connect Wallet" : parseFloat(vaultData.currentBalance) === 0 ? "No Shares to Redeem" : "Redeem Shares"}
                  </>
                )}
              </Button>
            </div>

            {parseFloat(vaultData.currentBalance) === 0 && (
              <p className="text-sm text-muted-foreground text-center">
                You don't have any shares in this vault to redeem.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Important Notice */}
      <Card className="mt-6 border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Info className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-medium text-yellow-800">Important Information</h4>
              <div className="text-sm text-yellow-700 space-y-1">
                <p>• Redemptions are processed at the current Net Asset Value (NAV)</p>
                <p>• There may be a processing delay depending on network conditions</p>
                <p>• Make sure you have enough ETH for gas fees</p>
                <p>• Redemption is irreversible once confirmed</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Redeem Modal */}
      <RedeemModal
        isOpen={isRedeemModalOpen}
        onClose={() => setIsRedeemModalOpen(false)}
        vaultName={vaultData.name}
        denominationAsset={vaultData.denominationAsset}
        currentBalance={vaultData.currentBalance}
        comptrollerProxy={vault} // Assuming vault is comptroller proxy for now
        vaultProxy={vault}
        isLoadingBalance={balanceQuery.isLoading}
        onBalanceRefresh={() => balanceQuery.refetch()}
      />
    </div>
  );
}