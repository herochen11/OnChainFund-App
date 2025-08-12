import { type Address, getAddress } from "viem";

export type Deployment = typeof deployments[number];
export const deployments = ["ethereum", "polygon", "testnet"] as const;

export type Network = typeof networks[number];
export const networks = ["ethereum", "polygon", "sepolia"] as const;

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function getNetworkByDeployment(deployment: Deployment): Network {
  switch (deployment) {
    case "ethereum":
      return "ethereum";
    case "polygon":
      return "polygon";
    case "testnet":
      return "sepolia";
  }
}

type Contracts = {
  AllowedAdaptersPolicy: Address;
  AllowedAdapterIncomingAssetsPolicy: Address;
  AllowedAdaptersPerManager: Address;
  AllowedAssetsForRedemptionPolicy: Address;
  AllowedDepositRecipientsPolicy: Address;
  AllowedExternalPositionTypesPerManagerPolicy: Address;
  AllowedExternalPositionTypesPolicy: Address;
  AllowedSharesTransferRecipientsPolicy: Address;
  CumulativeSlippageTolerancePolicy: Address;
  Dispatcher: Address;
  ExternalPositionFactory: Address;
  ExitRateBurnFee: Address;
  ExitRateDirectFee: Address;
  EntranceRateBurnFee: Address;
  EntranceRateDirectFee: Address;
  FundValueCalculatorRouter: Address;
  ManagementFee: Address;
  MinAssetBalancesPostRedemptionPolicy: Address;
  MinSharesSupplyFee: Address;
  MinMaxInvestmentPolicy: Address;
  OnlyRemoveDustExternalPositionPolicy: Address;
  OnlyUntrackDustOrPricelessAssets: Address;
  PerformanceFee: Address;
  FundDeployer: Address;
  Usdc: Address;
  WETH: Address;
  WBTC: Address;
  DAI: Address;
  ASVT: Address;
};

const contracts: {
  [deployment in Deployment]: Contracts;
} = {
  ethereum: {
    AllowedAdaptersPolicy: "0x720ef97bf835699fcf07591952cd2b132d63a6c0",
    AllowedAdapterIncomingAssetsPolicy: "0x2f0e55830a173d845a886fd574f01a039a07fc37",
    AllowedAdaptersPerManager: "0xa4507d51c5270ff91229b76300ff90774384d144",
    AllowedDepositRecipientsPolicy: "0xa66baaa0ccb6468c5a2cb61f5d672c7ba0440ee1",
    AllowedExternalPositionTypesPerManagerPolicy: "0x47fb78995d945d501f6f9bad343d7ce7d3db54ab",
    AllowedExternalPositionTypesPolicy: "0x9e076e7d35a3b881ab9e3da958431630fdfa756f",
    AllowedAssetsForRedemptionPolicy: "0x823ca839da344da59d517b84ce3bab9ffc9f54ee",
    AllowedSharesTransferRecipientsPolicy: "0xebe37e43bc6b3aacfe318d6906fc80c4a2a7505a",
    CumulativeSlippageTolerancePolicy: "0x3a49d5aec385ac1bde99f305316b945c5ee71312",
    Dispatcher: "0xc3dc853dd716bd5754f421ef94fdcbac3902ab32",
    ExternalPositionFactory: "0x0aacb782205dde9eff4862ace9849dce1ca3409f",
    EntranceRateBurnFee: "0xcdec5bbecc6d2c004d5378a63a3c484c2643ed9d",
    EntranceRateDirectFee: "0xfb8df7d5e320020cd8047226b81cf6d68f3e3c19",
    ExitRateBurnFee: "0x06b13918E988D1314dA1a9dA4C0cdE5fe994364a",
    ExitRateDirectFee: "0x3a09d11c20aa1ad38c77b4f426901d3427f73fbe",
    FundValueCalculatorRouter: "0x7c728cd0CfA92401E01A4849a01b57EE53F5b2b9",
    ManagementFee: "0xfaf2c3db614e9d38fe05edc634848be7ff0542b9",
    MinAssetBalancesPostRedemptionPolicy: "0x58c0a2a546b3903fa68a53e34ee0c8a02aabfad0",
    MinSharesSupplyFee: "0xbc9da8edde80ffb1294852d23ee1b385ea2d4929",
    MinMaxInvestmentPolicy: "0xebdadfc929c357d12281118828aea556db5be30c",
    OnlyRemoveDustExternalPositionPolicy: "0x966ec191ed9e026cb6f7e22bb2a284bad6a2838d",
    OnlyUntrackDustOrPricelessAssets: "0x747beaee139fba4a89fa71bebb5f21231530292b",
    PerformanceFee: "0xfedc73464dfd156d30f6524654a5d56e766da0c3",
    Usdc: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    WBTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    ASVT: "0x932b08d5553b7431FB579cF27565c7Cd2d4b8fE0",
  },
  polygon: {
    AllowedAdaptersPolicy: "0x4218783ae10bd1841e6664cf048ac295d8d27a4a",
    AllowedAdapterIncomingAssetsPolicy: "0xc192fd3b13549ad5bc3c0a0118a29556d0cdd482",
    AllowedAdaptersPerManager: "0x30ed4e3cf5e1faf6fc9776d256d535f3470bb710",
    AllowedAssetsForRedemptionPolicy: "0x71b8254f608a73162445655ff2f07ccb1586b3b6",
    AllowedDepositRecipientsPolicy: "0xe1853502e2ea2b7c14c5e89169c63065f5a459ff",
    AllowedExternalPositionTypesPerManagerPolicy: "0xb6367cd4b67c44e963ae81e9c1757a1c08ede28c",
    AllowedExternalPositionTypesPolicy: "0x5a739da3099fd4fc954bd764099fc000da76d8e7",
    AllowedSharesTransferRecipientsPolicy: "0x3b6913a8ed4595919a6b4a9022208cede20194bd",
    CumulativeSlippageTolerancePolicy: "0x1332367c181f1157f751b160187dcaa219706bf2",
    Dispatcher: "0x2e25271297537b8124b8f883a92ffd95c4032733",
    ExternalPositionFactory: "0x067eeea753aba0ddecca0b80bbb8b7572bf6580d",
    EntranceRateBurnFee: "0x01460ba35cb6f847d65c5eee124e7e9e10055f16",
    EntranceRateDirectFee: "0x88c9a11c7bb8bc274388d0db864ab87c14fb78b8",
    ExitRateBurnFee: "0x0bbb9635d12a9c022b647f379224d88874d37879",
    ExitRateDirectFee: "0xc5c7f7c6e5e2db074d96b440d30d7aab2c99b848",
    FundValueCalculatorRouter: "0xd70389a7d6171e1dba6c3df4db7331811fd93f08",
    ManagementFee: "0x97f13b3040a565be791d331b0edd4b1b58dbd843",
    MinAssetBalancesPostRedemptionPolicy: "0x9d940beaa6e3cfb441d49787fdf1db18d7f8251e",
    MinSharesSupplyFee: "0xeb45b91d582ae383e750a1626a97f854a9df19a3",
    MinMaxInvestmentPolicy: "0x8ac04e34d9c1d0bd5a440157538cc6fbb0dbbc9a",
    OnlyRemoveDustExternalPositionPolicy: "0xc0f49507c125a000e02ab58c22be9764e2abab99",
    OnlyUntrackDustOrPricelessAssets: "0x9f856372f7bd844dac0254c7859b117259b5c9d2",
    PerformanceFee: "0xbc63afe28c66a6279bd3a55a4d0d3ab61f479bdf",
    Usdc: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    WBTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    ASVT: "0x932b08d5553b7431FB579cF27565c7Cd2d4b8fE0",
  },
  testnet: {
    AllowedAdaptersPolicy: "0x093dA613c892F399D4A8cBD97653E4a6B98c0941",
    AllowedAdapterIncomingAssetsPolicy: "0x5A1a51Ef2E5b40fAa011F426458b64b27553bf82",
    AllowedAdaptersPerManager: "0x1cEe44296A4C34A6fB166546bdD1959320abeFf3",
    AllowedAssetsForRedemptionPolicy: "0x558B4b439F1215ED6729f97bd0D53Be9C47761f0",
    AllowedDepositRecipientsPolicy: "0x0eD7E38C4535989e392843884326925B4469EB5A",
    AllowedExternalPositionTypesPerManagerPolicy: "0x12a45E257A4F5f8dae71DB286ae7C28D4CCB68a3",
    AllowedExternalPositionTypesPolicy: "0x645bc7210db76A0d02728e18dDdbDbc22840E6a1",
    AllowedSharesTransferRecipientsPolicy: "0xaF31e96BcF22842B1BB5E8B722539b740B054518",
    CumulativeSlippageTolerancePolicy: "0x6e9DD890b6Eb8192B0Fa2A6C16F0B75586Ce243b",
    Dispatcher: "0x9B91d2C791ac9131a92870B275b68aF10302BC5e",
    EntranceRateBurnFee: "0x5D61e15A8dEE2460C2E4168AB4Ac93845255DC29",
    EntranceRateDirectFee: "0xA7259E45c7Be47a5bED94EDc252FADB09769a326",
    ExternalPositionFactory: "0x2EF63816Be5eAa439808DF6aD7D84f281175376a",
    ExitRateBurnFee: "0xd41fd35227c57cF3Bb3884234EB6c39738Ff7C3B",
    ExitRateDirectFee: "0xD00DD49568CE5f8894E7a10f33c0AC513D9552c4",
    FundValueCalculatorRouter: "0x070392A9CAd314Cf9C6F6943B9EaF564cA789679",
    ManagementFee: "0x5c25D5d0C2cad652992bA417f8FA054F8930Ef99",
    MinAssetBalancesPostRedemptionPolicy: "0xf714215E2c05b7D589746D0697Db7DBb43286fBe",
    MinSharesSupplyFee: "0xeA806dc949353fb396012C67bcbE4c0C00066afB",
    MinMaxInvestmentPolicy: "0xe0255c9f3B8e7DC07Cb460D09c713EA51f44feE2",
    OnlyRemoveDustExternalPositionPolicy: "0xF0d4D67c946bD94e5a49EaA2785c30002Dc0a0A3",
    OnlyUntrackDustOrPricelessAssets: "0xADF43d950050484e8837083f15D4a0FF3f01D6CD",
    PerformanceFee: "0x82EDeB07c051D6461acD30c39b5762D9523CEf1C",
    FundDeployer: "0x9D2C19a267caDA33da70d74aaBF9d2f75D3CdC14",
    Usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    WETH: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
    WBTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    ASVT: "0x932b08d5553b7431FB579cF27565c7Cd2d4b8fE0"
  },
};

export function getContract(deployment: Deployment, contract: keyof Contracts): Address {
  return getAddress(contracts[deployment][contract]);
}
