// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./IntelliDeFiToken.sol";
import {RiskLevel} from "./RiskLevelEnum.sol"; // Import directly with the name
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IntelliDeFiPortfolioManager
 * @dev Manages asset allocation and rebalancing for IntelliDeFi portfolios
 */
contract IntelliDeFiPortfolioManager is Ownable {
    using Math for uint256;

    // Asset struct for tracking portfolio components
    struct Asset {
        address tokenAddress; // Address of the ERC20 token
        uint256 allocation; // Target allocation in basis points (e.g., 5000 = 50%)
        bool isActive; // Whether this asset is active in the portfolio
        string symbol; // Symbol of the token for better UI display
    }

    // Portfolio struct
    struct Portfolio {
        IntelliDeFiToken tokenContract; // Reference to the investment token
        Asset[] assets; // Assets in this portfolio
        uint256 lastRebalanced; // Timestamp of last rebalance
        bool isActive; // Whether this portfolio is active
        string description; // Description of the portfolio strategy
    }

    // Mapping from risk level to portfolio
    mapping(RiskLevel => Portfolio) public portfolios;

    // Rebalance interval (default: 1 day)
    uint256 public rebalanceInterval = 1 days;

    // Events
    event PortfolioAdded(RiskLevel riskLevel, address tokenAddress);
    event AssetAdded(
        RiskLevel riskLevel,
        address assetAddress,
        uint256 allocation,
        string symbol
    );
    event AssetRemoved(RiskLevel riskLevel, address assetAddress);
    event AllocationUpdated(
        RiskLevel riskLevel,
        address assetAddress,
        uint256 newAllocation
    );
    event PortfolioRebalanced(RiskLevel riskLevel, uint256 newTotalValue);
    event PortfolioDescriptionUpdated(RiskLevel riskLevel, string description);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Adds a new portfolio to be managed
     * @param riskLevel Risk level of the portfolio
     * @param tokenAddress Address of the IntelliDeFiToken contract
     * @param description Description of the portfolio strategy
     */
    function addPortfolio(
        RiskLevel riskLevel,
        address tokenAddress,
        string memory description
    ) external onlyOwner {
        require(
            address(portfolios[riskLevel].tokenContract) == address(0),
            "Portfolio already exists"
        );
        require(tokenAddress != address(0), "Invalid token address");

        // Convert to address payable since the contract has a receive function
        address payable payableTokenAddress = payable(tokenAddress);
        portfolios[riskLevel].tokenContract = IntelliDeFiToken(
            payableTokenAddress
        );
        portfolios[riskLevel].lastRebalanced = block.timestamp;
        portfolios[riskLevel].isActive = true;
        portfolios[riskLevel].description = description;

        emit PortfolioAdded(riskLevel, tokenAddress);
    }

    /**
     * @dev Update portfolio description
     * @param riskLevel Risk level of the portfolio
     * @param description New description
     */
    function updatePortfolioDescription(
        RiskLevel riskLevel,
        string memory description
    ) external onlyOwner {
        require(portfolios[riskLevel].isActive, "Portfolio not active");
        portfolios[riskLevel].description = description;
        emit PortfolioDescriptionUpdated(riskLevel, description);
    }

    /**
     * @dev Adds an asset to a portfolio
     * @param riskLevel Risk level of the portfolio
     * @param assetAddress Address of the asset token
     * @param allocation Target allocation in basis points
     * @param symbol Symbol of the token
     */
    function addAsset(
        RiskLevel riskLevel,
        address assetAddress,
        uint256 allocation,
        string memory symbol
    ) external onlyOwner {
        require(portfolios[riskLevel].isActive, "Portfolio not active");
        require(assetAddress != address(0), "Invalid asset address");
        require(allocation > 0 && allocation <= 10000, "Invalid allocation");

        // Check if asset already exists
        for (uint i = 0; i < portfolios[riskLevel].assets.length; i++) {
            require(
                portfolios[riskLevel].assets[i].tokenAddress != assetAddress,
                "Asset already exists"
            );
        }

        // Check total allocation doesn't exceed 100%
        uint256 totalAllocation = getTotalAllocation(riskLevel);
        require(
            totalAllocation + allocation <= 10000,
            "Total allocation exceeds 100%"
        );

        // Add asset
        Asset memory newAsset = Asset({
            tokenAddress: assetAddress,
            allocation: allocation,
            isActive: true,
            symbol: symbol
        });

        portfolios[riskLevel].assets.push(newAsset);

        emit AssetAdded(riskLevel, assetAddress, allocation, symbol);
    }

    /**
     * @dev Removes an asset from a portfolio
     * @param riskLevel Risk level of the portfolio
     * @param assetAddress Address of the asset token
     */
    function removeAsset(
        RiskLevel riskLevel,
        address assetAddress
    ) external onlyOwner {
        require(portfolios[riskLevel].isActive, "Portfolio not active");

        bool found = false;
        for (uint i = 0; i < portfolios[riskLevel].assets.length; i++) {
            if (portfolios[riskLevel].assets[i].tokenAddress == assetAddress) {
                portfolios[riskLevel].assets[i].isActive = false;
                found = true;
                break;
            }
        }

        require(found, "Asset not found");

        emit AssetRemoved(riskLevel, assetAddress);
    }

    /**
     * @dev Updates the allocation for an asset
     * @param riskLevel Risk level of the portfolio
     * @param assetAddress Address of the asset token
     * @param newAllocation New target allocation in basis points
     */
    function updateAllocation(
        RiskLevel riskLevel,
        address assetAddress,
        uint256 newAllocation
    ) external onlyOwner {
        require(portfolios[riskLevel].isActive, "Portfolio not active");
        require(
            newAllocation > 0 && newAllocation <= 10000,
            "Invalid allocation"
        );

        bool found = false;
        uint256 oldAllocation = 0;

        for (uint i = 0; i < portfolios[riskLevel].assets.length; i++) {
            if (
                portfolios[riskLevel].assets[i].tokenAddress == assetAddress &&
                portfolios[riskLevel].assets[i].isActive
            ) {
                oldAllocation = portfolios[riskLevel].assets[i].allocation;
                portfolios[riskLevel].assets[i].allocation = newAllocation;
                found = true;
                break;
            }
        }

        require(found, "Active asset not found");

        // Check total allocation doesn't exceed 100%
        uint256 totalAllocation = getTotalAllocation(riskLevel);
        totalAllocation -= oldAllocation;
        totalAllocation += newAllocation;
        require(totalAllocation <= 10000, "Total allocation exceeds 100%");

        emit AllocationUpdated(riskLevel, assetAddress, newAllocation);
    }

    /**
     * @dev Rebalances a portfolio to match target allocations
     * This is a simplified version - in a real implementation, you would:
     * 1. Interact with DEXs to trade assets
     * 2. Handle slippage and gas optimization
     * 3. Use flashloans for efficient rebalancing
     * @param riskLevel Risk level of the portfolio to rebalance
     */
    function rebalancePortfolio(RiskLevel riskLevel) external onlyOwner {
        require(portfolios[riskLevel].isActive, "Portfolio not active");
        require(
            block.timestamp >=
                portfolios[riskLevel].lastRebalanced + rebalanceInterval,
            "Rebalance interval not reached"
        );

        Portfolio storage portfolio = portfolios[riskLevel];

        // Calculate current portfolio value (simplified)
        uint256 totalValue = calculatePortfolioValue(riskLevel);

        // Update the portfolio value in the token contract
        portfolio.tokenContract.updatePortfolioValue(totalValue);

        // Record rebalance timestamp
        portfolio.lastRebalanced = block.timestamp;

        emit PortfolioRebalanced(riskLevel, totalValue);
    }

    /**
     * @dev Updates the rebalance interval
     * @param newInterval New interval in seconds
     */
    function setRebalanceInterval(uint256 newInterval) external onlyOwner {
        require(newInterval > 0, "Interval must be greater than 0");
        rebalanceInterval = newInterval;
    }

    /**
     * @dev Calculates the total value of a portfolio
     * This is a simplified placeholder - in reality, you would:
     * 1. Get real-time prices from oracles
     * 2. Calculate accurate token values
     * @param riskLevel Risk level of the portfolio
     */
    function calculatePortfolioValue(
        RiskLevel riskLevel
    ) public view returns (uint256) {
        // In a real implementation, this would fetch prices from oracles and
        // use the riskLevel parameter to determine the specific portfolio

        // For now, just return the contract's ETH balance as a placeholder
        // We're ignoring riskLevel in this simplified implementation
        return address(this).balance;
    }

    /**
     * @dev Calculates the total allocation of active assets in a portfolio
     * @param riskLevel Risk level of the portfolio
     */
    function getTotalAllocation(
        RiskLevel riskLevel
    ) public view returns (uint256) {
        uint256 total = 0;

        for (uint i = 0; i < portfolios[riskLevel].assets.length; i++) {
            if (portfolios[riskLevel].assets[i].isActive) {
                total += portfolios[riskLevel].assets[i].allocation;
            }
        }

        return total;
    }

    /**
     * @dev Gets the number of assets in a portfolio
     * @param riskLevel Risk level of the portfolio
     */
    function getAssetCount(
        RiskLevel riskLevel
    ) external view returns (uint256) {
        return portfolios[riskLevel].assets.length;
    }

    /**
     * @dev Gets information about an asset in a portfolio
     * @param riskLevel Risk level of the portfolio
     * @param index Index of the asset
     */
    function getAssetInfo(
        RiskLevel riskLevel,
        uint256 index
    )
        external
        view
        returns (
            address tokenAddress,
            uint256 allocation,
            bool isActive,
            string memory symbol
        )
    {
        require(
            index < portfolios[riskLevel].assets.length,
            "Index out of bounds"
        );

        Asset memory asset = portfolios[riskLevel].assets[index];
        return (
            asset.tokenAddress,
            asset.allocation,
            asset.isActive,
            asset.symbol
        );
    }

    /**
     * @dev Get portfolio description
     * @param riskLevel Risk level of the portfolio
     */
    function getPortfolioDescription(
        RiskLevel riskLevel
    ) external view returns (string memory) {
        return portfolios[riskLevel].description;
    }

    /**
     * @dev Receives ETH
     */
    receive() external payable {}
}
