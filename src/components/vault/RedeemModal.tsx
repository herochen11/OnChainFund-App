// src/components/vault/RedeemModal.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Info, Loader2, CheckCircle, RefreshCw } from "lucide-react";
import { type Address, parseUnits, formatUnits, parseAbi } from "viem";
import { useAccount, useWalletClient } from "wagmi";
import { writeContract } from "viem/actions";
import { useTokenDecimals } from "@/lib/hooks/useTokenDecimals";
import { getNetworkByDeployment, type Network, type Deployment } from "@/lib/consts";

interface RedeemModalProps {
  isOpen: boolean;
  onClose: () => void;
  vaultName: string;
  denominationAsset?: string;
  currentBalance?: string;
  comptrollerProxy?: Address | null;
  vaultProxy?: Address | null;
  isLoadingBalance?: boolean;
  onBalanceRefresh?: () => void;
  deployment?: string;
}

type RedeemStep = 'input' | 'redeeming' | 'success';

export function RedeemModal({
  isOpen,
  onClose,
  vaultName,
  denominationAsset,
  currentBalance,
  comptrollerProxy,
  vaultProxy,
  isLoadingBalance = false,
  onBalanceRefresh,
  deployment = "testnet"
}: RedeemModalProps) {
  // Form state
  const [sharesToRedeem, setSharesToRedeem] = useState("");

  // Transaction state
  const [currentStep, setCurrentStep] = useState<RedeemStep>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Wallet hooks
  const { address: userAddress } = useAccount();
  const { data: walletClient } = useWalletClient();

  // Network setup
  const network = getNetworkByDeployment(deployment as Deployment);

  // Get vault shares decimals for proper amount calculation
  const {
    data: vaultSharesDecimals,
    isLoading: isDecimalsLoading,
    error: decimalsError
  } = useTokenDecimals({
    network,
    tokenAddress: vaultProxy!,
    enabled: !!vaultProxy
  });

  // Reset state when modal closes or opens
  useEffect(() => {
    if (!isOpen) {
      setSharesToRedeem("");
      setCurrentStep('input');
      setIsLoading(false);
      setTxHash("");
      setError("");
    } else {
      // When modal opens, refresh the balance
      if (onBalanceRefresh) {
        onBalanceRefresh();
      }
    }
  }, [isOpen, onBalanceRefresh]);

  // Validation
  const isValidAmount = () => {
    const numAmount = parseFloat(sharesToRedeem);
    const maxBalance = parseFloat(currentBalance);
    return !isNaN(numAmount) && numAmount > 0 && numAmount <= maxBalance;
  };

  const isConnected = !!userAddress && !!walletClient;
  const hasRequiredData = !!comptrollerProxy;
  const hasVaultSharesDecimals = vaultSharesDecimals !== undefined && !isDecimalsLoading;
  // Check if user has any shares to redeem
  const hasShares = parseFloat(currentBalance || "0") > 0;
  const canProceed = isValidAmount() && isConnected && hasRequiredData && hasShares && !isLoadingBalance && hasVaultSharesDecimals;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setSharesToRedeem(value);
      setError(""); // Clear errors when user types
    }
  };

  const handleMaxClick = () => {
    setSharesToRedeem(currentBalance);
    setError("");
  };

  const handleRedeem = async () => {
    // Enhanced validation
    if (!walletClient) {
      setError("Wallet not connected");
      return;
    }
    if (!comptrollerProxy) {
      setError("Comptroller proxy address not found");
      return;
    }
    if (!userAddress) {
      setError("User address not found");
      return;
    }
    if (!isValidAmount()) {
      setError("Invalid amount");
      return;
    }
    if (vaultSharesDecimals === undefined) {
      setError("Vault shares decimals not loaded");
      return;
    }

    try {
      setIsLoading(true);
      setCurrentStep('redeeming');
      setError("");

      // 使用正確的小數位數
      const sharesAmountBigInt = parseUnits(sharesToRedeem, vaultSharesDecimals);

      console.log("[RedeemModal] Starting redemption with correct decimals:", {
        comptrollerProxy,
        recipient: userAddress,
        sharesQuantity: sharesAmountBigInt.toString(),
        decimals: vaultSharesDecimals,
        inputAmount: sharesToRedeem,
        additionalAssets: [], // 簡化版本先用空陣列
        assetsToSkip: []       // 簡化版本先用空陣列
      });

      // 現代的 viem 方式 - 直接用 writeContract
      const hash = await writeContract(walletClient, {
        address: comptrollerProxy,
        abi: parseAbi([
          'function redeemSharesInKind(address recipient, uint256 sharesQuantity, address[] additionalAssets, address[] assetsToSkip) returns (address[] payoutAssets, uint256[] payoutAmounts)'
        ]),
        functionName: 'redeemSharesInKind',
        args: [
          userAddress,           // recipient
          sharesAmountBigInt,    // sharesQuantity  
          [],                    // additionalAssets (empty for now)
          []                     // assetsToSkip (empty for now)
        ],
      });

      console.log("[RedeemModal] Modern redeem transaction sent:", hash);
      setTxHash(hash);
      setCurrentStep('success');

      // Refresh balance after successful transaction
      if (onBalanceRefresh) {
        setTimeout(() => {
          onBalanceRefresh();
        }, 2000); // Wait 2 seconds for transaction to be mined
      }

      // Auto-close after 3 seconds
      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (err: any) {
      console.error("[RedeemModal] Redeem error:", err);
      setError(err.message || "Redemption failed");
      setCurrentStep('input');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setSharesToRedeem("");
    setError("");
    onClose();
  };

  // Button state
  const getButtonText = () => {
    if (!isConnected) return "Connect Wallet";
    if (isDecimalsLoading) return "Loading Token Info...";
    if (!hasVaultSharesDecimals) return "Unable to Load Token Info";
    if (isLoadingBalance) return "Loading Balance...";
    if (!hasShares) return "No Shares to Redeem";
    if (!isValidAmount()) return "Enter Amount";
    if (currentStep === 'redeeming' && isLoading) return "Redeeming...";
    if (currentStep === 'success') return "Success!";
    return "Redeem";
  };

  const isButtonDisabled = () => {
    if (!canProceed) return true;
    if (isLoading) return true;
    if (currentStep === 'success') return true;
    return false;
  };

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log("[RedeemModal Debug]", {
      userAddress,
      comptrollerProxy,
      vaultProxy,
      sharesToRedeem,
      currentStep,
      isConnected,
      hasRequiredData,
      canProceed,
      comptrollerValid: comptrollerProxy ? (comptrollerProxy.startsWith('0x') && comptrollerProxy.length === 42) : false,
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white text-gray-900 border-gray-200 rounded-xl">
        {/* Header */}
        <DialogHeader className="relative">
          <DialogTitle className="text-xl font-semibold text-center text-gray-900">
            Redeem
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Success State */}
          {currentStep === 'success' && (
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-green-700">Redemption Successful!</h3>
                <p className="text-sm text-gray-600">
                  Your {sharesToRedeem} shares have been redeemed successfully.
                </p>
                {txHash && (
                  <p className="text-xs text-gray-500 mt-2 break-all font-mono">
                    Tx: {txHash}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Input Form */}
          {currentStep !== 'success' && (
            <>
              {/* Current Balance */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-gray-700 text-sm">Your Current Balance:</Label>
                  {onBalanceRefresh && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onBalanceRefresh()}
                      className="h-6 px-2 py-1 text-xs"
                      disabled={isLoadingBalance}
                    >
                      <RefreshCw className={`h-3 w-3 ${isLoadingBalance ? 'animate-spin' : ''}`} />
                    </Button>
                  )}
                </div>
                <div className="text-lg font-medium text-gray-900">
                  {isLoadingBalance ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading...</span>
                    </div>
                  ) : (
                    `${currentBalance} shares`
                  )}
                </div>
              </div>

              {/* Quantity of shares to redeem */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-gray-700 text-sm">Quantity of shares to redeem</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMaxClick}
                    className="h-6 px-2 py-1 text-xs bg-blue-600 border-blue-600 text-white hover:bg-blue-700 hover:border-blue-700"
                    disabled={currentStep !== 'input' || isLoadingBalance}
                  >
                    Max
                  </Button>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="text"
                      value={sharesToRedeem}
                      onChange={handleAmountChange}
                      placeholder="0.0"
                      className="bg-white border-gray-300 text-gray-900 text-lg h-12"
                      disabled={currentStep !== 'input' || isLoadingBalance || !hasShares}
                    />

                    {/* Error message */}
                    {error ? (
                      <p className="text-red-500 text-xs mt-1">{error}</p>
                    ) : null}

                    {/* Validation messages */}
                    {!error && sharesToRedeem !== "" && !isValidAmount() ? (
                      <p className="text-red-500 text-xs mt-1">
                        {parseFloat(sharesToRedeem) > parseFloat(currentBalance)
                          ? "Amount exceeds current balance"
                          : "Please enter a valid amount greater than 0"
                        }
                      </p>
                    ) : null}

                    {/* Helper text */}
                    {!error && sharesToRedeem === "" ? (
                      <p className="text-gray-400 text-xs mt-1">
                        The number of shares you would like to redeem.
                      </p>
                    ) : null}
                  </div>

                  {/* Token Display */}
                  <div className="w-20 h-12 bg-gray-100 border border-gray-300 rounded-md flex items-center justify-center">
                    <span className="text-gray-700 font-medium text-sm">{denominationAsset}</span>
                  </div>
                </div>
              </div>

              {/* Transaction Progress */}
              {currentStep === 'redeeming' && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <div>
                      <p className="text-blue-700 font-medium">
                        Redemption in progress...
                      </p>
                      <p className="text-blue-600 text-sm">
                        Please confirm the transaction in your wallet
                      </p>
                      {txHash && (
                        <p className="text-xs text-blue-500 mt-1 break-all font-mono">
                          Tx: {txHash}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Debug Info - Development Only */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-gray-50 p-3 rounded text-xs space-y-1">
                  <div className="font-semibold text-gray-700">🔍 Debug Info:</div>
                  <div><strong>Network:</strong> {network}</div>
                  <div><strong>User:</strong> {userAddress ? `${userAddress.slice(0, 10)}...` : 'null'}</div>
                  <div><strong>Comptroller:</strong> {comptrollerProxy ? `${comptrollerProxy.slice(0, 10)}...` : 'null'}</div>
                  <div><strong>Vault:</strong> {vaultProxy ? `${vaultProxy.slice(0, 10)}...` : 'null'}</div>
                  <div><strong>Vault Shares Decimals:</strong> {isDecimalsLoading ? 'Loading...' : vaultSharesDecimals ?? 'Error'}</div>
                  <div><strong>Shares to Redeem:</strong> {sharesToRedeem || 'empty'}</div>
                  <div><strong>Shares (BigInt):</strong> {sharesToRedeem && vaultSharesDecimals !== undefined ? parseUnits(sharesToRedeem, vaultSharesDecimals).toString() : 'N/A'}</div>
                  <div><strong>Valid Amount:</strong> {isValidAmount().toString()}</div>
                  <div><strong>Step:</strong> {currentStep}</div>
                  <div><strong>Connected:</strong> {isConnected.toString()}</div>
                  <div><strong>Has Vault Shares Decimals:</strong> {hasVaultSharesDecimals.toString()}</div>
                  <div><strong>Can Proceed:</strong> {canProceed.toString()}</div>
                </div>
              )}
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleCancel}
              variant="outline"
              className="flex-1 bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 py-3 rounded-lg"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={currentStep === 'success' ? onClose : handleRedeem}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-lg transition-colors"
              disabled={isButtonDisabled()}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {currentStep === 'success' ? 'Close' : getButtonText()}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}