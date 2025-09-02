import { type Address, type Hex, parseUnits, getAddress } from 'viem';
import { type Deployment, getContract } from "@/lib/consts";
import { getAssetDecimals } from "@/lib/assets";
import * as PolicyTypes from "@/types/policies";
import { Policies } from "@enzymefinance/sdk/Configuration"; // NOTE: This is an assumed import path
import { UpdateType } from './hooks/useAddressList';
/**
 * Encodes an AddressListRegistry configuration into a Hex string.
 * This is a placeholder and should be implemented with the actual SDK function.
 * @param settings The AddressListRegistrySettings object.
 * @returns An encoded Hex string.
 */
// This helper function is a conceptual placeholder and would be replaced by a proper SDK call.
function encodeAddressListRegistrySettings(settings: PolicyTypes.AddressListRegistrySettings): Hex {
    console.warn("Placeholder function 'encodeAddressListRegistrySettings' called. Replace with actual SDK call.");
    // Example SDK call:
    // return Policies.AddressListRegistry.encodeSettings({
    //   existingListIds: settings.existingListIds.map(id => BigInt(id)),
    //   newListsArgs: settings.newListsArgs
    // });
    return '0x0';
}

/**
 * Encodes an AddressListRegistryPerUser configuration into a Hex string.
 * This is a placeholder and should be implemented with the actual SDK function.
 * @param settings The AddressListRegistryPerUserSettings object.
 * @returns An encoded Hex string.
 */
// This helper function is a conceptual placeholder and would be replaced by a proper SDK call.
function encodeAddressListRegistryPerUserSettings(settings: PolicyTypes.AddressListRegistryPerUserSettings): Hex {
    console.warn("Placeholder function 'encodeAddressListRegistryPerUserSettings' called. Replace with actual SDK call.");
    // Example SDK call: return Policies.AddressListRegistryPerUser.encodeSettings(settings);
    return '0x0';
}

/**
 * Encodes the policy configurations from the user's form data into a format
 * that can be used to deploy or reconfigure a vault.
 *
 * @param policies The complete policy configuration object from the form.
 * @param denominationAsset The denomination asset address to get decimals for.
 * @param deployment The current blockchain deployment (e.g., 'mainnet', 'goerli').
 * @returns An array of objects, each containing a policy contract address and its encoded settings.
 */
export function encodePolicyData(
    policies: PolicyTypes.VaultPolicyConfiguration,
    denominationAsset: Address,
    deployment: Deployment
): Array<PolicyTypes.EncodedPolicy> {
    const encodedPolicies: Array<PolicyTypes.EncodedPolicy> = [];

    console.log("Encoding policy data for deployment:", deployment);
    console.log("Denomination asset:", denominationAsset);

    // Iterate through all possible policy types to check if they are enabled.
    PolicyTypes.POLICY_TYPES.forEach((policyType: typeof PolicyTypes.POLICY_TYPES[number]) => {
        const policyId = policyType.id as PolicyTypes.PolicyTypeId;
        // We use a type assertion to inform the compiler that the policyDetails object
        // conforms to one of the specific policy types defined by PolicyByIdType.
        // This allows for type-safe access to the specific settings for each policy.
        const policyDetails = policies[policyId] as PolicyTypes.PolicyByIdType<PolicyTypes.PolicyTypeId>;

        console.log(`Processing policy type: ${policyId}`);

        // Proceed only if the policy is enabled and has settings
        if (policyDetails?.enabled && policyDetails.settings) {
            let policyConfig: Hex | null = null;
            let policyAddress: Address | null = null;

            // Use a switch statement to handle the specific encoding logic for each policy type.
            switch (policyId) {
                case "minMaxInvestment": {
                    console.log(`Encoding MinMaxInvestmentPolicy settings.`);
                    try {
                        // Type-safe access within the case block
                        const settings = policyDetails.settings as PolicyTypes.MinMaxInvestmentSettings;

                        // Get decimals from assets.ts based on denomination asset
                        const decimals = getAssetDecimals(denominationAsset, deployment);
                        console.log(`Using decimals for ${denominationAsset}:`, decimals);
                        
                        console.log(`Converting amounts - Min: ${settings.minInvestmentAmount}, Max: ${settings.maxInvestmentAmount}`);
                        const minAmount = parseUnits(settings.minInvestmentAmount, decimals);
                        const maxAmount = parseUnits(settings.maxInvestmentAmount, decimals);
                        console.log(`Parsed amounts - Min: ${minAmount.toString()}, Max: ${maxAmount.toString()}`);

                        policyConfig = Policies.MinMaxInvestment.encodeSettings({
                            minInvestmentAmount: minAmount,
                            maxInvestmentAmount: maxAmount
                        });
                        policyAddress = getContract(deployment, "MinMaxInvestmentPolicy");
                    } catch (error) {
                        console.error(`Error: MinMaxInvestment policy is enabled but has invalid amount data. Details: ${error}`);
                    }
                    break;
                }
                case "allowedDepositRecipients": {
                    console.log(`Encoding AllowedDepositRecipientsPolicy settings.`);
                    try {
                        const settings = policyDetails.settings as PolicyTypes.AddressListRegistrySettings;
                        const convertedSettings = {
                            existingListIds: settings.existingListIds.map(id => BigInt(id)),
                            newListsArgs: settings.newListsArgs.map(arg => ({
                                ...arg,
                                updateType: BigInt(UpdateType.None),
                                initialItems: arg.initialItems.map(item => getAddress(item))
                            }))
                        };
                        policyConfig = Policies.AllowedDepositRecipients.encodeSettings(convertedSettings);
                        policyAddress = getContract(deployment, "AllowedDepositRecipientsPolicy");
                    } catch (error) {
                        console.error(`Error: AllowedDepositRecipientsPolicy is enabled but has invalid settings. Details: ${error}`);
                    }
                    break;
                }
                case "cumulativeSlippageTolerance": {
                    console.log(`Encoding CumulativeSlippageTolerancePolicy settings.`);
                    try {
                        const settings = policyDetails.settings as PolicyTypes.CumulativeSlippageToleranceSettings;

                        // Use the provided SDK function to encode the settings
                        policyConfig = Policies.CumulativeSlippageTolerance.encodeSettings({ slippageTolerance: BigInt(settings.slippageTolerance) });
                        policyAddress = getContract(deployment, "CumulativeSlippageTolerancePolicy");
                    } catch (error) {
                        console.error(`Error: CumulativeSlippageTolerancePolicy is enabled but has invalid slippage tolerance. Details: ${error}`);
                    }
                    break;
                }
                case "allowedAdapters": {
                    console.log(`Encoding AllowedAdaptersPolicy settings.`);
                    // TODO: Add encoding logic.
                    break;
                }
                case "allowedAdapterIncomingAssets": {
                    console.log(`Encoding AllowedAdapterIncomingAssetsPolicy settings.`);
                    // TODO: Add encoding logic.
                    break;
                }
                case "disallowedAdapterIncomingAssets": {
                    console.log(`Encoding DisallowedAdapterIncomingAssetsPolicy settings.`);
                    // TODO: Add encoding logic.
                    break;
                }
                case "allowedAdaptersPerManager": {
                    console.log(`Encoding AllowedAdaptersPerManagerPolicy settings.`);
                    // TODO: Add encoding logic.
                    break;
                }
                case "allowedExternalPositionTypes": {
                    console.log(`Encoding AllowedExternalPositionTypesPolicy settings.`);
                    // TODO: Add encoding logic, converting string[] to BigInt[].
                    break;
                }
                case "allowedExternalPositionTypesPerManager": {
                    console.log(`Encoding AllowedExternalPositionTypesPerManagerPolicy settings.`);
                    // TODO: Add encoding logic.
                    break;
                }
                case "allowedAssetsForRedemption": {
                    console.log(`Encoding AllowedAssetsForRedemptionPolicy settings.`);
                    // TODO: Add encoding logic.
                    break;
                }
                case "allowedRedeemersForSpecificAssets": {
                    console.log(`Encoding AllowedRedeemersForSpecificAssetsPolicy settings.`);
                    // TODO: Add encoding logic.
                    break;
                }
                case "minAssetBalancesPostRedemption": {
                    console.log(`Encoding MinAssetBalancesPostRedemptionPolicy settings.`);
                    // TODO: Add encoding logic, iterating over assets and converting balances to BigInt.
                    break;
                }
                case "noDepegOnRedeemSharesForSpecificAssets": {
                    console.log(`Encoding NoDepegOnRedeemSharesForSpecificAssetsPolicy settings.`);
                    // TODO: Add encoding logic, iterating over asset configs.
                    break;
                }
                case "allowedSharesTransferRecipients": {
                    console.log(`Encoding AllowedSharesTransferRecipientsPolicy settings.`);
                    try {
                        const settings = policyDetails.settings as PolicyTypes.AddressListRegistrySettings;
                        const convertedSettings = {
                            existingListIds: settings.existingListIds.map(id => BigInt(id)),
                            newListsArgs: settings.newListsArgs.map(arg => ({
                                ...arg,
                                updateType: BigInt(UpdateType.None),
                                initialItems: arg.initialItems.map(item => getAddress(item))
                            }))
                        };
                        policyConfig = Policies.AllowedSharesTransferRecipients.encodeSettings(convertedSettings);
                        policyAddress = getContract(deployment, "AllowedSharesTransferRecipientsPolicy");
                    } catch (error) {
                        console.error(`Error: AllowedSharesTransferRecipientsPolicy is enabled but has invalid settings. Details: ${error}`);
                    }
                    break;
                }
            }

            // If encoding was successful, push the result to the array
            if (policyConfig && policyAddress) {
                console.log(`Policy ${policyId} push successfully, address: ${policyAddress}, config: ${policyConfig}`);
                encodedPolicies.push({
                    address: policyAddress,
                    settings: policyConfig,
                });
            } else if (!policyConfig) {
                console.warn(
                    `Warning: Encoding for policy type '${policyId}' failed or was not implemented.`
                );
            } else if (!policyAddress) {
                console.warn(
                    `Warning: Address for policy type '${policyId}' is missing.`
                );
            }
        }
    });

    return encodedPolicies;
}
