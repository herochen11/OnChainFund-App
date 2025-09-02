// src/lib/uniswap/quote-service.ts
import { type Address, type PublicClient, parseUnits, formatUnits } from 'viem';
import { type Deployment } from '@/lib/consts';

// Constants
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

// Uniswap V2 Router contract address (Sepolia testnet)
const UNISWAP_V2_ROUTER_ADDRESS: Address = '0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3';

// Uniswap V2 Factory contract address (Sepolia testnet)
const UNISWAP_V2_FACTORY_ADDRESS: Address = '0xF62c03E08ada871A0bEb309762E260a7a6a880E6';

// Uniswap V2 Router ABI (minimal)
const UNISWAP_V2_ROUTER_ABI = [
  {
    name: 'getAmountsOut',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'path', type: 'address[]' }
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }]
  },
  {
    name: 'getAmountsIn',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'amountOut', type: 'uint256' },
      { name: 'path', type: 'address[]' }
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }]
  }
] as const;

// Uniswap V2 Factory ABI (minimal)
const UNISWAP_V2_FACTORY_ABI = [
  {
    name: 'getPair',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' }
    ],
    outputs: [{ name: 'pair', type: 'address' }]
  }
] as const;

// Uniswap V2 Pair ABI (minimal)
const UNISWAP_V2_PAIR_ABI = [
  {
    name: 'getReserves',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'reserve0', type: 'uint112' },
      { name: 'reserve1', type: 'uint112' },
      { name: 'blockTimestampLast', type: 'uint32' }
    ]
  },
  {
    name: 'token0',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }]
  },
  {
    name: 'token1',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }]
  }
] as const;

export interface UniswapQuote {
  amountOut: bigint;
  amountOutFormatted: string;
  priceImpact: number;
  exchangeRate: string;
  minimumReceived: bigint;
  minimumReceivedFormatted: string;
  path: Address[];
  isValidPair: boolean;
  liquidityInfo?: {
    reserve0: bigint;
    reserve1: bigint;
    reserve0Formatted: string;
    reserve1Formatted: string;
    token0Symbol: string;
    token1Symbol: string;
    totalLiquidityUSD?: number;
  };
  // Additional fields for reverse quotes
  amountIn?: bigint;
  amountInFormatted?: string;
  maximumInput?: bigint;
  maximumInputFormatted?: string;
}

export interface QuoteParams {
  tokenIn: Address;
  tokenOut: Address;
  amountIn: string;
  slippagePercent: number;
  tokenInDecimals: number;
  tokenOutDecimals: number;
  tokenInSymbol: string;
  tokenOutSymbol: string;
}

export class UniswapV2QuoteService {
  constructor(
    private publicClient: PublicClient,
    private deployment: Deployment
  ) { }

  /**
   * Get reverse quote (calculate input amount needed for desired output)
   */
  async getReverseQuote(params: QuoteParams & { amountOut: string }): Promise<UniswapQuote | null> {
    const {
      tokenIn,
      tokenOut,
      amountOut,
      slippagePercent,
      tokenInDecimals,
      tokenOutDecimals,
      tokenInSymbol,
      tokenOutSymbol
    } = params;

    try {
      // Validate inputs
      if (!amountOut || parseFloat(amountOut) <= 0) {
        return null;
      }

      // Validate token addresses
      if (tokenIn === tokenOut) {
        console.warn('Cannot swap identical tokens');
        return this.createErrorQuote(params);
      }

      // Check if pair exists
      const pairExists = await this.checkPairExists(tokenIn, tokenOut);
      if (!pairExists) {
        console.warn(`No Uniswap V2 pair found for ${tokenInSymbol}/${tokenOutSymbol}`);
        return this.createErrorQuote(params);
      }

      // Parse output amount
      const amountOutWei = parseUnits(amountOut, tokenOutDecimals);
      
      // Get swap path
      const path = [tokenIn, tokenOut];

      // Get amounts in from Uniswap V2 router (reverse quote)
      const amountsIn = await this.publicClient.readContract({
        address: this.getRouterAddress(),
        abi: [
          {
            name: 'getAmountsIn',
            type: 'function',
            stateMutability: 'view',
            inputs: [
              { name: 'amountOut', type: 'uint256' },
              { name: 'path', type: 'address[]' }
            ],
            outputs: [{ name: 'amounts', type: 'uint256[]' }]
          }
        ],
        functionName: 'getAmountsIn',
        args: [amountOutWei, path]
      }) as bigint[];

      if (!amountsIn || amountsIn.length < 2) {
        throw new Error('Invalid response from Uniswap router');
      }

      const amountIn = amountsIn[0];
      const amountInFormatted = formatUnits(amountIn, tokenInDecimals);

      // Calculate price impact and get liquidity info
      const { priceImpact, liquidityInfo } = await this.calculatePriceImpactAndLiquidity(
        tokenIn,
        tokenOut,
        amountIn,
        amountOutWei,
        tokenInDecimals,
        tokenOutDecimals,
        tokenInSymbol,
        tokenOutSymbol
      );

      // Calculate maximum input with slippage (user pays up to this much)
      const slippageMultiplier = BigInt(Math.floor((1 + slippagePercent / 100) * 10000));
      const maximumInput = (amountIn * slippageMultiplier) / BigInt(10000);
      const maximumInputFormatted = formatUnits(maximumInput, tokenInDecimals);

      // Calculate exchange rate
      const rate = parseFloat(amountOut) / parseFloat(amountInFormatted);
      const exchangeRate = `1 ${tokenInSymbol} = ${rate.toFixed(6)} ${tokenOutSymbol}`;

      return {
        amountOut: amountOutWei,
        amountOutFormatted: amountOut,
        priceImpact,
        exchangeRate,
        minimumReceived: amountOutWei, // Exact output, so minimum = amount
        minimumReceivedFormatted: amountOut,
        path,
        isValidPair: true,
        liquidityInfo,
        // Additional fields for reverse quotes
        amountIn,
        amountInFormatted,
        maximumInput,
        maximumInputFormatted
      };

    } catch (error) {
      console.error('Error getting reverse Uniswap quote:', {
        error,
        params: {
          tokenIn: params.tokenIn,
          tokenOut: params.tokenOut,
          amountOut: params.amountOut,
          deployment: this.deployment
        },
        routerAddress: this.getRouterAddress(),
        factoryAddress: this.getFactoryAddress()
      });
      return this.createErrorQuote(params);
    }
  }
  async getQuote(params: QuoteParams): Promise<UniswapQuote | null> {
    const {
      tokenIn,
      tokenOut,
      amountIn,
      slippagePercent,
      tokenInDecimals,
      tokenOutDecimals,
      tokenInSymbol,
      tokenOutSymbol
    } = params;

    try {
      // Validate inputs
      if (!amountIn || parseFloat(amountIn) <= 0) {
        return null;
      }

      // Validate token addresses
      if (tokenIn === tokenOut) {
        console.warn('Cannot swap identical tokens');
        return this.createErrorQuote(params);
      }

      // Check if pair exists
      const pairExists = await this.checkPairExists(tokenIn, tokenOut);
      if (!pairExists) {
        console.warn(`No Uniswap V2 pair found for ${tokenInSymbol}/${tokenOutSymbol}`);
        return this.createErrorQuote(params);
      }

      // Parse input amount
      const amountInWei = parseUnits(amountIn, tokenInDecimals);

      // Get swap path
      const path = [tokenIn, tokenOut];

      // Get amounts out from Uniswap V2 router
      const amountsOut = await this.publicClient.readContract({
        address: this.getRouterAddress(),
        abi: UNISWAP_V2_ROUTER_ABI,
        functionName: 'getAmountsOut',
        args: [amountInWei, path]
      }) as bigint[];

      if (!amountsOut || amountsOut.length < 2) {
        throw new Error('Invalid response from Uniswap router');
      }

      const amountOut = amountsOut[1];
      const amountOutFormatted = formatUnits(amountOut, tokenOutDecimals);

      // Calculate price impact and get liquidity info
      const { priceImpact, liquidityInfo } = await this.calculatePriceImpactAndLiquidity(
        tokenIn,
        tokenOut,
        amountInWei,
        amountOut,
        tokenInDecimals,
        tokenOutDecimals,
        tokenInSymbol,
        tokenOutSymbol
      );

      // Calculate minimum received with slippage
      const slippageMultiplier = BigInt(Math.floor((1 - slippagePercent / 100) * 10000));
      const minimumReceived = (amountOut * slippageMultiplier) / BigInt(10000);
      const minimumReceivedFormatted = formatUnits(minimumReceived, tokenOutDecimals);

      // Calculate exchange rate
      const rate = parseFloat(amountOutFormatted) / parseFloat(amountIn);
      const exchangeRate = `1 ${tokenInSymbol} = ${rate.toFixed(6)} ${tokenOutSymbol}`;

      return {
        amountOut,
        amountOutFormatted,
        priceImpact,
        exchangeRate,
        minimumReceived,
        minimumReceivedFormatted,
        path,
        isValidPair: true,
        liquidityInfo
      };

    } catch (error) {
      console.error('Error getting Uniswap quote:', {
        error,
        params: {
          tokenIn: params.tokenIn,
          tokenOut: params.tokenOut,
          amountIn: params.amountIn,
          deployment: this.deployment
        },
        routerAddress: this.getRouterAddress(),
        factoryAddress: this.getFactoryAddress()
      });
      return this.createErrorQuote(params);
    }
  }

  /**
   * Check if a Uniswap V2 pair exists for the given tokens
   */
  private async checkPairExists(tokenA: Address, tokenB: Address): Promise<boolean> {
    try {
      const pairAddress = await this.publicClient.readContract({
        address: this.getFactoryAddress(),
        abi: UNISWAP_V2_FACTORY_ABI,
        functionName: 'getPair',
        args: [tokenA, tokenB]
      }) as Address;

      // Check if pair address is not zero address
      return pairAddress !== ZERO_ADDRESS;
    } catch (error) {
      console.error('Error checking pair existence:', error);
      return false;
    }
  }

  /**
  * Calculate price impact and get liquidity information
  */
  private async calculatePriceImpactAndLiquidity(
  tokenIn: Address,
  tokenOut: Address,
  amountIn: bigint,
  amountOut: bigint,
  tokenInDecimals: number,
  tokenOutDecimals: number,
    tokenInSymbol: string,
  tokenOutSymbol: string
  ): Promise<{ priceImpact: number; liquidityInfo: UniswapQuote['liquidityInfo'] }> {
  try {
  // Get pair address
  const pairAddress = await this.publicClient.readContract({
  address: this.getFactoryAddress(),
  abi: UNISWAP_V2_FACTORY_ABI,
    functionName: 'getPair',
        args: [tokenIn, tokenOut]
  }) as Address;

  if (pairAddress === ZERO_ADDRESS) {
        return { 
      priceImpact: 0, 
      liquidityInfo: undefined 
  };
  }

  // Get reserves
      const reserves = await this.publicClient.readContract({
    address: pairAddress,
        abi: UNISWAP_V2_PAIR_ABI,
    functionName: 'getReserves'
  }) as [bigint, bigint, number];

  const [reserve0, reserve1] = reserves;

  // Get token order
      const token0 = await this.publicClient.readContract({
    address: pairAddress,
    abi: UNISWAP_V2_PAIR_ABI,
    functionName: 'token0'
  }) as Address;

  // Determine which reserve corresponds to which token
  const isToken0 = token0.toLowerCase() === tokenIn.toLowerCase();
  const reserveIn = isToken0 ? reserve0 : reserve1;
      const reserveOut = isToken0 ? reserve1 : reserve0;

  // Calculate mid price (price without impact)
  const midPrice = (Number(reserveOut) * Math.pow(10, tokenInDecimals)) / 
                       (Number(reserveIn) * Math.pow(10, tokenOutDecimals));

  // Calculate actual price from swap
      const actualPrice = Number(formatUnits(amountOut, tokenOutDecimals)) / 
                     Number(formatUnits(amountIn, tokenInDecimals));

  // Calculate price impact
  const priceImpact = Math.abs((actualPrice - midPrice) / midPrice) * 100;

      // Create liquidity info
      const liquidityInfo: UniswapQuote['liquidityInfo'] = {
        reserve0,
        reserve1,
        reserve0Formatted: formatUnits(reserve0, isToken0 ? tokenInDecimals : tokenOutDecimals),
        reserve1Formatted: formatUnits(reserve1, isToken0 ? tokenOutDecimals : tokenInDecimals),
        token0Symbol: isToken0 ? tokenInSymbol : tokenOutSymbol,
        token1Symbol: isToken0 ? tokenOutSymbol : tokenInSymbol,
        // TODO: Calculate USD value if you have price oracles
        totalLiquidityUSD: undefined
      };

      return {
        priceImpact: Math.min(priceImpact, 100), // Cap at 100%
        liquidityInfo
      };
    } catch (error) {
      console.error('Error calculating price impact and liquidity:', error);
      return { 
        priceImpact: 0, 
        liquidityInfo: undefined 
      };
    }
  }

  /**
   * Create an error quote with fallback values
   */
  private createErrorQuote(params: QuoteParams): UniswapQuote {
    return {
      amountOut: BigInt(0),
      amountOutFormatted: '0',
      priceImpact: 0,
      exchangeRate: `1 ${params.tokenInSymbol} = 0 ${params.tokenOutSymbol}`,
      minimumReceived: BigInt(0),
      minimumReceivedFormatted: '0',
      path: [params.tokenIn, params.tokenOut],
      isValidPair: false
    };
  }

  /**
   * Get Uniswap V2 Router address for the deployment
   */
  private getRouterAddress(): Address {
    switch (this.deployment) {
      case 'ethereum':
        return '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'; // Mainnet
      case 'polygon':
        return '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff'; // Polygon (QuickSwap)
      case 'testnet':
      default:
        return UNISWAP_V2_ROUTER_ADDRESS; // Sepolia
    }
  }

  /**
   * Get Uniswap V2 Factory address for the deployment
   */
  private getFactoryAddress(): Address {
    switch (this.deployment) {
      case 'ethereum':
        return '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'; // Mainnet
      case 'polygon':
        return '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32'; // Polygon (QuickSwap)
      case 'testnet':
      default:
        return UNISWAP_V2_FACTORY_ADDRESS; // Sepolia
    }
  }

  /**
   * Estimate gas for a swap transaction
   */
  async estimateSwapGas(
    tokenIn: Address,
    tokenOut: Address,
    amountIn: bigint,
    amountOutMin: bigint,
    to: Address,
    deadline: bigint
  ): Promise<bigint> {
    try {
      const path = [tokenIn, tokenOut];

      // This is a rough estimate - actual implementation would need the swap function ABI
      return BigInt(200000); // Conservative estimate for Uniswap V2 swap
    } catch (error) {
      console.error('Error estimating gas:', error);
      return BigInt(300000); // Fallback high estimate
    }
  }
}

/**
 * Utility function to create quote service instance
 */
export function createUniswapQuoteService(
  publicClient: PublicClient,
  deployment: Deployment
): UniswapV2QuoteService {
  return new UniswapV2QuoteService(publicClient, deployment);
}
