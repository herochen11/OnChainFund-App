import { type Address } from 'viem';
import { writeContract, waitForTransaction } from '@wagmi/core';
// import { config } from '../cpmponents/providers/WagmiProvider'; // Your wagmi config
import contractAddresses from '../../../Contractaddess.json';

// ABI for createNewFund function - matches your provided ABI
const FUND_DEPLOYER_ABI = [
  {
    type: "function",
    name: "createNewFund",
    inputs: [
      { name: "_fundOwner", type: "address", internalType: "address" },
      { name: "_fundName", type: "string", internalType: "string" },
      { name: "_fundSymbol", type: "string", internalType: "string" },
      { name: "_denominationAsset", type: "address", internalType: "address" },
      { name: "_sharesActionTimelock", type: "uint256", internalType: "uint256" },
      { name: "_feeManagerConfigData", type: "bytes", internalType: "bytes" },
      { name: "_policyManagerConfigData", type: "bytes", internalType: "bytes" }
    ],
    outputs: [
      { name: "comptrollerProxy_", type: "address", internalType: "address" },
      { name: "vaultProxy_", type: "address", internalType: "address" }
    ],
    stateMutability: "nonpayable"
  }
] as const;

export interface BasicVaultConfig {
  vaultName: string;
  vaultSymbol: string;
  denominationAsset: Address;
  fundOwner: Address;
}

export interface VaultDeploymentResult {
  comptrollerProxy: Address;
  vaultProxy: Address;
  transactionHash: string;
}

export class BasicVaultDeploymentService {
  private getFundDeployerAddress(): Address {
    // Find FundDeployer address from your contract addresses
    const contracts = contractAddresses.deployed.contract;
    const fundDeployerEntry = Object.entries(contracts).find(([_, name]) => name === "FundDeployer");
    
    if (!fundDeployerEntry) {
      throw new Error("FundDeployer contract not found in contract addresses");
    }
    
    return fundDeployerEntry[0] as Address;
  }

  async deployBasicVault(config: BasicVaultConfig): Promise<VaultDeploymentResult> {
    try {
      const fundDeployerAddress = this.getFundDeployerAddress();
      
      // For basic vault creation with no fees and no policies, pass empty bytes
      const emptyFeeConfig = '0x' as const;
      const emptyPolicyConfig = '0x' as const;
      
      console.log('Deploying vault with config:', {
        fundDeployer: fundDeployerAddress,
        ...config,
        feeConfig: emptyFeeConfig,
        policyConfig: emptyPolicyConfig
      });

      // Call createNewFund on your custom contract
      const hash = await writeContract(config, {
        address: fundDeployerAddress,
        abi: FUND_DEPLOYER_ABI,
        functionName: 'createNewFund',
        args: [
          config.fundOwner,
          config.vaultName,
          config.vaultSymbol,
          config.denominationAsset,
          0n, // No shares action timelock
          emptyFeeConfig, // No fees
          emptyPolicyConfig, // No policies
        ],
      });

      console.log('Transaction submitted:', hash);

      // Wait for transaction confirmation
      const receipt = await waitForTransaction(config, { hash });
      
      console.log('Transaction confirmed:', receipt);

      // Parse logs to get deployed addresses
      const result = this.parseVaultCreationLogs(receipt.logs, hash);
      
      return result;
    } catch (error) {
      console.error('Vault deployment failed:', error);
      throw new Error(`Failed to deploy vault: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseVaultCreationLogs(logs: any[], txHash: string): VaultDeploymentResult {
    // Look for NewFundCreated event in logs
    // Event signature: NewFundCreated(address indexed creator, address vaultProxy, address comptrollerProxy)
    
    try {
      // For now, return mock data - you'll need to implement proper log parsing
      // based on the actual events emitted by your contract
      
      // Find the NewFundCreated event in logs
      const newFundCreatedTopic = '0x...'; // You need to calculate this from your contract's event signature
      
      const relevantLog = logs.find(log => 
        log.topics && log.topics[0] === newFundCreatedTopic
      );

      if (relevantLog) {
        // Parse the log data to extract addresses
        // This is simplified - you'll need proper ABI decoding
        const comptrollerProxy = relevantLog.topics[2] as Address; // Adjust based on actual event structure
        const vaultProxy = relevantLog.topics[1] as Address; // Adjust based on actual event structure
        
        return {
          comptrollerProxy,
          vaultProxy,
          transactionHash: txHash,
        };
      }
      
      // Fallback: try to extract from transaction receipt data
      // This is a simplified approach - you should implement proper event parsing
      throw new Error('Could not parse vault creation from transaction logs');
      
    } catch (error) {
      console.error('Failed to parse logs:', error);
      throw new Error('Failed to parse vault creation result from transaction');
    }
  }
}

// Export singleton instance
export const vaultDeploymentService = new BasicVaultDeploymentService();