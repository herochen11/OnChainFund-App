// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.0 <0.9.0;

interface IFundValueCalculatorRouter {
    event FundValueCalculatorUpdated(address indexed fundDeployer, address fundValueCalculator);

    function calcGav(address _vaultProxy) external returns (address denominationAsset_, uint256 gav_);
    function calcGavInAsset(address _vaultProxy, address _quoteAsset) external returns (uint256 gav_);
    function calcGrossShareValue(address _vaultProxy)
        external
        returns (address denominationAsset_, uint256 grossShareValue_);
    function calcGrossShareValueInAsset(address _vaultProxy, address _quoteAsset)
        external
        returns (uint256 grossShareValue_);
    function calcNav(address _vaultProxy) external returns (address denominationAsset_, uint256 nav_);
    function calcNavInAsset(address _vaultProxy, address _quoteAsset) external returns (uint256 nav_);
    function calcNetShareValue(address _vaultProxy)
        external
        returns (address denominationAsset_, uint256 netShareValue_);
    function calcNetShareValueInAsset(address _vaultProxy, address _quoteAsset)
        external
        returns (uint256 netShareValue_);
    function calcNetValueForSharesHolder(address _vaultProxy, address _sharesHolder)
        external
        returns (address denominationAsset_, uint256 netValue_);
    function calcNetValueForSharesHolderInAsset(address _vaultProxy, address _sharesHolder, address _quoteAsset)
        external
        returns (uint256 netValue_);
    function getDispatcher() external view returns (address dispatcher_);
    function getFundValueCalculatorForFundDeployer(address _fundDeployer)
        external
        view
        returns (address fundValueCalculator_);
    function getFundValueCalculatorForVault(address _vaultProxy)
        external
        view
        returns (address fundValueCalculatorContract_);
    function setFundValueCalculators(address[] memory _fundDeployers, address[] memory _fundValueCalculators)
        external;
}
