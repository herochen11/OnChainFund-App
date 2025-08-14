
import { type Address, type Hex, parseUnits, getAddress } from 'viem';
import { Fee, Fees } from "@enzymefinance/sdk/Configuration";
import { FEE_TYPES, type CreateVaultFormData } from '@/types/vault';
import { type Deployment, getContract } from "@/lib/consts";

export function encodeFeeData(
    fees: CreateVaultFormData['fees'],
    deployment: Deployment
): Array<{ address: Address, settings: Hex }> {
    // Array to hold the encoded settings for each enabled fee
    const encodedFees: Array<{ address: Address, settings: Hex }> = [];
    console.log("Encoding fee data for deployment:", deployment);

    FEE_TYPES.forEach(feeType => {
        const feeId = feeType.id;
        const feeDetails = fees[feeId];

        console.log(`Processing fee type: ${feeId}`);
        console.log(`Fee details:`, feeDetails.enabled);
        // Proceed only if the fee is enabled
        if (feeDetails?.enabled) {
            // Initialize a variable to hold the encoded settings for the current fee
            let feeConfig: Hex | null = null;
            let feeAddress: Address | null = null;


            // Use a switch statement to handle the specific encoding logic for each fee type.
            // NOTE: The parameters for encodeSettings() are based on common assumptions for
            // these types of fees. You may need to adjust them based on the exact Enzyme SDK.
            switch (feeId) {
                case "management": {
                    // Parse the rate string to a number and convert to percentage as needed
                    if (feeDetails.rate && feeDetails.recipient) {
                        try {
                            // Convert the rate to a BigInt representing the per annum rate
                            // Assuming the rate is given in a string format like "0.02" for 2%
                            // and we need to convert it to a BigInt with 16 decimal places
                            const perAnnumRate = parseUnits(feeDetails.rate, 16);
                            feeConfig = Fees.Management.encodeSettings({
                                perAnnumRate,
                                recipient: getAddress(feeDetails.recipient)
                            });
                            console.log(`Encoded management fee settings:`, feeConfig);
                            feeAddress = getContract(deployment, "ManagementFee");
                        } catch (error) {
                            console.error(`Error: Management Fee is enabled but the rate is not a valid number. Details: ${error}`);
                        }
                    } else {
                        console.error(`Error: Management Fee is enabled but is missing a rate or recipient address.`);
                    }
                    break;
                }
                case "performance": {
                    // Parse the rate and convert to basis points (BPS)
                    if (feeDetails.rate && feeDetails.recipient) {
                        const rate = parseFloat(feeDetails.rate);
                        if (!isNaN(rate)) {
                            // Convert the percentage rate to basis points (BPS) as a BigInt
                            const rateInBps = BigInt(Math.round(rate * 100));
                            feeConfig = Fees.Performance.encodePerformanceFeeSettings({
                                rateInBps,
                                recipient: getAddress(feeDetails.recipient)
                            });
                            feeAddress = getContract(deployment, "PerformanceFee");
                        } else {
                            console.error(`Error: Performance Fee is enabled but the rate is not a valid number.`);
                        }
                    } else {
                        console.error(`Error: Performance Fee is enabled but is missing a rate or recipient address.`);
                    }
                    break;
                }
                case "entrance": {
                    const rateString = feeDetails.rate || '0';
                    const rate = parseFloat(rateString);
                    if (!isNaN(rate)) {
                        // Convert the percentage rate to basis points (BPS) as a BigInt
                        const rateInBps = BigInt(Math.round(rate * 100));

                        // Check if there's a recipient to determine which encoding to use
                        if (feeDetails.recipient) {
                            feeConfig = Fees.Entrance.encodeDirectFeeSettings({
                                rateInBps,
                                recipient: getAddress(feeDetails.recipient)
                            });
                            feeAddress = getContract(deployment, "EntranceRateDirectFee");
                        } else {
                            // If no recipient is specified, use the burn fee settings
                            feeConfig = Fees.Entrance.encodeBurnFeeSettings({
                                rateInBps
                            });
                            feeAddress = getContract(deployment, "EntranceRateBurnFee");
                        }
                    } else {
                        console.error(`Error: Entrance Fee is enabled but the rate is not a valid number.`);
                    }
                    break;
                }
                case "exit": {
                    // Exit fee has multiple potential rates
                    const inKindRateString = feeDetails.inKindRate || '0';
                    const specificAssetsRateString = feeDetails.specificAssetRate || '0';

                    const inKindRate = parseFloat(inKindRateString);
                    const specificAssetsRate = parseFloat(specificAssetsRateString);

                    if (!isNaN(inKindRate) && !isNaN(specificAssetsRate)) {
                        const inKindRateInBps = BigInt(Math.round(inKindRate * 100));
                        const specificAssetsRateInBps = BigInt(Math.round(specificAssetsRate * 100));

                        if (feeDetails.recipient) {
                            feeConfig = Fees.Exit.encodeDirectFeeSettings({
                                inKindRateInBps,
                                specificAssetsRate: specificAssetsRateInBps,
                                recipient: getAddress(feeDetails.recipient)
                            });
                            feeAddress = getContract(deployment, "ExitRateDirectFee");
                        } else {
                            feeConfig = Fees.Exit.encodeBurnFeeSettings({
                                inKindRateInBps,
                                specificAssetsRate: specificAssetsRateInBps
                            });
                            feeAddress = getContract(deployment, "ExitRateBurnFee");
                        }
                    } else {
                        console.error(`Error: Exit Fee is enabled but one or more rates are not a valid number.`);
                    }
                    break;
                }
            }

            // If we successfully encoded the settings, add it to our list
            if (feeConfig) {
                console.log(`Encoded settings for ${feeId}:`, feeConfig);
                console.log(`Using fee address for ${feeId}:`, feeAddress);

                if (feeAddress) {
                    console.log(`Fee ${feeId} push sucessfully`);
                    encodedFees.push({
                        address: feeAddress,
                        settings: feeConfig
                    });
                } else {
                    console.warn(`Warning: Address for fee type '${feeId}' is missing.`);
                }
            }
        }
    });

    // Finally, encode the entire list of fees for the Fee Manager
    return encodedFees;
}; 