import { getProviderOptions, NETWORKS } from "../config/networks";
import { ethers } from "ethers";

/**
 * Creates an ethers provider with MetaMask
 * @returns {Promise<Object>} Provider and signer objects
 */
export const setupWeb3Provider = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask not installed");
  }

  try {
    // Check if MetaMask is unlocked
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    if (accounts.length === 0) {
      throw new Error("Please unlock MetaMask and refresh the page");
    }

    // Create provider with options to reduce polling
    const provider = new ethers.providers.Web3Provider(
      window.ethereum,
      getProviderOptions()
    );

    // Get network details
    const network = await provider.getNetwork();
    const currentNetwork = NETWORKS[network.chainId];

    // Create signer
    const signer = provider.getSigner();
    const address = await signer.getAddress();

    return {
      provider,
      signer,
      address,
      network: {
        chainId: network.chainId,
        name: currentNetwork?.name || network.name,
        isSupported: !!currentNetwork,
      },
    };
  } catch (error) {
    console.error("Error setting up Web3 provider:", error);
    throw error;
  }
};

/**
 * Checks if the user is on the correct network
 * @param {number} targetChainId The chain ID to check against
 * @returns {Promise<boolean>} True if on correct network
 */
export const checkNetwork = async (targetChainId) => {
  if (!window.ethereum) return false;

  try {
    const hexChainId = await window.ethereum.request({ method: "eth_chainId" });
    const currentChainId = parseInt(hexChainId, 16);
    return currentChainId === targetChainId;
  } catch (error) {
    console.error("Error checking network:", error);
    return false;
  }
};
