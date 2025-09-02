// src/components/vault/DepositModal.tsx
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
import { Info, ChevronDown, ChevronUp, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { type Address, parseUnits, formatUnits, parseAbi } from "viem";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { writeContract, waitForTransactionReceipt } from "viem/actions";
// import { Asset, Depositor } from "@enzymefinance/sdk"; // 不再需要，使用現代 viem 方式
import { useSharesActionTimelock } from "@/lib/hooks/useSharesActionTimelock";
import { useExpectedSharesForDeposit } from "@/lib/hooks/useExpectedSharesForDeposit";
import { useTokenDecimals } from "@/lib/hooks/useTokenDecimals";
import { getNetworkByDeployment, type Network, type Deployment } from "@/lib/consts";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  vaultName: string;
  denominationAsset?: string;
  comptrollerProxy?: Address | null;
  denominationAssetAddress?: Address | null;
  deployment?: string;
}

type DepositStep = 'input' | 'approve' | 'deposit' | 'success' | 'failed';

export function DepositModal({
  isOpen,
  onClose,
  vaultName,
  denominationAsset = "USDC",
  comptrollerProxy,
  denominationAssetAddress,
  deployment = "testnet"
}: DepositModalProps) {
  // Form state
  const [amount, setAmount] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [maxSlippage, setMaxSlippage] = useState(1);

  // Transaction state
  const [currentStep, setCurrentStep] = useState<DepositStep>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Wallet hooks
  const { address: userAddress } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  // Network setup
  const network = getNetworkByDeployment(deployment as Deployment);

  // Data hooks
  const {
    data: sharesLockupTime,
    isLoading: isLockupLoading,
    error: lockupError
  } = useSharesActionTimelock({
    network,
    comptrollerProxy: comptrollerProxy!,
    enabled: !!comptrollerProxy
  });

  // Get token decimals for proper amount calculation
  const {
    data: tokenDecimals,
    isLoading: isDecimalsLoading,
    error: decimalsError
  } = useTokenDecimals({
    network,
    tokenAddress: denominationAssetAddress!,
    enabled: !!denominationAssetAddress
  });

  // 暫時註釋掉 expectedShares hook，先專注於基本的 deposit 功能
  // const { 
  //   data: expectedShares, 
  //   isLoading: isCalculatingShares 
  // } = useExpectedSharesForDeposit({
  //   network,
  //   comptrollerProxy: comptrollerProxy!,
  //   amount,
  //   depositor: userAddress!,
  //   decimals: 18,
  //   enabled: !!comptrollerProxy && !!userAddress && !!amount && parseFloat(amount) > 0
  // });

  // 暫時設為 null
  const expectedShares = null;
  const isCalculatingShares = false;

  // Reset modal state when it closes
  useEffect(() => {
    if (!isOpen) {
      setAmount("");
      setCurrentStep('input');
      setIsLoading(false);
      setTxHash("");
      setError("");
      setShowAdvanced(false);
    }
  }, [isOpen]);

  // Validation
  const isValidAmount = () => {
    const numAmount = parseFloat(amount);
    return !isNaN(numAmount) && numAmount > 0;
  };

  const isConnected = !!userAddress && !!walletClient;
  const hasRequiredData = !!comptrollerProxy && !!denominationAssetAddress;
  const hasTokenDecimals = tokenDecimals !== undefined && !isDecimalsLoading;
  const canProceed = isValidAmount() && isConnected && hasRequiredData && hasTokenDecimals;

  // Utility functions
  const formatLockupTime = (seconds?: number) => {
    if (isLockupLoading) return "Loading...";
    if (lockupError) return "Error loading";
    if (!seconds && seconds !== 0) return "3 seconds";

    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
    return `${Math.floor(seconds / 3600)} hours`;
  };

  const calculateMinShares = () => {
    // 暫時固定返回 1n，之後再處理計算
    return 1n;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError(""); // Clear errors when user types
    }
  };

  // Transaction handlers
  const handleApprove = async () => {
    // 增強驗證
    if (!walletClient) {
      setError("Wallet not connected");
      return;
    }
    if (!publicClient) {
      setError("Public client not available");
      return;
    }
    if (!denominationAssetAddress) {
      setError("Denomination asset address not found");
      return;
    }
    if (!comptrollerProxy) {
      setError("Comptroller proxy address not found");
      return;
    }
    if (!amount) {
      setError("Amount is required");
      return;
    }
    if (tokenDecimals === undefined) {
      setError("Token decimals not loaded");
      return;
    }

    try {
      setIsLoading(true);
      setCurrentStep('approve');
      setError("");

      // 使用正確的小數位數
      const amountBigInt = parseUnits(amount, tokenDecimals);

      console.log("[DepositModal] Starting approval with correct decimals:", {
        asset: denominationAssetAddress,
        amount: amountBigInt.toString(),
        decimals: tokenDecimals,
        inputAmount: amount,
        spender: comptrollerProxy,
        from: userAddress
      });

      // Send approval transaction
      const hash = await writeContract(walletClient, {
        address: denominationAssetAddress,
        abi: parseAbi(['function approve(address spender, uint256 amount) returns (bool)']),
        functionName: 'approve',
        args: [comptrollerProxy, amountBigInt],
      });

      console.log("[DepositModal] Approval transaction sent:", hash);
      setTxHash(hash);

      // Wait for approval confirmation
      console.log("[DepositModal] Waiting for approval confirmation...");
      const receipt = await waitForTransactionReceipt(publicClient, {
        hash,
        confirmations: 1,
      });

      console.log("[DepositModal] Approval receipt:", receipt);

      // Check approval status
      if (receipt.status === 'success') {
        console.log("[DepositModal] ✅ Approval successful!");
        // Move to deposit step
        setCurrentStep('deposit');
      } else {
        console.error("[DepositModal] ❌ Approval failed - receipt status:", receipt.status);
        setError("Approval failed. Please try again.");
        setCurrentStep('failed');
      }

    } catch (err: any) {
      console.error("[DepositModal] Approval error:", err);
      
      // Handle different types of errors
      let errorMessage = "Approval failed";
      
      if (err.message) {
        if (err.message.includes('User rejected')) {
          errorMessage = "Approval was rejected by user";
        } else if (err.message.includes('insufficient funds')) {
          errorMessage = "Insufficient funds for approval";
        } else if (err.message.includes('execution reverted')) {
          errorMessage = "Approval failed - contract execution reverted";
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setCurrentStep('failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeposit = async () => {
    // 增強驗證
    if (!walletClient) {
      setError("Wallet not connected");
      return;
    }
    if (!publicClient) {
      setError("Public client not available");
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
    if (!amount) {
      setError("Amount is required");
      return;
    }
    if (tokenDecimals === undefined) {
      setError("Token decimals not loaded");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      // 使用正確的小數位數
      const amountBigInt = parseUnits(amount, tokenDecimals);

      console.log("[DepositModal] Starting deposit with correct decimals:", {
        comptrollerProxy,
        amount: amountBigInt.toString(),
        decimals: tokenDecimals,
        inputAmount: amount,
        depositor: userAddress,
        minSharesQuantity: "1"
      });

      // Send the transaction
      const hash = await writeContract(walletClient, {
        address: comptrollerProxy,
        abi: parseAbi(['function buyShares(uint256 investmentAmount, uint256 minSharesQuantity) returns (uint256)']),
        functionName: 'buyShares',
        args: [amountBigInt, 1n],
      });

      console.log("[DepositModal] Deposit transaction sent:", hash);
      setTxHash(hash);

      // Wait for transaction confirmation
      console.log("[DepositModal] Waiting for transaction confirmation...");
      const receipt = await waitForTransactionReceipt(publicClient, {
        hash,
        confirmations: 1,
      });

      console.log("[DepositModal] Transaction receipt:", receipt);

      // Check transaction status
      if (receipt.status === 'success') {
        console.log("[DepositModal] ✅ Deposit successful!");
        setCurrentStep('success');
        
        // Auto-close after 3 seconds
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        console.error("[DepositModal] ❌ Transaction failed - receipt status:", receipt.status);
        setError("Transaction failed. Please check the transaction on block explorer.");
        setCurrentStep('failed');
      }

    } catch (err: any) {
      console.error("[DepositModal] Deposit error:", err);
      
      // Handle different types of errors
      let errorMessage = "Deposit failed";
      
      if (err.message) {
        if (err.message.includes('User rejected')) {
          errorMessage = "Transaction was rejected by user";
        } else if (err.message.includes('insufficient funds')) {
          errorMessage = "Insufficient funds for transaction";
        } else if (err.message.includes('execution reverted')) {
          errorMessage = "Transaction failed - contract execution reverted";
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setCurrentStep('failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (currentStep === 'input') {
      await handleApprove();
    } else if (currentStep === 'deposit') {
      await handleDeposit();
    } else if (currentStep === 'failed') {
      // Reset to input step for retry
      setCurrentStep('input');
      setError("");
      setTxHash("");
    }
  };

  // Button state
  const getButtonText = () => {
    if (!isConnected) return "Connect Wallet";
    if (isDecimalsLoading) return "Loading Token Info...";
    if (!hasTokenDecimals) return "Unable to Load Token Info";
    if (!isValidAmount()) return "Enter Amount";
    if (currentStep === 'approve' && isLoading) return "Approving...";
    if (currentStep === 'deposit' && isLoading) return "Confirming Deposit...";
    if (currentStep === 'success') return "Success!";
    if (currentStep === 'failed') return "Try Again";
    if (currentStep === 'deposit') return `Deposit ${amount} ${denominationAsset}`;
    return `Approve ${amount} ${denominationAsset}`;
  };

  const isButtonDisabled = () => {
    if (!canProceed && currentStep !== 'failed') return true;
    if (isLoading) return true;
    if (currentStep === 'success') return true;
    return false;
  };

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log("[DepositModal Debug]", {
      network,
      userAddress,
      comptrollerProxy,
      denominationAssetAddress,
      amount,
      currentStep,
      isConnected,
      hasRequiredData,
      canProceed,
      // 驗證地址格式
      comptrollerValid: comptrollerProxy ? (comptrollerProxy.startsWith('0x') && comptrollerProxy.length === 42) : false,
      assetValid: denominationAssetAddress ? (denominationAssetAddress.startsWith('0x') && denominationAssetAddress.length === 42) : false,
      userValid: userAddress ? (userAddress.startsWith('0x') && userAddress.length === 42) : false
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white text-gray-900 border-gray-200 rounded-xl">
        {/* Header */}
        <DialogHeader className="relative">
          <DialogTitle className="text-xl font-semibold text-center text-gray-900">
            Deposit
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Success State */}
          {currentStep === 'success' && (
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-green-700">Deposit Successful!</h3>
                <p className="text-sm text-gray-600">
                  Your {amount} {denominationAsset} has been deposited successfully.
                </p>
                {txHash && (
                  <p className="text-xs text-gray-500 mt-2 break-all font-mono">
                    Tx: {txHash}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Failed State */}
          {currentStep === 'failed' && (
            <div className="text-center space-y-4">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-red-700">Deposit Failed</h3>
                <p className="text-sm text-gray-600">
                  {error || "The deposit transaction failed. Please try again."}
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
          {currentStep !== 'success' && currentStep !== 'failed' && (
            <>
              <p className="text-gray-600 text-sm">
                Choose amount to deposit:
              </p>

              {/* Amount Input */}
              <div className="space-y-2">
                <Label className="text-gray-700 text-sm">Amount</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="text"
                      value={amount}
                      onChange={handleAmountChange}
                      placeholder="0.0"
                      className="bg-white border-gray-300 text-gray-900 text-lg h-12"
                      disabled={currentStep !== 'input'}
                    />

                    {/* Error message */}
                    {error ? (
                      <p className="text-red-500 text-xs mt-1">{error}</p>
                    ) : null}

                    {/* Validation message */}
                    {!error && amount !== "" && !isValidAmount() ? (
                      <p className="text-red-500 text-xs mt-1">
                        Please enter a valid amount greater than 0
                      </p>
                    ) : null}

                    {/* Helper text */}
                    {!error && amount === "" ? (
                      <p className="text-gray-400 text-xs mt-1">
                        Enter the amount you want to deposit
                      </p>
                    ) : null}

                    {/* Expected shares - 暫時禁用 */}
                    {/* {!error && expectedShares && amount && isValidAmount() ? (
                      <p className="text-blue-600 text-xs mt-1">
                        Expected: {formatUnits(expectedShares, 18)} shares
                        {isCalculatingShares ? " (calculating...)" : ""}
                      </p>
                    ) : null} */}
                  </div>

                  {/* Token Display */}
                  <div className="w-20 h-12 bg-gray-100 border border-gray-300 rounded-md flex items-center justify-center">
                    <span className="text-gray-700 font-medium text-sm">{denominationAsset}</span>
                  </div>
                </div>
              </div>

              {/* Shares Lock-Up Time */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-gray-700 text-sm">Shares Lock-Up Time</Label>
                  <Info className="h-4 w-4 text-gray-400" />
                </div>
                <span className="text-gray-600 text-sm">{formatLockupTime(sharesLockupTime)}</span>
              </div>

              {/* Transaction Progress */}
              {(currentStep === 'approve' || currentStep === 'deposit') && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <div>
                      <p className="text-blue-700 font-medium">
                        {currentStep === 'approve' && "Approval in progress..."}
                        {currentStep === 'deposit' && "Deposit in progress..."}
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

              {/* Advanced Settings */}
              <div className="space-y-3">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-gray-600 text-sm hover:text-gray-900 transition-colors"
                  disabled={currentStep !== 'input'}
                >
                  <span>Advanced Settings</span>
                  {showAdvanced ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {showAdvanced && (
                  <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                    <div className="space-y-2">
                      <Label className="text-gray-700 text-sm">Maximum Slippage (%)</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="number"
                          value={maxSlippage}
                          onChange={(e) => setMaxSlippage(parseInt(e.target.value) || 1)}
                          min="1"
                          max="50"
                          className="w-20 bg-white border-gray-300 text-gray-900 text-center"
                          disabled={currentStep !== 'input'}
                        />
                        <span className="text-gray-600 text-sm">%</span>
                      </div>
                      <p className="text-gray-500 text-xs">
                        Your transaction will revert if the price changes unfavorably by more than this percentage.
                      </p>
                      {/* Minimum shares - 暫時禁用 */}
                      {/* {expectedShares ? (
                        <p className="text-gray-600 text-xs">
                          Minimum shares: {formatUnits(calculateMinShares(), 18)}
                        </p>
                      ) : null} */}
                    </div>
                  </div>
                )}
              </div>

              {/* Debug Info - Development Only */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-gray-50 p-3 rounded text-xs space-y-1">
                <div className="font-semibold text-gray-700">🔍 Debug Info:</div>
                <div><strong>Network:</strong> {network}</div>
                <div><strong>User:</strong> {userAddress ? `${userAddress.slice(0, 10)}...` : 'null'}</div>
                <div><strong>Comptroller:</strong> {comptrollerProxy ? `${comptrollerProxy.slice(0, 10)}...` : 'null'}</div>
                <div><strong>Asset:</strong> {denominationAssetAddress ? `${denominationAssetAddress.slice(0, 10)}...` : 'null'}</div>
                <div><strong>Token Decimals:</strong> {isDecimalsLoading ? 'Loading...' : tokenDecimals ?? 'Error'}</div>
                <div><strong>Amount:</strong> {amount || 'empty'}</div>
                <div><strong>Amount (BigInt):</strong> {amount && tokenDecimals !== undefined ? parseUnits(amount, tokenDecimals).toString() : 'N/A'}</div>
                <div><strong>Valid Amount:</strong> {isValidAmount().toString()}</div>
                <div><strong>Step:</strong> {currentStep}</div>
                <div><strong>Connected:</strong> {isConnected.toString()}</div>
                <div><strong>Has Token Decimals:</strong> {hasTokenDecimals.toString()}</div>
                <div><strong>Can Proceed:</strong> {canProceed.toString()}</div>
                  <div><strong>Comptroller Valid:</strong> {comptrollerProxy ? (comptrollerProxy.startsWith('0x') && comptrollerProxy.length === 42).toString() : 'null'}</div>
                    <div><strong>Asset Valid:</strong> {denominationAssetAddress ? (denominationAssetAddress.startsWith('0x') && denominationAssetAddress.length === 42).toString() : 'null'}</div>
                    <div><strong>User Valid:</strong> {userAddress ? (userAddress.startsWith('0x') && userAddress.length === 42).toString() : 'null'}</div>
                  </div>
              )}
            </>
          )}

          {/* Action Button */}
          <div className="pt-4">
            <Button
              onClick={currentStep === 'success' ? onClose : handleSubmit}
              className={`w-full py-3 rounded-lg transition-colors ${
                currentStep === 'failed' 
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : currentStep === 'success'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } disabled:bg-gray-300 disabled:cursor-not-allowed`}
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