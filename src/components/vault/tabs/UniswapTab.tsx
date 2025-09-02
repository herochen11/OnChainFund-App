// src/components/vault/tabs/UniswapTab.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { ArrowUpDown, Settings, Info, Zap, TrendingUp, Clock, Loader2, AlertTriangle, DollarSign, Droplets } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { type Address, formatUnits, parseUnits } from "viem";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { type Deployment, getContract } from "@/lib/consts";
import { getAssetDecimals, getAssetSymbol } from "@/lib/assets";
import { useDebouncedUniswapQuote } from "@/lib/hooks/useUniswapQuote";
import { debugPoolIssue } from "@/lib/uniswap/debug-pool";
import { executeUniswapSwap } from '@/lib/uniswap';
import { CUSTOM_SEPOLIA_ENVIRONMENT as environment } from '@/config/sepolia-environment';

interface UniswapTabProps {
  vault: Address;
  deployment: Deployment;
  comptrollerProxy?: Address | null;
  denominationAsset?: Address | null;
}

interface TokenBalance {
  address: Address;
  symbol: string;
  balance: bigint;
  decimals: number;
  formattedBalance: string;
}

// Remove the old SwapQuote interface - we're using the one from the quote service

export function UniswapTab({
  vault,
  deployment,
  comptrollerProxy,
  denominationAsset
}: UniswapTabProps) {
  // State
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [isSwapReversed, setIsSwapReversed] = useState(false);
  const [slippage, setSlippage] = useState('0.5');
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Balances state
  const [denominationBalance, setDenominationBalance] = useState<TokenBalance | null>(null);
  const [wethBalance, setWethBalance] = useState<TokenBalance | null>(null);
  const [isLoadingBalances, setIsLoadingBalances] = useState(true);

  // Hooks
  const { address: userAddress } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  // Get token addresses
  const wethAddress = getContract(deployment, "WETH");

  // Determine from/to tokens based on swap direction
  const fromToken = isSwapReversed ? wethBalance : denominationBalance;
  const toToken = isSwapReversed ? denominationBalance : wethBalance;

  // Real Uniswap V2 quote integration
  const {
    quote: swapQuote,
    isLoading: isQuoteLoading,
    error: quoteError,
    getQuote
  } = useDebouncedUniswapQuote({
    tokenIn: fromToken?.address || '0x0000000000000000000000000000000000000000',
    tokenOut: toToken?.address || '0x0000000000000000000000000000000000000000',
    tokenInDecimals: fromToken?.decimals || 18,
    tokenOutDecimals: toToken?.decimals || 18,
    tokenInSymbol: fromToken?.symbol || '',
    tokenOutSymbol: toToken?.symbol || '',
    deployment,
    amountIn: fromAmount,
    slippagePercent: parseFloat(slippage) || 0.5,
    enabled: !!(fromToken && toToken && fromAmount && parseFloat(fromAmount) > 0),
    debounceMs: 500
  });



  // Fetch vault token balances
  useEffect(() => {
    async function fetchVaultBalances() {
      if (!vault || !denominationAsset || !publicClient) return;

      try {
        setIsLoadingBalances(true);
        console.log('Fetching vault balances for:', { vault, denominationAsset, wethAddress });

        // Add timeout and retry logic
        const timeout = (ms: number) => new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), ms)
        );

        const fetchWithTimeout = async (contractCall: Promise<any>, timeoutMs = 10000) => {
          return Promise.race([contractCall, timeout(timeoutMs)]);
        };

        // Get denomination asset balance with timeout
        const denomBalance = await fetchWithTimeout(
          publicClient.readContract({
            address: denominationAsset,
            abi: [
              {
                name: 'balanceOf',
                type: 'function',
                stateMutability: 'view',
                inputs: [{ name: 'account', type: 'address' }],
                outputs: [{ type: 'uint256' }],
              },
            ],
            functionName: 'balanceOf',
            args: [vault],
          })
        );

        // Get WETH balance with timeout
        const wethBal = await fetchWithTimeout(
          publicClient.readContract({
            address: wethAddress,
            abi: [
              {
                name: 'balanceOf',
                type: 'function',
                stateMutability: 'view',
                inputs: [{ name: 'account', type: 'address' }],
                outputs: [{ type: 'uint256' }],
              },
            ],
            functionName: 'balanceOf',
            args: [vault],
          })
        );

        // Get token info
        const denomDecimals = getAssetDecimals(denominationAsset, deployment);
        const denomSymbol = getAssetSymbol(denominationAsset, deployment);
        const wethDecimals = getAssetDecimals(wethAddress, deployment);
        const wethSymbol = getAssetSymbol(wethAddress, deployment);

        setDenominationBalance({
          address: denominationAsset,
          symbol: denomSymbol,
          balance: denomBalance as bigint,
          decimals: denomDecimals,
          formattedBalance: formatUnits(denomBalance as bigint, denomDecimals),
        });

        setWethBalance({
          address: wethAddress,
          symbol: wethSymbol,
          balance: wethBal as bigint,
          decimals: wethDecimals,
          formattedBalance: formatUnits(wethBal as bigint, wethDecimals),
        });

        console.log('Successfully fetched balances:', {
          denomBalance: denomBalance?.toString(),
          wethBal: wethBal?.toString()
        });

      } catch (error) {
        console.error("Failed to fetch vault balances:", error);

        // Set empty balances on error so UI doesn't break
        setDenominationBalance({
          address: denominationAsset,
          symbol: getAssetSymbol(denominationAsset, deployment),
          balance: BigInt(0),
          decimals: getAssetDecimals(denominationAsset, deployment),
          formattedBalance: '0',
        });

        setWethBalance({
          address: wethAddress,
          symbol: getAssetSymbol(wethAddress, deployment),
          balance: BigInt(0),
          decimals: getAssetDecimals(wethAddress, deployment),
          formattedBalance: '0',
        });
      } finally {
        setIsLoadingBalances(false);
      }
    }

    fetchVaultBalances();
  }, [vault, denominationAsset, deployment, wethAddress, publicClient]);

  // Remove the old mock quote calculation effect since we're using the real quote hook

  const handleSwapTokens = () => {
    setIsSwapReversed(!isSwapReversed);
    setFromAmount('');
    setToAmount('');
  };

  const handleMaxClick = () => {
    if (fromToken) {
      setFromAmount(fromToken.formattedBalance);
    }
  };

  const handleSwap = async () => {
    if (!swapQuote || !fromToken || !toToken || !comptrollerProxy || !userAddress || !walletClient || !publicClient) {
      console.error('Missing required data for swap');
      return;
    }

    try {
      console.log('Executing swap:', {
        from: fromToken.symbol,
        to: toToken.symbol,
        amount: fromAmount,
        quote: swapQuote,
        vault,
        comptrollerProxy,
      });

      const result = await executeUniswapSwap({
        // From config
        comptrollerProxy: comptrollerProxy,
        integrationManager: environment.contracts.integrationManager,
        uniswapAdapter: environment.contracts.uniswapV2Adapter,

        // From component state/props
        tokenIn: fromToken.address,
        tokenOut: toToken.address,
        amountIn: fromAmount,
        amountInDecimals: fromToken.decimals,
        minAmountOut: swapQuote.minimumReceivedFormatted,
        minAmountOutDecimals: toToken.decimals,

        // From wagmi
        walletClient,
        publicClient,
        userAddress: userAddress || '0x0000000000000000000000000000000000000000'
      });

      if (result.success) {
        alert(`Swap executed successfully!\nTransaction: ${result.hash}\n${fromAmount} ${fromToken.symbol} → ${swapQuote.amountOutFormatted} ${toToken.symbol}`);

        // Reset form
        setFromAmount('');
        setToAmount('');

        // TODO: Refresh vault balances after successful swap
        // You might want to call fetchVaultBalances() here
      } else {
        alert(`Swap failed: ${result.error}`);
      }

    } catch (error) {
      console.error('Swap failed:', error);
      alert(`Swap failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const isValidSwap = fromAmount &&
    parseFloat(fromAmount) > 0 &&
    swapQuote &&
    swapQuote.isValidPair &&
    fromToken &&
    toToken &&
    !isQuoteLoading;
  const fromBalance = fromToken?.formattedBalance || '0';
  const toBalance = toToken?.formattedBalance || '0';

  if (isLoadingBalances) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading vault balances...</p>
        </CardContent>
      </Card>
    );
  }

  if (!denominationBalance || !wethBalance) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-8 text-center">
          <p className="text-red-600 mb-2">Failed to load vault balances</p>
          <p className="text-gray-600 text-sm mb-4">This might be due to network issues or RPC timeout</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Swap (Vault Assets)</h2>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Settings className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Settings Panel */}
          {showSettings && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="font-medium text-gray-900">Settings</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slippage Tolerance
                </label>
                <div className="flex gap-2">
                  {['0.1', '0.5', '1.0'].map((value) => (
                    <button
                      key={value}
                      onClick={() => setSlippage(value)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${slippage === value
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      {value}%
                    </button>
                  ))}
                  <Input
                    type="text"
                    value={slippage}
                    onChange={(e) => setSlippage(e.target.value)}
                    className="w-16 h-8 text-sm text-center"
                    placeholder="Custom"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Debug Section - Remove this after fixing */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-yellow-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-yellow-800 mb-2">
                <Info className="h-4 w-4" />
                <span>Debug Pool Issue</span>
              </div>
              <Button
                onClick={async () => {
                  if (publicClient && denominationAsset) {
                    await debugPoolIssue(publicClient, getContract(deployment, "ASVT"), wethAddress);
                  }
                }}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Check Pool Addresses
              </Button>
            </div>
          )}

          {/* Vault Info */}
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Info className="h-4 w-4" />
              <span>Trading with vault assets at {vault.slice(0, 6)}...{vault.slice(-4)}</span>
            </div>
          </div>

          {/* From Token */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">From</span>
              <span className="text-sm text-gray-500">
                Vault Balance: {parseFloat(fromBalance).toFixed(6)} {fromToken?.symbol}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200">
                <div className={`w-6 h-6 rounded-full ${fromToken?.symbol.includes('USDC') ? 'bg-blue-500' :
                  fromToken?.symbol.includes('DAI') ? 'bg-yellow-500' :
                    'bg-gray-800'
                  }`}></div>
                <span className="font-semibold text-gray-900">{fromToken?.symbol}</span>
              </div>

              <div className="flex-1">
                <Input
                  type="text"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  placeholder="0.0"
                  className="text-right text-xl font-semibold bg-transparent border-none shadow-none p-0 h-auto"
                />
              </div>
            </div>

            <div className="flex justify-end mt-2">
              <button
                onClick={handleMaxClick}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                MAX
              </button>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <button
              onClick={handleSwapTokens}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border-4 border-white shadow-sm"
            >
              <ArrowUpDown className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* To Token */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">To</span>
              <span className="text-sm text-gray-500">
                Vault Balance: {parseFloat(toBalance).toFixed(6)} {toToken?.symbol}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200">
                <div className={`w-6 h-6 rounded-full ${toToken?.symbol.includes('USDC') ? 'bg-blue-500' :
                  toToken?.symbol.includes('DAI') ? 'bg-yellow-500' :
                    'bg-gray-800'
                  }`}></div>
                <span className="font-semibold text-gray-900">{toToken?.symbol}</span>
              </div>

              <div className="flex-1">
                <Input
                  type="text"
                  value={toAmount || (swapQuote?.isValidPair ? swapQuote.amountOutFormatted : '')}
                  onChange={(e) => setToAmount(e.target.value)}
                  placeholder={isQuoteLoading ? "Loading..." : "0.0"}
                  className="text-right text-xl font-semibold bg-transparent border-none shadow-none p-0 h-auto text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Exchange Rate Info */}
          {swapQuote && swapQuote.isValidPair && (
            <div className="bg-blue-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Exchange Rate</span>
                <span className="font-medium text-gray-900">{swapQuote.exchangeRate}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Price Impact
                </span>
                <span className={`font-medium ${swapQuote.priceImpact > 5 ? 'text-red-600' :
                  swapQuote.priceImpact > 1 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                  {swapQuote.priceImpact.toFixed(2)}%
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Minimum Received</span>
                <span className="font-medium text-gray-900">
                  {swapQuote.minimumReceivedFormatted} {toToken?.symbol}
                </span>
              </div>
            </div>
          )}

          {/* Liquidity Information */}
          {swapQuote && swapQuote.isValidPair && swapQuote.liquidityInfo && (
            <div className="bg-green-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-green-800 mb-2">
                <Droplets className="h-4 w-4" />
                <span>Pool Liquidity</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white rounded-lg p-2">
                  <div className="text-gray-500 mb-1">{swapQuote.liquidityInfo.token0Symbol}</div>
                  <div className="font-medium text-gray-900">
                    {parseFloat(swapQuote.liquidityInfo.reserve0Formatted).toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                      minimumFractionDigits: 0
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-2">
                  <div className="text-gray-500 mb-1">{swapQuote.liquidityInfo.token1Symbol}</div>
                  <div className="font-medium text-gray-900">
                    {parseFloat(swapQuote.liquidityInfo.reserve1Formatted).toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                      minimumFractionDigits: 0
                    })}
                  </div>
                </div>
              </div>

              {swapQuote.liquidityInfo.totalLiquidityUSD && (
                <div className="flex items-center justify-between text-sm pt-1 border-t border-green-200">
                  <span className="text-gray-600 flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Total Liquidity
                  </span>
                  <span className="font-medium text-gray-900">
                    ${swapQuote.liquidityInfo.totalLiquidityUSD.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Error/Warning Messages */}
          {quoteError && (
            <div className="bg-red-50 rounded-lg p-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">Failed to get quote: {quoteError.message}</span>
            </div>
          )}

          {swapQuote && !swapQuote.isValidPair && fromAmount && parseFloat(fromAmount) > 0 && (
            <div className="bg-yellow-50 rounded-lg p-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-700">
                No liquidity pool found for {fromToken?.symbol}/{toToken?.symbol} pair
              </span>
            </div>
          )}

          {/* Swap Button */}
          <Button
            onClick={handleSwap}
            disabled={!isValidSwap || isLoading || isQuoteLoading || !swapQuote?.isValidPair}
            className="w-full py-6 text-lg font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Swapping...
              </>
            ) : isQuoteLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Getting Quote...
              </>
            ) : !fromAmount ? (
              'Enter Amount'
            ) : !swapQuote?.isValidPair ? (
              'No Liquidity Pool'
            ) : (
              'Execute Swap'
            )}
          </Button>

          {/* Additional Info */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Zap className="h-4 w-4" />
              <span>Powered by Uniswap V2</span>
            </div>

            <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>Vault Trading</span>
              </div>
              <div className="flex items-center gap-1">
                <Info className="h-3 w-3" />
                <span>Pool Funds</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
