// src/lib/hooks/useUniswapQuote.ts
import { useState, useEffect, useCallback } from 'react';
import { type Address, type PublicClient } from 'viem';
import { usePublicClient } from 'wagmi';
import { type Deployment } from '@/lib/consts';
import { 
  createUniswapQuoteService, 
  type UniswapQuote, 
  type QuoteParams 
} from '@/lib/uniswap/quote-service';

interface UseUniswapQuoteParams {
  tokenIn: Address;
  tokenOut: Address;
  tokenInDecimals: number;
  tokenOutDecimals: number;
  tokenInSymbol: string;
  tokenOutSymbol: string;
  deployment: Deployment;
  slippagePercent?: number;
  enabled?: boolean;
}

interface UseUniswapQuoteReturn {
  quote: UniswapQuote | null;
  isLoading: boolean;
  error: Error | null;
  refetch: (amountIn: string) => Promise<void>;
  getQuote: (amountIn: string) => Promise<UniswapQuote | null>;
  getReverseQuote: (amountOut: string) => Promise<UniswapQuote | null>;
}

export function useUniswapQuote({
  tokenIn,
  tokenOut,
  tokenInDecimals,
  tokenOutDecimals,
  tokenInSymbol,
  tokenOutSymbol,
  deployment,
  slippagePercent = 0.5,
  enabled = true
}: UseUniswapQuoteParams): UseUniswapQuoteReturn {
  const [quote, setQuote] = useState<UniswapQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const publicClient = usePublicClient();

  const getQuote = useCallback(async (amountIn: string): Promise<UniswapQuote | null> => {
    if (!publicClient || !enabled || !amountIn || parseFloat(amountIn) <= 0) {
      return null;
    }

    // Validate token addresses
    if (tokenIn === '0x0000000000000000000000000000000000000000' || 
        tokenOut === '0x0000000000000000000000000000000000000000' ||
        tokenIn === tokenOut) {
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const quoteService = createUniswapQuoteService(publicClient, deployment);
      
      const quoteParams: QuoteParams = {
        tokenIn,
        tokenOut,
        amountIn,
        slippagePercent,
        tokenInDecimals,
        tokenOutDecimals,
        tokenInSymbol,
        tokenOutSymbol
      };

      const result = await quoteService.getQuote(quoteParams);
      setQuote(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get quote');
      setError(error);
      console.error('Quote error:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [
    publicClient,
    enabled,
    tokenIn,
    tokenOut,
    tokenInDecimals,
    tokenOutDecimals,
    tokenInSymbol,
    tokenOutSymbol,
    deployment,
    slippagePercent
  ]);

  const getReverseQuote = useCallback(async (amountOut: string): Promise<UniswapQuote | null> => {
    if (!publicClient || !enabled || !amountOut || parseFloat(amountOut) <= 0) {
      return null;
    }

    // Validate token addresses
    if (tokenIn === '0x0000000000000000000000000000000000000000' || 
        tokenOut === '0x0000000000000000000000000000000000000000' ||
        tokenIn === tokenOut) {
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const quoteService = createUniswapQuoteService(publicClient, deployment);
      
      const quoteParams = {
        tokenIn,
        tokenOut,
        amountIn: '0', // Not used in reverse quote
        amountOut,
        slippagePercent,
        tokenInDecimals,
        tokenOutDecimals,
        tokenInSymbol,
        tokenOutSymbol
      };

      const result = await quoteService.getReverseQuote(quoteParams);
      setQuote(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get reverse quote');
      setError(error);
      console.error('Reverse quote error:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [
    publicClient,
    enabled,
    tokenIn,
    tokenOut,
    tokenInDecimals,
    tokenOutDecimals,
    tokenInSymbol,
    tokenOutSymbol,
    deployment,
    slippagePercent
  ]);

  const refetch = useCallback(async (amountIn: string) => {
    await getQuote(amountIn);
  }, [getQuote]);

  return {
    quote,
    isLoading,
    error,
    refetch,
    getQuote,
    getReverseQuote
  };
}

/**
 * Hook with debounced quote fetching for input fields
 */
export function useDebouncedUniswapQuote({
  tokenIn,
  tokenOut,
  tokenInDecimals,
  tokenOutDecimals,
  tokenInSymbol,
  tokenOutSymbol,
  deployment,
  amountIn,
  slippagePercent = 0.5,
  enabled = true,
  debounceMs = 500
}: UseUniswapQuoteParams & {
  amountIn: string;
  debounceMs?: number;
}): UseUniswapQuoteReturn {
  const quoteHook = useUniswapQuote({
    tokenIn,
    tokenOut,
    tokenInDecimals,
    tokenOutDecimals,
    tokenInSymbol,
    tokenOutSymbol,
    deployment,
    slippagePercent,
    enabled
  });

  // Debounced effect for automatic quote fetching
  useEffect(() => {
    if (!enabled || !amountIn || parseFloat(amountIn) <= 0) {
      quoteHook.getQuote('0');
      return;
    }

    const timeoutId = setTimeout(() => {
      quoteHook.getQuote(amountIn);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [amountIn, enabled, debounceMs, quoteHook.getQuote]);

  return quoteHook;
}
