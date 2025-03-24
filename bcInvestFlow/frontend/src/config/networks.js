/**
 * Network configuration for the application
 */

export const NETWORKS = {
  // Hardhat local network
  31337: {
    name: "Hardhat Local",
    rpcUrl: "http://localhost:8545",
    currency: "ETH",
    blockExplorer: "",
    isTestnet: true,
  },
  // Sepolia testnet
  11155111: {
    name: "Sepolia",
    rpcUrl: "https://sepolia.infura.io/v3/YOUR_INFURA_ID",
    currency: "ETH",
    blockExplorer: "https://sepolia.etherscan.io",
    isTestnet: true,
  },
  // Goerli testnet
  5: {
    name: "Goerli",
    rpcUrl: "https://goerli.infura.io/v3/YOUR_INFURA_ID",
    currency: "ETH",
    blockExplorer: "https://goerli.etherscan.io",
    isTestnet: true,
  },
};

/**
 * Adds a custom network to MetaMask
 * @param {number} chainId Chain ID of the network
 * @returns {Promise<void>}
 */
export const addNetworkToMetaMask = async (chainId) => {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  const network = NETWORKS[chainId];
  if (!network) {
    throw new Error(`Network configuration not found for chain ID ${chainId}`);
  }

  const hexChainId = `0x${chainId.toString(16)}`;

  try {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: hexChainId,
          chainName: network.name,
          nativeCurrency: {
            name: network.currency,
            symbol: network.currency,
            decimals: 18,
          },
          rpcUrls: [network.rpcUrl],
          blockExplorerUrls: network.blockExplorer
            ? [network.blockExplorer]
            : undefined,
        },
      ],
    });
  } catch (error) {
    console.error("Error adding network to MetaMask:", error);
    throw error;
  }
};

/**
 * Gets default provider options based on the current network
 * @returns {Object} Provider options for ethers.js
 */
export const getProviderOptions = () => {
  // Default polling interval to reduce RPC requests
  return {
    pollingInterval: 12000, // 12 seconds
    timeout: 60000, // 1 minute
  };
};
