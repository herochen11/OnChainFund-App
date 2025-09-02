// src/lib/uniswap/debug-pool.ts
import { type Address, type PublicClient } from 'viem';

// Your JS code addresses
const YOUR_ROUTER_ADDRESS: Address = '0xb179bA4c1b407E24610b410bA383Aadc2e3B88Be';

// Our current addresses
const OUR_ROUTER_ADDRESS: Address = '0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3';
const OUR_FACTORY_ADDRESS: Address = '0xF62c03E08ada871A0bEb309762E260a7a6a880E6';

const FACTORY_ABI = [
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

const ROUTER_ABI = [
  {
    name: 'factory',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }]
  },
  {
    name: 'getAmountsOut',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'path', type: 'address[]' }
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }]
  }
] as const;

export async function debugPoolIssue(
  publicClient: PublicClient,
  asvtAddress: Address,
  wethAddress: Address
) {
  console.log('=== DEBUGGING POOL ISSUE ===');
  console.log('ASVT Address:', asvtAddress);
  console.log('WETH Address:', wethAddress);
  console.log('');

  try {
    // 1. Check which factory each router uses
    console.log('1. Checking router factory addresses...');
    
    let yourRouterFactory: Address;
    let ourRouterFactory: Address;
    
    try {
      yourRouterFactory = await publicClient.readContract({
        address: YOUR_ROUTER_ADDRESS,
        abi: ROUTER_ABI,
        functionName: 'factory'
      }) as Address;
      console.log('Your JS Router Factory:', yourRouterFactory);
    } catch (error) {
      console.log('Your router might not have factory() function - it could be a custom adapter');
      yourRouterFactory = '0x0000000000000000000000000000000000000000';
    }

    try {
      ourRouterFactory = await publicClient.readContract({
        address: OUR_ROUTER_ADDRESS,
        abi: ROUTER_ABI,
        functionName: 'factory'
      }) as Address;
      console.log('Our Router Factory:', ourRouterFactory);
    } catch (error) {
      console.log('Our router error:', error);
      ourRouterFactory = OUR_FACTORY_ADDRESS;
    }
    
    console.log('');

    // 2. Check pair existence in both factories
    console.log('2. Checking pair existence...');
    
    let pairFromYourFactory: Address = '0x0000000000000000000000000000000000000000';
    let pairFromOurFactory: Address = '0x0000000000000000000000000000000000000000';
    
    // Check with your router's factory (if it exists)
    if (yourRouterFactory !== '0x0000000000000000000000000000000000000000') {
      try {
        pairFromYourFactory = await publicClient.readContract({
          address: yourRouterFactory,
          abi: FACTORY_ABI,
          functionName: 'getPair',
          args: [asvtAddress, wethAddress]
        }) as Address;
        console.log('Pair from your factory:', pairFromYourFactory);
      } catch (error) {
        console.log('Error checking your factory:', error);
      }
    }
    
    // Check with our factory
    try {
      pairFromOurFactory = await publicClient.readContract({
        address: ourRouterFactory,
        abi: FACTORY_ABI,
        functionName: 'getPair',
        args: [asvtAddress, wethAddress]
      }) as Address;
      console.log('Pair from our factory:', pairFromOurFactory);
    } catch (error) {
      console.log('Error checking our factory:', error);
    }
    
    console.log('');

    // 3. Test getAmountsOut with both routers
    console.log('3. Testing getAmountsOut...');
    const testAmount = BigInt('1000000000000000000'); // 1 ASVT
    const path = [asvtAddress, wethAddress];

    try {
      const amountsFromYourRouter = await publicClient.readContract({
        address: YOUR_ROUTER_ADDRESS,
        abi: ROUTER_ABI,
        functionName: 'getAmountsOut',
        args: [testAmount, path]
      }) as bigint[];
      console.log('Your router amounts:', amountsFromYourRouter.map(a => a.toString()));
    } catch (error) {
      console.log('Your router getAmountsOut error:', error);
    }

    try {
      const amountsFromOurRouter = await publicClient.readContract({
        address: OUR_ROUTER_ADDRESS,
        abi: ROUTER_ABI,
        functionName: 'getAmountsOut',
        args: [testAmount, path]
      }) as bigint[];
      console.log('Our router amounts:', amountsFromOurRouter.map(a => a.toString()));
    } catch (error) {
      console.log('Our router getAmountsOut error:', error);
    }

    // 4. Summary
    console.log('');
    console.log('=== SUMMARY ===');
    console.log('Your Router Address:', YOUR_ROUTER_ADDRESS);
    console.log('Our Router Address:', OUR_ROUTER_ADDRESS);
    console.log('Your Factory:', yourRouterFactory);
    console.log('Our Factory:', ourRouterFactory);
    console.log('');
    
    if (pairFromYourFactory !== '0x0000000000000000000000000000000000000000') {
      console.log('✅ Pool exists in your factory!');
    } else if (pairFromOurFactory !== '0x0000000000000000000000000000000000000000') {
      console.log('✅ Pool exists in our factory!');
    } else {
      console.log('❌ Pool not found in either factory');
    }
    
    return {
      yourRouterFactory,
      ourRouterFactory,
      pairFromYourFactory,
      pairFromOurFactory
    };

  } catch (error) {
    console.error('Debug failed:', error);
    return null;
  }
}
