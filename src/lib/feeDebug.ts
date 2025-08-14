import type { CreateVaultFormData } from '@/types/vault';
import { FEE_TYPES } from '@/types/vault';

/**
 * Logs the detailed configuration for all vault fees.
 * @param data The CreateVaultFormData object containing fee details.
 */
export function logVaultFees(data: CreateVaultFormData): void {
    console.log("--- Vault Fee Configuration Debug ---");

    if (!data || !data.fees) {
        console.error("Error: Vault data or fees object is missing.");
        return;
    }

    FEE_TYPES.forEach(feeType => {
        const feeId = feeType.id;
        const feeLabel = feeType.label;
        const feeDetails = data.fees[feeId]; // Access the fee details dynamically

        if (feeDetails) {
            console.log(`\n${feeLabel} (${feeId}):`);
            console.log("  Enabled:", feeDetails.enabled);

            if (feeDetails.enabled) {
                // Log basic rate if it exists
                if (feeDetails.rate) {
                    console.log("  Rate:", feeDetails.rate);
                }

                // Log specific rates for exit fees, if applicable
                if (feeType.hasMultipleRates) {
                    if (feeDetails.inKindRate) {
                        console.log("  In-Kind Rate:", feeDetails.inKindRate);
                    }
                    if (feeDetails.specificAssetRate) {
                        console.log("  Specific Asset Rate:", feeDetails.specificAssetRate);
                    }
                }

                // Log recipient and allocation if applicable
                if (feeType.hasRecipient && feeDetails.recipient) {
                    console.log("  Recipient:", feeDetails.recipient);
                }
                if (feeType.hasAllocation && feeDetails.allocation) {
                    console.log("  Allocation:", feeDetails.allocation);
                }
            } else {
                console.log("  Status: Disabled");
            }
        } else {
            console.warn(`Warning: Fee details for '${feeLabel}' (${feeId}) are not found in the data.`);
        }
    });

    console.log("-------------------------------------");
}