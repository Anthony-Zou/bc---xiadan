import { ethers } from "hardhat";

async function main() {
  console.log("Deploying IntelliDeFi contracts...");

  // Deploy Factory
  const Factory = await ethers.getContractFactory("IntelliDeFiFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  console.log("IntelliDeFiFactory deployed to:", factoryAddress);

  // Create Low Risk Portfolio
  const RiskLevel = {
    LOW: 0,
    MEDIUM: 1,
    HIGH: 2,
  };

  await factory.createPortfolio(RiskLevel.LOW);
  console.log("Low Risk Portfolio created");

  const lowRiskAddress = await factory.getPortfolio(RiskLevel.LOW);
  console.log("Low Risk Portfolio address:", lowRiskAddress);

  // Deploy Portfolio Manager
  const PortfolioManager = await ethers.getContractFactory(
    "IntelliDeFiPortfolioManager"
  );
  const portfolioManager = await PortfolioManager.deploy();
  await portfolioManager.waitForDeployment();

  const managerAddress = await portfolioManager.getAddress();
  console.log("IntelliDeFiPortfolioManager deployed to:", managerAddress);

  // Add portfolio to manager
  await portfolioManager.addPortfolio(RiskLevel.LOW, lowRiskAddress);
  console.log("Low Risk Portfolio added to manager");

  console.log("Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
