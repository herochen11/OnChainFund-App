import { type CreateVaultFormData } from '@/types/vault';
import * as PolicyTypes from '@/types/policies';

/**
 * Logs the detailed configuration for all vault policies.
 * @param data The CreateVaultFormData object containing policy details.
 */
export function logPoliciesConfig(data: CreateVaultFormData): void {
    console.log("--- Vault Policy Configuration Debug ---");

    if (!data || !data.policies) {
        console.error("Error: Vault data or policies object is missing.");
        return;
    }

    PolicyTypes.POLICY_TYPES.forEach(policyType => {
        const policyId = policyType.id;
        const policyLabel = policyType.label;
        // Dynamically access the policy details using the policy ID
        const policyDetails = data.policies[policyId as PolicyTypes.PolicyTypeId];

        if (policyDetails) {
            console.log(`\n${policyLabel} (${policyId}):`);
            console.log("  Enabled:", policyDetails.enabled);

            if (policyDetails.enabled && policyDetails.settings) {
                // Use a switch statement on the unique policy ID to handle specific logging
                switch (policyId) {
                    case "minMaxInvestment": {
                        const settings = policyDetails.settings as PolicyTypes.MinMaxInvestmentSettings;
                        console.log("  Min Investment Amount:", settings.minInvestmentAmount);
                        console.log("  Max Investment Amount:", settings.maxInvestmentAmount);
                        break;
                    }
                    case "allowedDepositRecipients": {
                        const settings = policyDetails.settings as PolicyTypes.AddressListRegistrySettings;
                        console.log(`  Existing Lists: ${settings.existingListIds.length} list(s)`);
                        console.log(`  New Lists: ${settings.newListsArgs.length} list(s)`);
                        settings.newListsArgs.forEach((list, index) => {
                            console.log(`    - New List ${index + 1}: ${list.initialItems.length} addresses`);
                        });
                        break;
                    }
                    case "cumulativeSlippageTolerance": {
                        const settings = policyDetails.settings as PolicyTypes.CumulativeSlippageToleranceSettings;
                        console.log("  Slippage Tolerance (in BPS):", settings.slippageTolerance);
                        break;
                    }
                    case "allowedAdapters": {
                        const settings = policyDetails.settings as PolicyTypes.AddressListRegistrySettings;
                        console.log(`  Existing Lists: ${settings.existingListIds.length} list(s)`);
                        console.log(`  New Lists: ${settings.newListsArgs.length} list(s)`);
                        settings.newListsArgs.forEach((list, index) => {
                            console.log(`    - New List ${index + 1}: ${list.initialItems.length} addresses`);
                        });
                        break;
                    }
                    case "allowedAdapterIncomingAssets": {
                        const settings = policyDetails.settings as PolicyTypes.AddressListRegistrySettings;
                        console.log(`  Existing Lists: ${settings.existingListIds.length} list(s)`);
                        console.log(`  New Lists: ${settings.newListsArgs.length} list(s)`);
                        settings.newListsArgs.forEach((list, index) => {
                            console.log(`    - New List ${index + 1}: ${list.initialItems.length} addresses`);
                        });
                        break;
                    }
                    case "disallowedAdapterIncomingAssets": {
                        const settings = policyDetails.settings as PolicyTypes.AddressListRegistrySettings;
                        console.log(`  Existing Lists: ${settings.existingListIds.length} list(s)`);
                        console.log(`  New Lists: ${settings.newListsArgs.length} list(s)`);
                        settings.newListsArgs.forEach((list, index) => {
                            console.log(`    - New List ${index + 1}: ${list.initialItems.length} addresses`);
                        });
                        break;
                    }
                    case "allowedAdaptersPerManager": {
                        const settings = policyDetails.settings as PolicyTypes.AddressListRegistryPerUserSettings;
                        console.log(`  Managers with Custom Lists: ${settings.users.length}`);
                        settings.users.forEach((user, index) => {
                            console.log(`    - Manager ${user}: ${settings.listsData[index]?.newListsArgs[0]?.initialItems.length} addresses`);
                        });
                        break;
                    }
                    case "allowedExternalPositionTypes": {
                        const settings = policyDetails.settings as PolicyTypes.AllowedExternalPositionTypesSettings;
                        console.log(`  Allowed External Position Types: ${settings.externalPositionTypeIds.length} type(s)`);
                        console.log("    IDs:", settings.externalPositionTypeIds.join(", "));
                        break;
                    }
                    case "allowedExternalPositionTypesPerManager": {
                        const settings = policyDetails.settings as PolicyTypes.AddressListRegistryPerUserSettings;
                        console.log(`  Managers with Custom Lists: ${settings.users.length}`);
                        settings.users.forEach((user, index) => {
                            console.log(`    - Manager ${user}: ${settings.listsData[index]?.newListsArgs[0]?.initialItems.length} addresses`);
                        });
                        break;
                    }
                    case "allowedAssetsForRedemption": {
                        const settings = policyDetails.settings as PolicyTypes.AddressListRegistrySettings;
                        console.log(`  Existing Lists: ${settings.existingListIds.length} list(s)`);
                        console.log(`  New Lists: ${settings.newListsArgs.length} list(s)`);
                        settings.newListsArgs.forEach((list, index) => {
                            console.log(`    - New List ${index + 1}: ${list.initialItems.length} addresses`);
                        });
                        break;
                    }
                    case "allowedRedeemersForSpecificAssets": {
                        const settings = policyDetails.settings as PolicyTypes.AddressListRegistrySettings;
                        console.log(`  Existing Lists: ${settings.existingListIds.length} list(s)`);
                        console.log(`  New Lists: ${settings.newListsArgs.length} list(s)`);
                        settings.newListsArgs.forEach((list, index) => {
                            console.log(`    - New List ${index + 1}: ${list.initialItems.length} addresses`);
                        });
                        break;
                    }
                    case "minAssetBalancesPostRedemption": {
                        const settings = policyDetails.settings as PolicyTypes.MinAssetBalancesPostRedemptionSettings;
                        settings.assetToMinBalance.forEach(item => {
                            console.log(`  Min Balance for ${item.asset}:`, item.minBalance);
                        });
                        break;
                    }
                    case "noDepegOnRedeemSharesForSpecificAssets": {
                        const settings = policyDetails.settings as PolicyTypes.AssetConfigSettings;
                        settings.assetConfigs.forEach(config => {
                            console.log(`  Asset: ${config.asset}`);
                            console.log(`    Reference Asset: ${config.referenceAsset}`);
                            console.log(`    Deviation Tolerance (in BPS): ${config.deviationToleranceInBps}`);
                        });
                        break;
                    }
                    case "allowedSharesTransferRecipients": {
                        const settings = policyDetails.settings as PolicyTypes.AddressListRegistrySettings;
                        console.log(`  Existing Lists: ${settings.existingListIds.length} list(s)`);
                        console.log(`  New Lists: ${settings.newListsArgs.length} list(s)`);
                        settings.newListsArgs.forEach((list, index) => {
                            console.log(`    - New List ${index + 1}: ${list.initialItems.length} addresses`);
                        });
                        break;
                    }
                }
            } else if (!policyDetails.enabled) {
                console.log("  Status: Disabled");
            }
        } else {
            console.warn(`Warning: Policy details for '${policyLabel}' (${policyId}) are not found in the data.`);
        }
    });

    console.log("-------------------------------------");
}
