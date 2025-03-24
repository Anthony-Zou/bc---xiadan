import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  console.log("Deploying IntelliDeFi contracts...");

  // Deploy MockERC20 for testing
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockToken = await MockERC20.deploy("Mock Token", "MTK");
  await mockToken.waitForDeployment();
  const mockTokenAddress = await mockToken.getAddress();

  // Log the address in a format easy to copy for .env
  console.log("\nCopy these addresses to your frontend/.env file:");
  console.log("VITE_MOCK_TOKEN_ADDRESS=" + mockTokenAddress);

  // Deploy Factory
  const Factory = await ethers.getContractFactory("IntelliDeFiFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("VITE_FACTORY_ADDRESS=" + factoryAddress);

  // Deploy Portfolio Manager
  const PortfolioManager = await ethers.getContractFactory(
    "IntelliDeFiPortfolioManager"
  );
  const manager = await PortfolioManager.deploy();
  await manager.waitForDeployment();
  const managerAddress = await manager.getAddress();
  console.log("VITE_MANAGER_ADDRESS=" + managerAddress);

  // Additional deployment logs
  console.log("\nDeployment Summary:");
  console.log("==================");
  console.log("MockERC20:", mockTokenAddress);
  console.log("Factory:", factoryAddress);
  console.log("Portfolio Manager:", managerAddress);

  // Verify the Mock token has the mint function
  const code = await ethers.provider.getCode(mockTokenAddress);
  console.log("\nContract deployment verified:", code.length > 2);

  // Set up default portfolio compositions
  console.log("\nSetting up default portfolio compositions...");

  // Use the correct zero address format for ethers v6
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

  // Create portfolios with the manager
  for (let i = 0; i < 3; i++) {
    // Create portfolio in factory if it doesn't exist
    let portfolioAddress = await factory.getPortfolio(i);

    // Fix the address comparison
    if (portfolioAddress === ZERO_ADDRESS) {
      const tx = await factory.createPortfolio(i);
      await tx.wait();
      console.log(`Created portfolio for risk level ${i}`);
    }

    // Add portfolio to manager
    portfolioAddress = await factory.getPortfolio(i);
    let description = "";
    if (i === 0) {
      description =
        "Conservative portfolio focused on stable returns with minimal volatility";
    } else if (i === 1) {
      description =
        "Balanced portfolio with moderate growth potential and risk";
    } else {
      description =
        "Aggressive growth portfolio with higher volatility for maximum returns";
    }

    try {
      await manager.addPortfolio(i, portfolioAddress, description);
      console.log(`Added portfolio ${i} to manager`);
    } catch (error) {
      console.log(`Portfolio ${i} already added to manager: ${error.message}`);
    }

    // Register with token
    const token = await ethers.getContractAt(
      "IntelliDeFiToken",
      portfolioAddress
    );
    try {
      await token.setPortfolioManager(managerAddress);
      console.log(`Set portfolio manager for token ${i}`);
    } catch (error) {
      console.log(
        `Failed to set portfolio manager for token ${i}: ${error.message}`
      );
    }

    // Add sample assets based on risk profile
    if (i === 0) {
      // Low risk: Stablecoins and blue chips
      try {
        await manager.addAsset(i, mockTokenAddress, 5000, "USDT"); // 50% stablecoin
        await manager.addAsset(
          i,
          "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
          2500,
          "BTC"
        ); // 25% Bitcoin
        await manager.addAsset(
          i,
          "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82",
          2500,
          "ETH"
        ); // 25% Ethereum
        console.log("Added default assets to low risk portfolio");
      } catch (error) {
        console.log(
          `Some assets already added to low risk portfolio: ${error.message}`
        );
      }
    } else if (i === 1) {
      // Medium risk: Balanced portfolio
      try {
        await manager.addAsset(i, mockTokenAddress, 2500, "USDT"); // 25% stablecoin
        await manager.addAsset(
          i,
          "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
          3000,
          "BTC"
        ); // 30% Bitcoin
        await manager.addAsset(
          i,
          "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82",
          3000,
          "ETH"
        ); // 30% Ethereum
        await manager.addAsset(
          i,
          "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
          1500,
          "SOL"
        ); // 15% Solana
        console.log("Added default assets to medium risk portfolio");
      } catch (error) {
        console.log(
          `Some assets already added to medium risk portfolio: ${error.message}`
        );
      }
    } else {
      // High risk: Growth portfolio
      try {
        await manager.addAsset(
          i,
          "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
          2500,
          "BTC"
        ); // 25% Bitcoin
        await manager.addAsset(
          i,
          "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82",
          2500,
          "ETH"
        ); // 25% Ethereum
        await manager.addAsset(
          i,
          "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
          2500,
          "SOL"
        ); // 25% Solana
        await manager.addAsset(i, mockTokenAddress, 1000, "DOT"); // 10% Polkadot
        await manager.addAsset(
          i,
          "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
          1500,
          "AVAX"
        ); // 15% Avalanche
        console.log("Added default assets to high risk portfolio");
      } catch (error) {
        console.log(
          `Some assets already added to high risk portfolio: ${error.message}`
        );
      }
    }
  }

  console.log("Deployment and configuration completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
