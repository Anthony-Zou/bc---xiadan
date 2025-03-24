/**
 * Utility functions for handling Web3/MetaMask errors
 */

/**
 * Parse and return a user-friendly error message
 * @param {Error} error The error object from Web3/MetaMask
 * @returns {string} User-friendly error message
 */
export const parseWeb3Error = (error) => {
  // Check if it's a MetaMask error
  if (error?.code) {
    switch (error.code) {
      case 4001:
        return "You rejected the transaction. Please approve it to proceed.";
      case -32602:
        return "Invalid parameters were provided to the RPC method.";
      case -32603:
        return "Internal JSON-RPC error. Please restart your browser and try again.";
      case -32000:
        return "MetaMask encountered an issue. Please check your MetaMask configuration.";
      case -32001:
        return "Resource not found. Please check your network connection.";
      case -32002:
        return "Request already pending. Please check MetaMask.";
      case -32003:
        return "Transaction rejected. Please check your wallet.";
      case -32004:
        return "Method not supported. Please update your MetaMask.";
      case -32005:
        return "Request limit exceeded. Please try again later.";
    }
  }

  // Check for common error patterns in message
  const errorMsg = error?.message || String(error);

  if (errorMsg.includes("insufficient funds")) {
    return "Insufficient funds for this transaction. Please add more ETH to your wallet.";
  }

  if (errorMsg.includes("user rejected")) {
    return "You rejected the transaction. Please approve it to proceed.";
  }

  if (errorMsg.includes("gas required exceeds allowance")) {
    return "Transaction requires more gas than allowed. Try increasing the gas limit.";
  }

  if (errorMsg.includes("nonce too low")) {
    return "Transaction nonce is too low. Please reset your MetaMask account or wait for pending transactions.";
  }

  if (errorMsg.includes("already known")) {
    return "This transaction is already pending. Please wait for it to be mined.";
  }

  // Default message
  return `Transaction failed: ${errorMsg.slice(0, 100)}${
    errorMsg.length > 100 ? "..." : ""
  }`;
};

/**
 * Display an error notification to the user
 * @param {Error} error The error object
 * @param {Function} setErrorCallback Function to set error state
 */
export const handleWeb3Error = (error, setErrorCallback) => {
  console.error("Web3 Error:", error);
  const message = parseWeb3Error(error);
  setErrorCallback(message);
};
