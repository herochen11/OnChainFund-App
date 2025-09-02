// src/lib/uniswap/swap-execution.ts
import {
  type Address,
  parseUnits,
  encodeAbiParameters,
  keccak256,
  toBytes,
  type PublicClient,
  type WalletClient
} from 'viem';
import {
  writeContract,
  waitForTransactionReceipt
} from "viem/actions";

// ABI for comptroller contract
const COMPTROLLER_ABI = [
  {
    name: 'callOnExtension',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'extension', type: 'address' },
      { name: 'actionId', type: 'uint256' },
      { name: 'callArgs', type: 'bytes' }
    ],
    outputs: []
  }
] as const;

export interface SwapExecutionParams {
  comptrollerProxy: Address;
  integrationManager: Address;
  uniswapAdapter: Address;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: string;
  amountInDecimals: number;
  minAmountOut: string;
  minAmountOutDecimals: number;
  walletClient: WalletClient;
  publicClient: PublicClient;
  userAddress: Address;
}

export interface SwapExecutionResult {
  hash: string;
  success: boolean;
  error?: string;
}

/**
 * Pure function to execute Uniswap V2 swap through Enzyme protocol
 */
export async function executeUniswapSwap(params: SwapExecutionParams): Promise<SwapExecutionResult> {
  const {
    comptrollerProxy,
    integrationManager,
    uniswapAdapter,
    tokenIn,
    tokenOut,
    amountIn,
    amountInDecimals,
    minAmountOut,
    minAmountOutDecimals,
    walletClient,
    publicClient,
    userAddress
  } = params;

  if (!walletClient || !publicClient) {
    return {
      hash: '',
      success: false,
      error: 'Wallet or public client not connected.'
    };
  }

  if (!userAddress) {
    return {
      hash: '',
      success: false,
      error: 'Wallet not connected or no account found.'
    };
  }

  try {
    console.log('Executing Uniswap swap with params:', {
      comptrollerProxy,
      integrationManager,
      uniswapAdapter,
      tokenIn,
      tokenOut,
      amountIn,
      minAmountOut
    });

    const takeOrderSelector = getFunctionSelector('takeOrder(address,bytes,bytes)');
    console.log('Take Order Selector:', takeOrderSelector);

    const amountInWei = parseUnits(amountIn, amountInDecimals);
    const minAmountOutWei = parseUnits(minAmountOut, minAmountOutDecimals);

    const path = [tokenIn, tokenOut];

    const integrationData = encodeAbiParameters(
      [
        { name: 'path', type: 'address[]' },
        { name: 'amountIn', type: 'uint256' },
        { name: 'minAmountOut', type: 'uint256' }
      ],
      [path, amountInWei, minAmountOutWei]
    );

    const callArgs = encodeAbiParameters(
      [
        { name: 'adapter', type: 'address' },
        { name: 'selector', type: 'bytes4' },
        { name: 'integrationData', type: 'bytes' }
      ],
      [uniswapAdapter, takeOrderSelector, integrationData]
    );

    const gasEstimate = await publicClient.estimateContractGas({
      address: comptrollerProxy,
      abi: COMPTROLLER_ABI,
      functionName: 'callOnExtension',
      args: [
        integrationManager,
        BigInt(0),
        callArgs
      ],
      account: userAddress
    });

    console.log('Gas estimate:', gasEstimate.toString());

    // 7. Execute the transaction
    const hash = await writeContract(walletClient, {
      address: comptrollerProxy,
      abi: COMPTROLLER_ABI,
      functionName: 'callOnExtension',
      args: [
        integrationManager,
        BigInt(0),
        callArgs
      ],
      chain: walletClient.chain,
      account: userAddress, // <--- THE NEW KEY FIX: Add the 'account' property
      gas: gasEstimate + BigInt(50000)
    });

    console.log('Transaction submitted:', hash);

    const receipt = await waitForTransactionReceipt(publicClient, { hash });

    console.log('Transaction confirmed:', {
      blockNumber: receipt.blockNumber.toString(),
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status
    });

    return {
      hash,
      success: receipt.status === 'success'
    };

  } catch (error) {
    console.error('Swap execution failed:', error);
    return {
      hash: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get function selector
 */
function getFunctionSelector(functionSignature: string): `0x${string}` {
  const hash = keccak256(toBytes(functionSignature));
  return `0x${hash.slice(2, 10)}` as `0x${string}`;
}

/**
 * Validate swap parameters before execution
 */
export function validateSwapParams(params: Omit<SwapExecutionParams, 'walletClient' | 'publicClient' | 'userAddress'>): { isValid: boolean; error?: string } {
  const { tokenIn, tokenOut, amountIn, minAmountOut } = params;

  if (tokenIn === tokenOut) {
    return { isValid: false, error: 'Cannot swap identical tokens' };
  }

  if (!amountIn || parseFloat(amountIn) <= 0) {
    return { isValid: false, error: 'Invalid amount in' };
  }

  if (!minAmountOut || parseFloat(minAmountOut) <= 0) {
    return { isValid: false, error: 'Invalid minimum amount out' };
  }

  return { isValid: true };
}