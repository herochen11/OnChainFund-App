// // src/config/sepolia-environment.ts
// import type { Environment } from '@enzymefinance/sdk'

export const CUSTOM_SEPOLIA_ENVIRONMENT: Environment = {
    network: 'sepolia',
    contracts: {
        // Core Protocol Contracts
        dispatcher: '0x9B91d2C791ac9131a92870B275b68aF10302BC5e',
        fundDeployer: '0x9D2C19a267caDA33da70d74aaBF9d2f75D3CdC14',
        vaultLib: '0xA80fb184FFd5d4Df02df89E845E6ccFF5739a71E',
        comptrollerLib: '0xbA64fC61f6143BE2F6ac08Bd26C3779F290caeA7',

        // Managers
        integrationManager: '0xA324963ED9c3124BB5b722a6790f67d72922F7a4',
        externalPositionManager: '0x8c25a544112B5FB86C673A845FE05d456CB5C19d',
        feeManager: '0x114b2CbEf5e277dBF5B2E88845b6487e17120Ba5',
        policyManager: '0x26b662B1b5a6C0e68497867C2ECa45775d5f172a',

        // Infrastructure
        valueInterpreter: '0x070392A9CAd314Cf9C6F6943B9EaF564cA789679',
        globalConfigProxy: '0x5191A3BaaC172B27D9DDA8Cc157611dE4029d543',
        globalConfigLib: '0x44Ca7818EB4CfF08FFAD67Da409764E7290B0b1A',
        protocolFeeReserveProxy: '0x9f344b8AdF9101FC58Faf01e860745117cd1eA52',
        protocolFeeReserveLib: '0x15A211B8572AdBE2D3B28789B54D11eFA51503f3',
        protocolFeeTracker: '0xE63e99885DD46336f3A44C435a83298A562ccC47',
        UsdEthSimulatedAggregator: '0xB67e203F120796ECe9adD32F6E042b86Cd66f8b3',

        // Registries
        uintListRegistry: '0x24b5Eaf1E8aF1218c2528f6936B62e090801bD0C',
        addressListRegistry: '0x6D0b3882dF46A81D42cCce070ce5E46ea26BAcA5',

        // Factories
        externalPositionFactory: '0x2EF63816Be5eAa439808DF6aD7D84f281175376a',
        gatedRedemptionQueueSharesWrapperFactory: '0x340c1089cA02D93D231e57d42365dffe92736a72',
        manualValueOracleFactory: '0xBFf62D9D715B41D7F1F81B79D47AE3FE3E9a7f95',
        sharesSplitterFactory: '0xeCcAE19014F5a4DD6044e71FB722099f04A0FBbd',
        gasRelayPaymasterFactory: '0xf0BbD03c7C3Df1ab042dcB8Ee55100c84887B6B7',

        // Libraries
        gatedRedemptionQueueSharesWrapperLib: '0x3D6Ddff54bb45c7a4f78422010782626c04A60CC',
        gasRelayPaymasterLib: '0x8aF7c7121B5dA62e8A64243D1333AF60Fb3B0a4a',

        // Wrappers
        unpermissionedActionsWrapper: '0x21bD00cAB9a1dc97160049f3D993E4811bF1f740',

        // Forwarder
        acceptsContractSignaturesForwarder: '0x56D4B9419A642001E445fa8bcE95dc290E0015c9',

        // Policies
        allowedAdaptersPolicy: '0x093dA613c892F399D4A8cBD97653E4a6B98c0941',
        allowedDepositRecipientsPolicy: '0x0eD7E38C4535989e392843884326925B4469EB5A',
        allowedExternalPositionTypesPerManagerPolicy: '0x12a45E257A4F5f8dae71DB286ae7C28D4CCB68a3',
        allowedAdaptersPerManagerPolicy: '0x1cEe44296A4C34A6fB166546bdD1959320abeFf3',
        allowedAssetsForRedemptionPolicy: '0x558B4b439F1215ED6729f97bd0D53Be9C47761f0',
        allowedAdapterIncomingAssetsPolicy: '0x5A1a51Ef2E5b40fAa011F426458b64b27553bf82',
        allowedExternalPositionTypesPolicy: '0x645bc7210db76A0d02728e18dDdbDbc22840E6a1',
        cumulativeSlippageTolerancePolicy: '0x6e9DD890b6Eb8192B0Fa2A6C16F0B75586Ce243b',
        onlyUniqueAssetsExternalPositionPolicy: '0xADF43d950050484e8837083f15D4a0FF3f01D6CD',
        onlyRemoveDustExternalPositionPolicy: '0xF0d4D67c946bD94e5a49EaA2785c30002Dc0a0A3',
        allowedSharesTransferRecipientsPolicy: '0xaF31e96BcF22842B1BB5E8B722539b740B054518',
        minMaxInvestmentPolicy: '0xe0255c9f3B8e7DC07Cb460D09c713EA51f44feE2',
        minAssetBalancesPostRedemptionPolicy: '0xf714215E2c05b7D589746D0697Db7DBb43286fBe',
        NoDepegOnRedeemSharesForSpecificAssetsPolicy: '0x1F2Ed989462e4e9BE9441546B958a28bd3a24C8f',

        // Fees
        entranceRateBurnFee: '0x5D61e15A8dEE2460C2E4168AB4Ac93845255DC29',
        managementFee: '0x5c25D5d0C2cad652992bA417f8FA054F8930Ef99',
        performanceFee: '0x82EDeB07c051D6461acD30c39b5762D9523CEf1C',
        entranceRateDirectFee: '0xA7259E45c7Be47a5bED94EDc252FADB09769a326',
        exitRateDirectFee: '0xD00DD49568CE5f8894E7a10f33c0AC513D9552c4',
        exitRateBurnFee: '0xd41fd35227c57cF3Bb3884234EB6c39738Ff7C3B',
        minSharesSupplyFee: '0xeA806dc949353fb396012C67bcbE4c0C00066afB'
    },
    subgraph: {
        // You'll need to deploy your own subgraph or use a public one for Sepolia
        // For now, you can use the mainnet subgraph URL as a placeholder
        url: 'https://api.thegraph.com/subgraphs/name/enzymefinance/enzyme'
    }
}