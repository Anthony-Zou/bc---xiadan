// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./RiskLevelEnum.sol"; // Ensure this file exists and defines the RiskLevel enum
// SafeMath is not needed for Solidity >= 0.8.0

/**
 * @title IntelliDeFiToken
 * @dev ERC20 token representing investment shares in the IntelliDeFi platform
 */
contract IntelliDeFiToken is ERC20, Ownable {
    // SafeMath is not required for Solidity >= 0.8.0

    uint256 private constant FEE_BASIS_POINTS = 30; // 0.3% fee
    uint256 private constant BASIS_POINTS = 10000; // 100%

    uint256 private totalInvested;
    uint256 private currentPortfolioValue;

    // Token price in wei
    uint256 private _tokenPrice;

    // Risk level of this investment token
    RiskLevel public riskLevel;

    // Fee percentage (in basis points, e.g., 50 = 0.5%)
    uint256 public feePercentage;

    // Portfolio value tracking
    uint256 public totalPortfolioValue;

    // Add a new variable to track the portfolio manager
    address public portfolioManager;

    // Events
    event Invested(
        address indexed investor,
        uint256 amount,
        uint256 tokensMinted
    );
    event Withdrawn(
        address indexed investor,
        uint256 tokens,
        uint256 amountReturned
    );
    event PortfolioRebalanced(uint256 newTotalValue);
    event RiskLevelChanged(RiskLevel newRiskLevel);

    /**
     * @dev Constructor
     * @param name Name of the token
     * @param symbol Symbol of the token
     * @param initialRiskLevel Initial risk level of the investment token
     * @param initialFeePercentage Initial fee percentage in basis points
     */
    constructor(
        string memory name,
        string memory symbol,
        RiskLevel initialRiskLevel,
        uint256 initialFeePercentage
    ) ERC20(name, symbol) Ownable(msg.sender) {
        riskLevel = initialRiskLevel;
        feePercentage = initialFeePercentage;
        _tokenPrice = 1 ether; // Initially 1 token = 1 ETH (for simplicity)
        totalPortfolioValue = 0;
        currentPortfolioValue = 0;
    }

    /**
     * @dev Receive function to handle direct ETH transfers
     * This allows users to invest by simply sending ETH to the contract
     */
    receive() external payable {
        invest();
    }

    /**
     * @dev Allows users to invest ETH and receive tokens
     */
    function invest() public payable {
        require(msg.value > 0, "Investment amount must be greater than 0");

        uint256 fee = (msg.value * feePercentage) / BASIS_POINTS;
        uint256 investAmount = msg.value - fee;

        totalInvested += investAmount;
        currentPortfolioValue += investAmount;

        // Calculate tokens to mint (accounting for current token price)
        uint256 tokensToMint;
        if (totalSupply() == 0) {
            tokensToMint = investAmount;
        } else {
            tokensToMint =
                (investAmount * totalSupply()) /
                (currentPortfolioValue - investAmount);
        }

        _mint(msg.sender, tokensToMint);

        emit Invested(msg.sender, msg.value, tokensToMint);
    }

    /**
     * @dev Allows users to withdraw their investment
     * @param tokenAmount Amount of tokens to redeem
     */
    function withdraw(uint256 tokenAmount) external {
        require(tokenAmount > 0, "Withdrawal amount must be greater than 0");
        require(
            balanceOf(msg.sender) >= tokenAmount,
            "Insufficient token balance"
        );

        uint256 withdrawValue = (tokenAmount * currentPortfolioValue) /
            totalSupply();
        uint256 fee = (withdrawValue * FEE_BASIS_POINTS) / BASIS_POINTS;
        uint256 amountToTransfer = withdrawValue - fee;

        totalInvested -= withdrawValue;
        currentPortfolioValue -= withdrawValue;

        _burn(msg.sender, tokenAmount);

        payable(msg.sender).transfer(amountToTransfer);

        emit Withdrawn(msg.sender, tokenAmount, amountToTransfer);
    }

    /**
     * @dev Updates token price based on portfolio performance
     * @param newTotalValue New total value of the portfolio
     */
    function updatePortfolioValue(uint256 newTotalValue) external onlyOwner {
        require(newTotalValue > 0, "New value must be greater than 0");

        totalPortfolioValue = newTotalValue;
        currentPortfolioValue = newTotalValue;

        // Update token price based on new portfolio value
        if (totalSupply() > 0) {
            _tokenPrice = (totalPortfolioValue * 1 ether) / totalSupply();
        }

        emit PortfolioRebalanced(newTotalValue);
    }

    /**
     * @dev Changes the risk level of the investment token
     * @param newRiskLevel New risk level
     */
    function setRiskLevel(RiskLevel newRiskLevel) external onlyOwner {
        riskLevel = newRiskLevel;
        emit RiskLevelChanged(newRiskLevel);
    }

    /**
     * @dev Updates fee percentage
     * @param newFeePercentage New fee percentage in basis points
     */
    function setFeePercentage(uint256 newFeePercentage) external onlyOwner {
        require(newFeePercentage <= 1000, "Fee percentage too high"); // Max 10%
        feePercentage = newFeePercentage;
    }

    /**
     * @dev Set the portfolio manager address
     * @param _portfolioManager Address of the portfolio manager
     */
    function setPortfolioManager(address _portfolioManager) external onlyOwner {
        require(_portfolioManager != address(0), "Invalid manager address");
        portfolioManager = _portfolioManager;
    }

    /**
     * @dev Get the current portfolio composition
     * Only callable by portfolio manager
     */
    function getPortfolioComposition() external view returns (string memory) {
        // This would be implemented by the portfolio manager
        // Just a placeholder for the interface
        return "";
    }

    /**
     * @dev Returns current token price
     */
    function getTokenPrice() public view returns (uint256) {
        if (totalSupply() == 0) return 1e18; // Default to 1 ETH if no tokens
        return (currentPortfolioValue * 1e18) / totalSupply();
    }

    /**
     * @dev Calculates how many tokens would be minted for a given ETH amount
     * @param ethAmount Amount of ETH
     */
    function getExpectedTokenAmount(
        uint256 ethAmount
    ) external view returns (uint256) {
        uint256 fee = (ethAmount * feePercentage) / 10000;
        uint256 investmentAmount = ethAmount - fee;
        return (investmentAmount * 1 ether) / _tokenPrice;
    }

    /**
     * @dev Calculates how much ETH would be returned for a given token amount
     * @param tokenAmount Amount of tokens
     */
    function getExpectedEthAmount(
        uint256 tokenAmount
    ) external view returns (uint256) {
        uint256 ethAmount = (tokenAmount * _tokenPrice) / 1 ether;
        uint256 fee = (ethAmount * feePercentage) / 10000;
        return ethAmount - fee;
    }

    function getTotalInvested() external view returns (uint256) {
        return totalInvested;
    }

    function getCurrentPortfolioValue() external view returns (uint256) {
        return currentPortfolioValue;
    }
}
