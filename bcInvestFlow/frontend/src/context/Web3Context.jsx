import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import { parseWeb3Error } from "../utils/web3ErrorHandler";
import { checkNetwork } from "../utils/setupMetaMask";

const Web3Context = createContext(null);

export function Web3Provider({ children }) {
  const [account, setAccount] = useState("");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [network, setNetwork] = useState(null);
  const [error, setError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check if wallet is already connected when the app loads
  useEffect(() => {
    if (window.ethereum) {
      checkConnection();

      // Listen for account changes
      window.ethereum.on("accountsChanged", handleAccountsChanged);

      // Listen for network changes
      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
        window.ethereum.removeListener("chainChanged", () => {
          window.location.reload();
        });
      }
    };
  }, []);

  // Check if already connected
  const checkConnection = async () => {
    try {
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (accounts.length > 0) {
        const ethersProvider = new ethers.providers.Web3Provider(
          window.ethereum
        );
        const ethersSigner = ethersProvider.getSigner();
        const networkData = await ethersProvider.getNetwork();

        setAccount(accounts[0]);
        setProvider(ethersProvider);
        setSigner(ethersSigner);
        setNetwork(networkData);
      }
    } catch (error) {
      console.error("Error checking connection:", error);
    }
  };

  // Handle account changes
  const handleAccountsChanged = async (accounts) => {
    if (accounts.length === 0) {
      // User disconnected their wallet
      setAccount("");
      setSigner(null);
    } else {
      // Account changed, update state
      setAccount(accounts[0]);
      if (provider) {
        const newSigner = provider.getSigner();
        setSigner(newSigner);
      }
    }
  };

  // Connect wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("No Ethereum wallet detected. Please install MetaMask.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Check network first
      const targetChainId = parseInt(
        import.meta.env.VITE_NETWORK_ID || "31337"
      );
      const isCorrectNetwork = await checkNetwork(targetChainId);

      if (!isCorrectNetwork) {
        try {
          // Try to switch network
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${targetChainId.toString(16)}` }],
          });
        } catch (switchError) {
          setError("Please switch to the correct network in your wallet.");
          setIsConnecting(false);
          return;
        }
      }

      // Request access to accounts
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      // Set up provider and signer
      const ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
      const ethersSigner = ethersProvider.getSigner();
      const networkData = await ethersProvider.getNetwork();

      setAccount(accounts[0]);
      setProvider(ethersProvider);
      setSigner(ethersSigner);
      setNetwork(networkData);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setError(parseWeb3Error(error));
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet (for UI purposes - not a true disconnect)
  const disconnectWallet = () => {
    setAccount("");
    setSigner(null);
  };

  // Value to provide through context
  const value = {
    account,
    provider,
    signer,
    network,
    error,
    isConnecting,
    isConnected: !!account,
    connectWallet,
    disconnectWallet,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

// Custom hook to use Web3 context
export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}
