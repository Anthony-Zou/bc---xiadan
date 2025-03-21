import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("IntelliDeFiPortfolioManager", function () {
  let portfolioManager;
  let tokenContract;
  let mockTokens = [];
  let owner;
  let user1;
  let user2;

  // Using the enum from the contract
  const RiskLevel = {
    LOW: 0,
    MEDIUM: 1,
    HIGH: 2,
  };

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy the mock tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockTokens.push(await MockERC20.deploy("Mock DAI", "mDAI"));
    mockTokens.push(await MockERC20.deploy("Mock USDC", "mUSDC"));
    mockTokens.push(await MockERC20.deploy("Mock WETH", "mWETH"));
    mockTokens.push(await MockERC20.deploy("Mock WBTC", "mWBTC"));

    // Wait for all deployments
    for (let i = 0; i < mockTokens.length; i++) {
      await mockTokens[i].waitForDeployment();
    }

    // Deploy a token contract for testing
    const IntelliDeFiToken = await ethers.getContractFactory(
      "IntelliDeFiToken"
    );
    tokenContract = await IntelliDeFiToken.deploy(
      "IntelliDeFi Test Token",
      "IDFT",
      RiskLevel.MEDIUM, // Using the enum from the contract
      30 // 0.3% fee
    );
    await tokenContract.waitForDeployment();

    // Deploy the portfolio manager
    const IntelliDeFiPortfolioManager = await ethers.getContractFactory(
      "IntelliDeFiPortfolioManager"
    );
    portfolioManager = await IntelliDeFiPortfolioManager.deploy();
    await portfolioManager.waitForDeployment();

    // Send some ETH to the manager for testing
    await owner.sendTransaction({
      to: await portfolioManager.getAddress(),
      value: ethers.parseEther("5.0"),
    });
  });

  describe("Portfolio Management", function () {
    it("should allow adding a portfolio", async function () {
      await portfolioManager.addPortfolio(
        RiskLevel.MEDIUM,
        await tokenContract.getAddress()
      );

      // Check that the portfolio was added
      const [tokenAddress, , isActive] = await portfolioManager.portfolios(
        RiskLevel.MEDIUM
      );
      expect(tokenAddress).to.equal(await tokenContract.getAddress());
      expect(isActive).to.equal(true);
    });

    it("should prevent adding a duplicate portfolio", async function () {
      await portfolioManager.addPortfolio(
        RiskLevel.MEDIUM,
        await tokenContract.getAddress()
      );

      await expect(
        portfolioManager.addPortfolio(
          RiskLevel.MEDIUM,
          await tokenContract.getAddress()
        )
      ).to.be.revertedWith("Portfolio already exists");
    });

    it("should reject invalid token addresses", async function () {
      await expect(
        portfolioManager.addPortfolio(RiskLevel.MEDIUM, ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid token address");
    });

    it("should prevent non-owners from adding portfolios", async function () {
      await expect(
        portfolioManager
          .connect(user1)
          .addPortfolio(RiskLevel.MEDIUM, await tokenContract.getAddress())
      ).to.be.reverted;
    });
  });

  describe("Asset Management", function () {
    beforeEach(async function () {
      // Add a portfolio first
      await portfolioManager.addPortfolio(
        RiskLevel.MEDIUM,
        await tokenContract.getAddress()
      );
    });

    it("should allow adding assets to a portfolio", async function () {
      const mockTokenAddress = await mockTokens[0].getAddress();
      const allocation = 3000; // 30%

      await portfolioManager.addAsset(
        RiskLevel.MEDIUM,
        mockTokenAddress,
        allocation
      );

      // Check that the asset count increased
      expect(await portfolioManager.getAssetCount(RiskLevel.MEDIUM)).to.equal(
        1
      );

      // Check that the asset was added correctly
      const [tokenAddress, alloc, isActive] =
        await portfolioManager.getAssetInfo(RiskLevel.MEDIUM, 0);

      expect(tokenAddress).to.equal(mockTokenAddress);
      expect(alloc).to.equal(allocation);
      expect(isActive).to.equal(true);
    });

    it("should prevent adding the same asset twice", async function () {
      const mockTokenAddress = await mockTokens[0].getAddress();
      await portfolioManager.addAsset(RiskLevel.MEDIUM, mockTokenAddress, 3000);

      await expect(
        portfolioManager.addAsset(RiskLevel.MEDIUM, mockTokenAddress, 2000)
      ).to.be.revertedWith("Asset already exists");
    });

    it("should enforce allocation limits", async function () {
      // Try to add asset with 0% allocation
      await expect(
        portfolioManager.addAsset(
          RiskLevel.MEDIUM,
          await mockTokens[0].getAddress(),
          0
        )
      ).to.be.revertedWith("Invalid allocation");

      // Try to add asset with >100% allocation
      await expect(
        portfolioManager.addAsset(
          RiskLevel.MEDIUM,
          await mockTokens[0].getAddress(),
          10001
        )
      ).to.be.revertedWith("Invalid allocation");
    });

    it("should enforce total allocation limit", async function () {
      // Add assets that sum to 100%
      await portfolioManager.addAsset(
        RiskLevel.MEDIUM,
        await mockTokens[0].getAddress(),
        5000
      );

      await portfolioManager.addAsset(
        RiskLevel.MEDIUM,
        await mockTokens[1].getAddress(),
        5000
      );

      // Try to add another asset
      await expect(
        portfolioManager.addAsset(
          RiskLevel.MEDIUM,
          await mockTokens[2].getAddress(),
          1
        )
      ).to.be.revertedWith("Total allocation exceeds 100%");
    });
  });

  describe("Asset Updates and Removal", function () {
    beforeEach(async function () {
      // Add a portfolio first
      await portfolioManager.addPortfolio(
        RiskLevel.MEDIUM,
        await tokenContract.getAddress()
      );

      // Add some assets
      await portfolioManager.addAsset(
        RiskLevel.MEDIUM,
        await mockTokens[0].getAddress(),
        3000
      );

      await portfolioManager.addAsset(
        RiskLevel.MEDIUM,
        await mockTokens[1].getAddress(),
        2000
      );
    });

    it("should allow updating asset allocations", async function () {
      const newAllocation = 4000;

      await portfolioManager.updateAllocation(
        RiskLevel.MEDIUM,
        await mockTokens[0].getAddress(),
        newAllocation
      );

      // Check that allocation was updated
      const [, alloc] = await portfolioManager.getAssetInfo(
        RiskLevel.MEDIUM,
        0
      );

      expect(alloc).to.equal(newAllocation);
    });

    it("should prevent allocation updates that exceed 100%", async function () {
      await expect(
        portfolioManager.updateAllocation(
          RiskLevel.MEDIUM,
          await mockTokens[0].getAddress(),
          9000
        )
      ).to.be.revertedWith("Total allocation exceeds 100%");
    });

    it("should allow removing assets", async function () {
      await portfolioManager.removeAsset(
        RiskLevel.MEDIUM,
        await mockTokens[0].getAddress()
      );

      // Check that the asset is marked as inactive
      const [, , isActive] = await portfolioManager.getAssetInfo(
        RiskLevel.MEDIUM,
        0
      );

      expect(isActive).to.equal(false);
    });

    it("should fail when removing non-existent assets", async function () {
      await expect(
        portfolioManager.removeAsset(
          RiskLevel.MEDIUM,
          await mockTokens[3].getAddress()
        )
      ).to.be.revertedWith("Asset not found");
    });
  });

  describe("Portfolio Rebalancing", function () {
    beforeEach(async function () {
      // Add a portfolio first
      await portfolioManager.addPortfolio(
        RiskLevel.MEDIUM,
        await tokenContract.getAddress()
      );

      // Add some assets
      await portfolioManager.addAsset(
        RiskLevel.MEDIUM,
        await mockTokens[0].getAddress(),
        5000
      );

      await portfolioManager.addAsset(
        RiskLevel.MEDIUM,
        await mockTokens[1].getAddress(),
        5000
      );

      // Give token contract ownership to the portfolio manager for testing
      await tokenContract.transferOwnership(
        await portfolioManager.getAddress()
      );
    });

    it("should allow rebalancing the portfolio", async function () {
      // Fast forward time to allow rebalancing
      await ethers.provider.send("evm_increaseTime", [86401]); // 1 day + 1 second
      await ethers.provider.send("evm_mine");

      // Rebalance the portfolio
      await portfolioManager.rebalancePortfolio(RiskLevel.MEDIUM);

      // Check portfolio value was updated
      const portfolioValue = await portfolioManager.calculatePortfolioValue(
        RiskLevel.MEDIUM
      );
      expect(portfolioValue).to.be.gt(0);
    });

    it("should prevent rebalancing too frequently", async function () {
      // First rebalance
      await ethers.provider.send("evm_increaseTime", [86401]); // 1 day + 1 second
      await ethers.provider.send("evm_mine");
      await portfolioManager.rebalancePortfolio(RiskLevel.MEDIUM);

      // Try to rebalance again immediately without advancing time
      await expect(
        portfolioManager.rebalancePortfolio(RiskLevel.MEDIUM)
      ).to.be.revertedWith("Rebalance interval not reached");
    });

    it("should allow updating the rebalance interval", async function () {
      const newInterval = 12 * 3600; // 12 hours
      await portfolioManager.setRebalanceInterval(newInterval);

      // Fast forward less than a day but more than 12 hours
      await ethers.provider.send("evm_increaseTime", [12 * 3600 + 1]);
      await ethers.provider.send("evm_mine");

      // Now rebalancing should work
      await portfolioManager.rebalancePortfolio(RiskLevel.MEDIUM);
    });
  });

  describe("Utilities", function () {
    beforeEach(async function () {
      // Add a portfolio first
      await portfolioManager.addPortfolio(
        RiskLevel.MEDIUM,
        await tokenContract.getAddress()
      );

      // Add some assets
      await portfolioManager.addAsset(
        RiskLevel.MEDIUM,
        await mockTokens[0].getAddress(),
        3000
      );

      await portfolioManager.addAsset(
        RiskLevel.MEDIUM,
        await mockTokens[1].getAddress(),
        2000
      );
    });

    it("should correctly calculate total allocation", async function () {
      const totalAllocation = await portfolioManager.getTotalAllocation(
        RiskLevel.MEDIUM
      );
      expect(totalAllocation).to.equal(5000); // 50%
    });

    it("should correctly update total allocation after removing assets", async function () {
      await portfolioManager.removeAsset(
        RiskLevel.MEDIUM,
        await mockTokens[0].getAddress()
      );

      const totalAllocation = await portfolioManager.getTotalAllocation(
        RiskLevel.MEDIUM
      );
      expect(totalAllocation).to.equal(2000); // 20%
    });

    it("should calculate portfolio value", async function () {
      const value = await portfolioManager.calculatePortfolioValue(
        RiskLevel.MEDIUM
      );
      expect(value).to.equal(ethers.parseEther("5.0")); // The amount we sent to the contract
    });
  });
});
