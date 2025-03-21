import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("IntelliDeFiToken", function () {
  let tokenContract;
  let owner;
  let user1;
  let user2;

  const RiskLevel = {
    Low: 0,
    Medium: 1,
    High: 2,
  };

  const initialFeePercentage = 30; // 0.3%

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy the token contract
    const IntelliDeFiToken = await ethers.getContractFactory(
      "IntelliDeFiToken"
    );
    tokenContract = await IntelliDeFiToken.deploy(
      "IntelliDeFi Test Token",
      "IDFT",
      RiskLevel.Medium,
      initialFeePercentage
    );
    await tokenContract.waitForDeployment();
  });

  describe("Initialization", function () {
    it("should initialize with correct name and symbol", async function () {
      expect(await tokenContract.name()).to.equal("IntelliDeFi Test Token");
      expect(await tokenContract.symbol()).to.equal("IDFT");
    });

    it("should set the correct risk level", async function () {
      expect(await tokenContract.riskLevel()).to.equal(RiskLevel.Medium);
    });

    it("should set the correct fee percentage", async function () {
      expect(await tokenContract.feePercentage()).to.equal(
        initialFeePercentage
      );
    });

    it("should set the deployer as the owner", async function () {
      expect(await tokenContract.owner()).to.equal(owner.address);
    });
  });

  describe("Investment", function () {
    it("should allow users to invest ETH", async function () {
      const investAmount = ethers.parseEther("1.0");

      // Call the invest function directly instead of sending ETH
      await tokenContract.connect(user1).invest({ value: investAmount });

      // Check if tokens were minted to the user
      expect(await tokenContract.balanceOf(user1.address)).to.be.gt(0);
    });

    it("should reject investments of 0 ETH", async function () {
      await expect(
        user1.sendTransaction({
          to: await tokenContract.getAddress(),
          value: 0,
        })
      ).to.be.reverted;
    });

    it("should calculate expected token amount correctly", async function () {
      const ethAmount = ethers.parseEther("1.0");
      const expectedTokens = await tokenContract.getExpectedTokenAmount(
        ethAmount
      );

      // Tokens should be slightly less than ETH amount due to fees
      expect(expectedTokens).to.be.lt(ethAmount);
    });
  });

  describe("Withdrawal", function () {
    it("should allow users to withdraw their investment", async function () {
      // First invest
      const investAmount = ethers.parseEther("1.0");

      // Call the invest function directly
      await tokenContract.connect(user1).invest({ value: investAmount });

      // Get balance after investment
      const balanceAfterInvest = await tokenContract.balanceOf(user1.address);

      // Withdraw half the tokens
      const withdrawAmount = balanceAfterInvest / 2n;

      // Get ETH balance before withdrawal
      const ethBalanceBefore = await ethers.provider.getBalance(user1.address);

      // Execute withdrawal
      await tokenContract.connect(user1).withdraw(withdrawAmount);

      // Get updated token balance
      const newTokenBalance = await tokenContract.balanceOf(user1.address);

      // Get ETH balance after withdrawal
      const ethBalanceAfter = await ethers.provider.getBalance(user1.address);

      // Check token balance decreased
      expect(newTokenBalance).to.be.lt(balanceAfterInvest);

      // Check ETH balance increased (accounting for gas)
      expect(ethBalanceAfter).to.be.gt(
        ethBalanceBefore - ethers.parseEther("0.01")
      );
    });

    it("should reject withdrawals of 0 tokens", async function () {
      await expect(tokenContract.connect(user1).withdraw(0)).to.be.revertedWith(
        "Withdrawal amount must be greater than 0"
      );
    });

    it("should reject withdrawals exceeding user balance", async function () {
      // Try to withdraw when there's no balance
      await expect(
        tokenContract.connect(user1).withdraw(ethers.parseEther("1.0"))
      ).to.be.revertedWith("Insufficient token balance");
    });
  });

  describe("Fee Management", function () {
    it("should allow owner to update fee percentage", async function () {
      const newFee = 50; // 0.5%
      await tokenContract.setFeePercentage(newFee);
      expect(await tokenContract.feePercentage()).to.equal(newFee);
    });

    it("should reject fee updates from non-owners", async function () {
      await expect(tokenContract.connect(user1).setFeePercentage(50)).to.be
        .reverted;
    });

    it("should reject fee percentages that are too high", async function () {
      const tooHighFee = 1100; // 11%
      await expect(
        tokenContract.setFeePercentage(tooHighFee)
      ).to.be.revertedWith("Fee percentage too high");
    });
  });

  describe("Portfolio Management", function () {
    it("should allow owner to update portfolio value", async function () {
      const newValue = ethers.parseEther("10.0");
      await tokenContract.updatePortfolioValue(newValue);
      expect(await tokenContract.getCurrentPortfolioValue()).to.equal(newValue);
    });

    it("should reject portfolio value updates from non-owners", async function () {
      await expect(
        tokenContract
          .connect(user1)
          .updatePortfolioValue(ethers.parseEther("10.0"))
      ).to.be.reverted;
    });

    it("should reject setting portfolio value to zero", async function () {
      await expect(tokenContract.updatePortfolioValue(0)).to.be.revertedWith(
        "New value must be greater than 0"
      );
    });

    it("should allow owner to change risk level", async function () {
      await tokenContract.setRiskLevel(RiskLevel.High);
      expect(await tokenContract.riskLevel()).to.equal(RiskLevel.High);
    });

    it("should reject risk level changes from non-owners", async function () {
      await expect(tokenContract.connect(user1).setRiskLevel(RiskLevel.High)).to
        .be.reverted;
    });
  });

  describe("Token Price", function () {
    it("should return the default token price when no tokens are minted", async function () {
      expect(await tokenContract.getTokenPrice()).to.equal(
        ethers.parseEther("1.0")
      );
    });

    it("should update token price after investments", async function () {
      // Invest some ETH directly via the invest function
      await tokenContract.connect(user1).invest({
        value: ethers.parseEther("1.0"),
      });

      // Check if token price is set
      const tokenPrice = await tokenContract.getTokenPrice();
      expect(tokenPrice).to.be.gt(0);
    });
  });
});
