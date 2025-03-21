import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contractsDir = path.join(__dirname, "..", "contracts");

function checkContractsDirectory() {
  console.log("Checking contracts directory...");

  if (!fs.existsSync(contractsDir)) {
    console.error("Error: contracts directory not found!");
    process.exit(1);
  }

  const files = fs.readdirSync(contractsDir);

  if (files.length === 0) {
    console.warn("Warning: No contracts found in contracts directory.");
    return;
  }

  console.log(`Found ${files.length} files in contracts directory:`);

  files.forEach((file) => {
    if (file.endsWith(".sol")) {
      const filePath = path.join(contractsDir, file);
      const stats = fs.statSync(filePath);
      console.log(`- ${file} (${(stats.size / 1024).toFixed(2)} KB)`);

      // Basic validation of Solidity file
      const content = fs.readFileSync(filePath, "utf8");
      if (!content.includes("pragma solidity")) {
        console.warn(
          `  Warning: ${file} does not contain pragma solidity statement`
        );
      }

      if (
        !content.includes("contract ") &&
        !content.includes("interface ") &&
        !content.includes("library ")
      ) {
        console.warn(
          `  Warning: ${file} does not define a contract, interface, or library`
        );
      }
    }
  });

  console.log("Contract check completed.");
}

checkContractsDirectory();
