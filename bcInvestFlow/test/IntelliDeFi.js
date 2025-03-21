import { expect } from "./helpers/setup.js";
import { ethers } from "hardhat";

describe("IntelliDeFi Investment Platform", function () {
  let owner, user1, user2;
  let factory, lowRiskToken, portfolioManager;

  const RiskLevel = {
    LOW: 0,
    MEDIUM: 1,
    HIGH: 2,
  };

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy Factory
    const Factory = await ethers.getContractFactory("IntelliDeFiFactory");
    factory = await Factory.deploy();

    // Create Low Risk Portfolio
    await factory.createPortfolio(RiskLevel.LOW);

    // Get token address
    const lowRiskAddress = await factory.getPortfolio(RiskLevel.LOW);
    lowRiskToken = await ethers.getContractAt(
      "IntelliDeFiToken",
      lowRiskAddress
    );

    // Deploy Portfolio Manager
    const PortfolioManager = await ethers.getContractFactory(
      "IntelliDeFiPortfolioManager"
    );
    portfolioManager = await PortfolioManager.deploy();

    // Add portfolio to manager
    await portfolioManager.addPortfolio(RiskLevel.LOW, lowRiskAddress);
  });

  it("Should allow users to invest and receive tokens", async function () {
    const investAmount = ethers.parseEther("1.0");

    // User invests 1 ETH
    await lowRiskToken.connect(user1).invest({ value: investAmount });

    // Check user's token balance (should be slightly less than 1 due to fee)
    const expectedTokens = ethers.parseEther("0.997"); // 1 ETH - 0.3% fee
    expect(await lowRiskToken.balanceOf(user1.address)).to.be.closeTo(
      expectedTokens,
      ethers.parseEther("0.001") // Allow small rounding errors
    );
  });

  it("Should allow users to withdraw investments", async function () {
    const investAmount = ethers.parseEther("1.0");

    // User invests 1 ETH
    await lowRiskToken.connect(user1).invest({ value: investAmount });

    // Get token balance
    const tokenBalance = await lowRiskToken.balanceOf(user1.address);

    // Get initial ETH balance
    const initialBalance = await ethers.provider.getBalance(user1.address);

    // Withdraw all tokens
    const tx = await lowRiskToken.connect(user1).withdraw(tokenBalance);
    const receipt = await tx.wait();

    // Calculate gas used
    const gasUsed = receipt.gasUsed * receipt.gasPrice;

    // Get final ETH balance
    const finalBalance = await ethers.provider.getBalance(user1.address);

    // Expected return: 1 ETH - 0.3% fee - 0.3% fee ≈ 0.994 ETH
    const expectedReturn = ethers.parseEther("0.994");

    // Check that user received the right amount (accounting for gas)
    expect(finalBalance.add(gasUsed).sub(initialBalance)).to.be.closeTo(
      expectedReturn,
      ethers.parseEther("0.001") // Allow small rounding errors
    );
  });

  it("Should properly update token price based on portfolio performance", async function () {
    // User invests 1 ETH
    await lowRiskToken
      .connect(user1)
      .invest({ value: ethers.parseEther("1.0") });

    // Initial token price should be 1 ETH
    expect(await lowRiskToken.getTokenPrice()).to.equal(
      ethers.parseEther("1.0")
    );

    // Simulate portfolio growth to 1.1 ETH
    const newValue = ethers.parseEther("1.1");
    await lowRiskToken.updatePortfolioValue(newValue);

    // New token price should be updated
    expect(await lowRiskToken.getTokenPrice()).to.be.closeTo(
      ethers.parseEther("1.1"),
      ethers.parseEther("0.001")
    );
  });

  it("Should correctly add assets to portfolio", async function () {
    // Create mock ERC20 tokens for testing
    const MockToken = await ethers.getContractFactory("ERC20");
    const token1 = await MockToken.deploy("Token 1", "TK1");
    const token2 = await MockToken.deploy("Token 2", "TK2");

    // Add assets to portfolio
    await portfolioManager.addAsset(RiskLevel.LOW, token1.address, 6000); // 60%
    await portfolioManager.addAsset(RiskLevel.LOW, token2.address, 4000); // 40%

    // Check total allocation
    expect(await portfolioManager.getTotalAllocation(RiskLevel.LOW)).to.equal(
      10000
    );

    // Check asset count
    expect(await portfolioManager.getAssetCount(RiskLevel.LOW)).to.equal(2);

    // Check asset info
    const asset1 = await portfolioManager.getAssetInfo(RiskLevel.LOW, 0);
    expect(asset1[0]).to.equal(token1.address);
    expect(asset1[1]).to.equal(6000);
    expect(asset1[2]).to.be.true;
  });
});
