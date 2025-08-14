// src/lib/feeConfigGet.ts
import { type Deployment, getContract } from "@/lib/consts";
import { getPublicClientForDeployment } from "@/lib/rpc";
import { type VaultFees, type FeeDetail, type FeeTypeId } from "@/types/vault";
import { Configuration, Vault } from "@enzymefinance/sdk";
import { type Address, type Client, formatUnits } from "viem";

// Get fee contract addresses using the getContract function
const getFeeContractAddresses = (deployment: Deployment) => {
  return {
    managementFee: getContract(deployment, "ManagementFee"),
    performanceFee: getContract(deployment, "PerformanceFee"),
    entranceRateBurnFee: getContract(deployment, "EntranceRateBurnFee"),
    entranceRateDirectFee: getContract(deployment, "EntranceRateDirectFee"),
    exitRateBurnFee: getContract(deployment, "ExitRateBurnFee"),
    exitRateDirectFee: getContract(deployment, "ExitRateDirectFee"),
    minSharesSupplyFee: getContract(deployment, "MinSharesSupplyFee"),
  };
};

// Fee type mapping helper
const getFeeTypeMapping = (deployment: Deployment) => {
  const addresses = getFeeContractAddresses(deployment);
  return {
    [addresses.managementFee]: 'management' as const,
    [addresses.performanceFee]: 'performance' as const,
    [addresses.entranceRateBurnFee]: 'entrance' as const,
    [addresses.entranceRateDirectFee]: 'entrance' as const,
    [addresses.exitRateBurnFee]: 'exit' as const,
    [addresses.exitRateDirectFee]: 'exit' as const,
    [addresses.minSharesSupplyFee]: 'minSharesSupply' as const,
  };
};

// Extended fee information with raw data
export interface ExtendedFeeDetail extends FeeDetail {
  // Raw blockchain data
  rawRate?: bigint;
  lastSettled?: bigint;
  highWaterMark?: bigint;
  lastSharePrice?: bigint;
  aggregateValueDue?: bigint;

  // Metadata
  feeAddress?: Address;
  feeType?: 'burn' | 'direct';
  inKindRate?: string;
  specificAssetRate?: string;
}

export interface VaultFeeData {
  enabledFees: Address[];
  fees: {
    management: ExtendedFeeDetail;
    performance: ExtendedFeeDetail;
    entrance: ExtendedFeeDetail;
    exit: ExtendedFeeDetail;
  };
  totalEnabledCount: number;
  lastUpdated: number;
}

/**
 * Step 1: Get enabled fees for a vault
 */
export async function getEnabledFees(
  client: Client,
  comptrollerProxy: Address,
  feeManager: Address
): Promise<Address[]> {
  try {
    const enabledFees = await Configuration.getEnabledFees(client, {
      comptrollerProxy,
      feeManager,
    });

    console.log(`Found ${enabledFees.length} enabled fees:`, enabledFees);
    return enabledFees;
  } catch (error) {
    console.error("Failed to get enabled fees:", error);
    return [];
  }
}

/**
 * Convert bigint rate to percentage string
 */
function formatFeeRate(rate: bigint, decimals: number = 18): string {
  try {
    const formatted = formatUnits(rate, decimals);
    return parseFloat(formatted).toFixed(2);
  } catch {
    return "0.00";
  }
}

/**
* Convert scaled per second rate to annual percentage
* Uses tolerance-based matching to return "nice" percentages
*/
function formatManagementFeeRate(scaledPerSecondRate: bigint): string {
  try {
    // Enzyme constants
    const SECONDS_PER_YEAR = 31557600; // 365.25 * 24 * 60 * 60 (exact Enzyme value)
    const RATE_SCALE_BASE = BigInt("1000000000000000000000000000"); // 1e27

    console.log("🧮 [DEBUG] Management Fee Rate Calculation:");
    console.log("  - Input (scaled per second):", scaledPerSecondRate.toString());
    console.log("  - Seconds per year:", SECONDS_PER_YEAR);
    console.log("  - Scale base:", RATE_SCALE_BASE.toString());

    // Convert to numbers for precise calculation
    const scaledRateAsNumber = Number(scaledPerSecondRate);
    const scaleBaseAsNumber = Number(RATE_SCALE_BASE);
    
    // Decode: scaledPerSecondRate = (ratePerSecond + 1) * 1e27
    // So: ratePerSecond = (scaledPerSecondRate / 1e27) - 1
    const ratePerSecond = (scaledRateAsNumber / scaleBaseAsNumber) - 1;
    console.log("  - Rate per second (decimal):", ratePerSecond);
    
    // Convert to annual rate: annualRate = (1 + ratePerSecond)^(seconds per year) - 1
    const annualRateDecimal = Math.pow(1 + ratePerSecond, SECONDS_PER_YEAR) - 1;
    console.log("  - Annual rate (decimal):", annualRateDecimal);
    
    // Convert to percentage
    const annualRatePercentage = annualRateDecimal * 100;
    console.log("  - Calculated percentage:", annualRatePercentage.toFixed(6) + "%");

    // Check if it's within tolerance of a "nice" number
    const tolerance = 0.05; // 0.05% tolerance
    const niceNumbers = [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4, 4.5, 5, 6, 7, 8, 9, 10];
    
    for (const niceNum of niceNumbers) {
      if (Math.abs(annualRatePercentage - niceNum) <= tolerance) {
        console.log("✅ Tolerance match:", annualRatePercentage.toFixed(6) + "% ≈ " + niceNum + "%");
        return niceNum.toFixed(2);
      }
    }
    
    // If no nice match found, return precise value rounded to 2 decimals
    console.log("📈 No tolerance match, using precise:", annualRatePercentage.toFixed(2) + "%");
    return annualRatePercentage.toFixed(2);
  } catch (error) {
    console.error("Error calculating management fee rate:", error);
    return "0.00";
  }
}

/**
 * Get management fee information
 */
async function getManagementFeeInfo(
  client: Client,
  comptrollerProxy: Address,
  feeAddress: Address
): Promise<ExtendedFeeDetail> {
  console.log("💼 [DEBUG] Getting management fee info");
  console.log("📍 Comptroller:", comptrollerProxy);
  console.log("📍 Fee Address:", feeAddress);

  try {
    const feeInfo = await Configuration.Fees.Management.getInfo(client, {
      comptrollerProxy,
      managementFee: feeAddress,
    });

    const recipient = await Configuration.Fee.getRecipient(client, {
      comptrollerProxy,
      fee: feeAddress,
    });

    const formattedRate = formatManagementFeeRate(feeInfo.scaledPerSecondRate);

    console.log("📊 Management fee raw blockchain data:", feeInfo);
    console.log("  - Recipient:", recipient);
    console.log("  - Raw rate (scaled per second):", feeInfo.scaledPerSecondRate?.toString());
    console.log("  - Last settled:", feeInfo.lastSettled?.toString());
    console.log("📊 Formatted annual rate:", formattedRate + "%");

    return {
      enabled: true,
      rate: formattedRate,
      recipient: recipient,
      lastSettled: feeInfo.lastSettled,
      feeAddress,
      feeType: 'direct',
    };
  } catch (error) {
    console.error("❌ Failed to get management fee info:", error);
    console.error("❌ Error details:", {
      comptrollerProxy,
      feeAddress,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      enabled: false,
      rate: "0.00",
    };
  }
}

/**
 * Get performance fee information
 */
async function getPerformanceFeeInfo(
  client: Client,
  comptrollerProxy: Address,
  feeAddress: Address
): Promise<ExtendedFeeDetail> {
  console.log("🚀 [DEBUG] Getting performance fee info");
  console.log("📍 Comptroller:", comptrollerProxy);
  console.log("📍 Fee Address:", feeAddress);

  try {
    const feeInfo = await Configuration.Fees.Performance.getInfo(client, {
      comptrollerProxy,
      performanceFee: feeAddress,
    });

    const feeRecipient = await Configuration.Fee.getRecipient(client, {
      comptrollerProxy,
      fee: feeAddress,
    });

    const formattedRate = formatFeeRate(feeInfo.rate, 2);

    console.log("📊 Performance fee raw blockchain data:", feeInfo);
    console.log("  - Raw rate (basis points):", feeInfo.rate?.toString());
    console.log("  - Recipient:", feeRecipient);
    console.log("  - High water mark:", feeInfo.highWaterMark?.toString());
    console.log("📊 Formatted rate:", formattedRate + "%");

    return {
      enabled: true,
      rate: formattedRate, // Performance fee is in basis points
      recipient: feeRecipient,
      highWaterMark: feeInfo.highWaterMark,
      feeAddress,
      feeType: 'direct',
    };
  } catch (error) {
    console.error("❌ Failed to get performance fee info:", error);
    console.error("❌ Error details:", {
      comptrollerProxy,
      feeAddress,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      enabled: false,
      rate: "0.00",
    };
  }
}

/**
 * Get entrance fee information
 */
async function getEntranceFeeInfo(
  client: Client,
  comptrollerProxy: Address,
  feeAddress: Address,
  feeType: 'burn' | 'direct'
): Promise<ExtendedFeeDetail> {
  console.log(`🚪 [DEBUG] Getting entrance fee info (${feeType})`);
  console.log("📍 Comptroller:", comptrollerProxy);
  console.log("📍 Fee Address:", feeAddress);

  try {
    const rate = await Configuration.Fees.Entrance.getRate(client, {
      comptrollerProxy,
      entranceRateFee: feeAddress,
    });

    console.log("📊 Entrance fee raw blockchain data:");
    console.log("  - Raw rate (basis points):", rate?.toString());
    console.log("  - Fee type:", feeType);

    const formattedRate = formatFeeRate(rate, 2);
    console.log("📊 Formatted rate:", formattedRate + "%");

    let feeRecipient;
    if (feeType === 'direct') {
      feeRecipient = await Configuration.Fee.getRecipient(client, {
        comptrollerProxy,
        fee: feeAddress,
      });
    }

    const result: ExtendedFeeDetail = {
      enabled: true,
      rate: formattedRate,
      feeAddress,
      feeType,
    };

    // Only add recipient if it exists
    if (feeRecipient) {
      result.recipient = feeRecipient;
    }
    return result;
  } catch (error) {
    console.error("❌ Failed to get entrance fee info:", error);
    console.error("❌ Error details:", {
      comptrollerProxy,
      feeAddress,
      feeType,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      enabled: false,
      rate: "0.00",
    };
  }
}

/**
 * Get exit fee information
 */
async function getExitFeeInfo(
  client: Client,
  comptrollerProxy: Address,
  feeAddress: Address,
  feeType: 'burn' | 'direct'
): Promise<ExtendedFeeDetail> {
  try {

    const inKindRate = await Configuration.Fees.Exit.getInKindRate(client, {
      comptrollerProxy,
      exitRateFee: feeAddress,
    });

    const specificAssetsRate = await Configuration.Fees.Exit.getSpecificAssetsRate(client, {
      comptrollerProxy,
      exitRateFee: feeAddress,
    });

    let feeRecipient;
    if (feeType === 'direct') {
      feeRecipient = await Configuration.Fee.getRecipient(client, {
        comptrollerProxy,
        fee: feeAddress,
      });
    }

    const result: ExtendedFeeDetail = {
      enabled: true,
      inKindRate: formatFeeRate(inKindRate, 2),
      specificAssetRate: formatFeeRate(specificAssetsRate, 2),
      feeAddress,
      feeType,
    };

    if (feeRecipient) {
      result.recipient = feeRecipient;
    }


    return result;
  } catch (error) {
    console.error("Failed to get exit fee info:", error);
    return {
      enabled: false,
      rate: "0.00",
    };
  }
}

/**
 * Step 2: Process enabled fees and get detailed information
 */
export async function processFeeDetails(
  client: Client,
  comptrollerProxy: Address,
  enabledFees: Address[],
  deployment: Deployment
): Promise<VaultFeeData['fees']> {

  const feeTypeMap = getFeeTypeMapping(deployment);
  const addresses = getFeeContractAddresses(deployment);

  // Initialize all fees as disabled
  const fees: VaultFeeData['fees'] = {
    management: { enabled: false, rate: "0.00" },
    performance: { enabled: false, rate: "0.00" },
    entrance: { enabled: false, rate: "0.00" },
    exit: { enabled: false, rate: "0.00" },
  };

  console.log("🔄 Processing each enabled fee...");

  // Process each enabled fee
  for (const feeAddress of enabledFees) {
    console.log(`\n🔍 Processing fee address: ${feeAddress}`);

    const feeType = feeTypeMap[feeAddress];
    console.log(`📝 Fee type for ${feeAddress}:`, feeType);

    if (!feeType) {
      console.log(`❌ Unknown fee type for address: ${feeAddress}`);
      console.log(`🔍 Available addresses in mapping:`, Object.keys(feeTypeMap));
      continue;
    }

    try {
      console.log(`⚙️ Processing ${feeType} fee...`);

      switch (feeType) {
        case 'management':
          if (feeAddress === addresses.managementFee) {
            console.log("✅ Processing management fee");
            const managementFeeData = await getManagementFeeInfo(client, comptrollerProxy, feeAddress);
            fees.management = managementFeeData;
          } else {
            console.log("❌ Management fee address mismatch");
          }
          break;

        case 'performance':
          if (feeAddress === addresses.performanceFee) {
            console.log("✅ Processing performance fee");
            const performanceFeeData = await getPerformanceFeeInfo(client, comptrollerProxy, feeAddress);
            fees.performance = performanceFeeData;
          } else {
            console.log("❌ Performance fee address mismatch");
          }
          break;

        case 'entrance':
          const entranceFeeType = feeAddress === addresses.entranceRateBurnFee ? 'burn' : 'direct';
          console.log(`✅ Processing entrance fee (${entranceFeeType})`);
          const entranceFeeData = await getEntranceFeeInfo(client, comptrollerProxy, feeAddress, entranceFeeType);
          fees.entrance = entranceFeeData;
          break;

        case 'exit':
          const exitFeeType = feeAddress === addresses.exitRateBurnFee ? 'burn' : 'direct';
          console.log(`✅ Processing exit fee (${exitFeeType})`);
          const exitFeeData = await getExitFeeInfo(client, comptrollerProxy, feeAddress, exitFeeType);
          console.log("📊 Exit fee raw data:", exitFeeData);
          fees.exit = exitFeeData;
          break;

        default:
          console.log(`❌ Unhandled fee type: ${feeType}`);
      }
    } catch (error) {
      console.error(`❌ Failed to get info for ${feeType} fee:`, error);
      console.error(`❌ Error details:`, {
        feeType,
        feeAddress,
        comptrollerProxy,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.log("🎯 Final processed fees:", fees);
  return fees;
}

/**
 * Main function: Get complete fee information for a vault
 * Returns data compatible with your VaultFees interface
 */
export async function getVaultFeeInformation(
  vaultAddress: Address,
  deployment: Deployment
): Promise<VaultFeeData> {
  const client = getPublicClientForDeployment(deployment);

  console.log("[DEBUG] Starting getVaultFeeInformation");
  console.log("Vault Address:", vaultAddress);
  console.log("Deployment:", deployment);

  try {

    const comptrollerProxy = await Vault.getComptrollerProxy(client, {
      vaultProxy: vaultAddress,
    });
    console.log("Comptroller Proxy:", comptrollerProxy);

    console.log("📡 Fetching fee manager...");
    const feeManager = await Vault.getFeeManager(client, {
      comptrollerProxy,
    });
    console.log("Fee Manager:", feeManager);

    // Debug: Show contract addresses for this deployment
    const contractAddresses = getFeeContractAddresses(deployment);
    console.log("📋 Fee Contract Addresses for", deployment, ":");
    console.log("  - Management Fee:", contractAddresses.managementFee);
    console.log("  - Performance Fee:", contractAddresses.performanceFee);
    console.log("  - Entrance Burn Fee:", contractAddresses.entranceRateBurnFee);
    console.log("  - Entrance Direct Fee:", contractAddresses.entranceRateDirectFee);
    console.log("  - Exit Burn Fee:", contractAddresses.exitRateBurnFee);
    console.log("  - Exit Direct Fee:", contractAddresses.exitRateDirectFee);


    const enabledFees = await getEnabledFees(client, comptrollerProxy, feeManager);
    console.log("Enabled Fees:", enabledFees);

    const fees = await processFeeDetails(client, comptrollerProxy, enabledFees, deployment);

    const result = {
      enabledFees,
      fees,
      totalEnabledCount: enabledFees.length,
      lastUpdated: Date.now(),
    };

    console.log("🎉 Final Result:", result);
    return result;

  } catch (error) {
    console.error("❌ Failed to get vault fee information:", error);
    console.error("❌ Error details:", {
      vaultAddress,
      deployment,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return empty structure on error
    return {
      enabledFees: [],
      fees: {
        management: { enabled: false, rate: "0.00" },
        performance: { enabled: false, rate: "0.00" },
        entrance: { enabled: false, rate: "0.00" },
        exit: { enabled: false, rate: "0.00" },
      },
      totalEnabledCount: 0,
      lastUpdated: Date.now(),
    };
  }
}

/**
 * Convert VaultFeeData to your VaultFees interface format
 */
export function convertToVaultFeesFormat(feeData: VaultFeeData): VaultFees {
  return {
    management: {
      enabled: feeData.fees.management.enabled,
      rate: feeData.fees.management.rate,
      recipient: feeData.fees.management.recipient,
    },
    performance: {
      enabled: feeData.fees.performance.enabled,
      rate: feeData.fees.performance.rate,
      recipient: feeData.fees.performance.recipient,
    },
    entrance: {
      enabled: feeData.fees.entrance.enabled,
      rate: feeData.fees.entrance.rate,
      allocation: feeData.fees.entrance.feeType, // 'burn' or 'direct'
    },
    exit: {
      enabled: feeData.fees.exit.enabled,
      rate: feeData.fees.exit.rate,
      inKindRate: feeData.fees.exit.inKindRate,
      specificAssetRate: feeData.fees.exit.specificAssetRate,
      allocation: feeData.fees.exit.feeType, // 'burn' or 'direct'
    },
  };
}

/**
 * Utility function: Calculate fees for a potential deposit
 */
// export async function calculateDepositFees(
//   vaultAddress: Address,
//   depositAmount: bigint,
//   userAddress: Address,
//   deployment: Deployment
// ): Promise<{
//   expectedShares: bigint;
//   entranceFeeShares: bigint;
//   netShares: bigint;
//   feeData: VaultFeeData;
// }> {
//   const client = getPublicClientForDeployment(deployment);

//   try {
//     const comptrollerProxy = await Vault.getComptrollerProxy(client, {
//       vaultProxy: vaultAddress,
//     });

//     // Get expected shares for deposit
//     const expectedShares = await Configuration.getExpectedSharesForDeposit(client, {
//       comptrollerProxy,
//       amount: depositAmount,
//       depositor: userAddress,
//     });

//     // Get fee information
//     const feeData = await getVaultFeeInformation(vaultAddress, deployment);

//     let entranceFeeShares = 0n;

//     // Calculate entrance fee if enabled
//     if (feeData.fees.entrance.enabled && feeData.fees.entrance.rawRate) {
//       entranceFeeShares = Configuration.Fees.Entrance.calculateFeeSharesDue({
//         rateInBps: feeData.fees.entrance.rawRate,
//         sharesBought: expectedShares,
//       });
//     }

//     return {
//       expectedShares,
//       entranceFeeShares,
//       netShares: expectedShares - entranceFeeShares,
//       feeData,
//     };

//   } catch (error) {
//     console.error("Failed to calculate deposit fees:", error);

//     const emptyFeeData: VaultFeeData = {
//       enabledFees: [],
//       fees: {
//         management: { enabled: false, rate: "0.00" },
//         performance: { enabled: false, rate: "0.00" },
//         entrance: { enabled: false, rate: "0.00" },
//         exit: { enabled: false, rate: "0.00" },
//       },
//       totalEnabledCount: 0,
//       lastUpdated: Date.now(),
//     };

//     return {
//       expectedShares: 0n,
//       entranceFeeShares: 0n,
//       netShares: 0n,
//       feeData: emptyFeeData,
//     };
//   }
// }

/**
 * Get basic fee summary for display
 */
export function getFeeSummary(feeData: VaultFeeData): {
  enabledFees: FeeTypeId[];
  totalFees: number;
  hasManagementFee: boolean;
  hasPerformanceFee: boolean;
  hasEntranceFee: boolean;
  hasExitFee: boolean;
} {
  const enabledFees: FeeTypeId[] = [];

  if (feeData.fees.management.enabled) enabledFees.push('management');
  if (feeData.fees.performance.enabled) enabledFees.push('performance');
  if (feeData.fees.entrance.enabled) enabledFees.push('entrance');
  if (feeData.fees.exit.enabled) enabledFees.push('exit');

  return {
    enabledFees,
    totalFees: enabledFees.length,
    hasManagementFee: feeData.fees.management.enabled,
    hasPerformanceFee: feeData.fees.performance.enabled,
    hasEntranceFee: feeData.fees.entrance.enabled,
    hasExitFee: feeData.fees.exit.enabled,
  };
}

/**
 * Get fee contract addresses for debugging/display
 */
export function getFeeContractInfo(deployment: Deployment): {
  addresses: ReturnType<typeof getFeeContractAddresses>;
  mapping: Record<Address, string>;
} {
  const addresses = getFeeContractAddresses(deployment);
  const mapping: Record<Address, string> = {
    [addresses.managementFee]: 'Management Fee',
    [addresses.performanceFee]: 'Performance Fee',
    [addresses.entranceRateBurnFee]: 'Entrance Rate Burn Fee',
    [addresses.entranceRateDirectFee]: 'Entrance Rate Direct Fee',
    [addresses.exitRateBurnFee]: 'Exit Rate Burn Fee',
    [addresses.exitRateDirectFee]: 'Exit Rate Direct Fee',
    [addresses.minSharesSupplyFee]: 'Min Shares Supply Fee',
  };

  return { addresses, mapping };
}
