import { useState, useEffect, lazy, Suspense } from "react";
import { ethers } from "ethers";
import MockERC20 from "./artifacts/contracts/mock/MockERC20.sol/MockERC20.json";
import IntelliDeFiFactory from "./artifacts/contracts/IntelliDeFiFactory.sol/IntelliDeFiFactory.json";
import IntelliDeFiToken from "./artifacts/contracts/IntelliDeFiToken.sol/IntelliDeFiToken.json";
import IntelliDeFiPortfolioManager from "./artifacts/contracts/IntelliDeFiPortfolioManager.sol/IntelliDeFiPortfolioManager.json";
import { parseWeb3Error } from "./utils/web3ErrorHandler";
import { checkNetwork } from "./utils/setupMetaMask";
import { NETWORKS } from "./config/networks";
import Header from "./components/Header";
import WalletConnect from "./components/WalletConnect";
import Loader from "./components/Loader";
import PortfolioCard from "./components/PortfolioCard";
import InvestmentForm from "./components/InvestmentForm";
import PerformanceChart from "./components/PerformanceChart";
import AssetAllocation from "./components/AssetAllocation";
import Toast from "./components/Toast";
import "./styles.css";

// Lazy loading components
const PortfolioManagement = lazy(() =>
  import("./components/PortfolioManagement")
);
const Holdings = lazy(() => import("./components/Holdings"));

function App() {
  // State variables
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [portfolios, setPortfolios] = useState({});
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [investAmount, setInvestAmount] = useState("");
  const [holdings, setHoldings] = useState({});
  const [error, setError] = useState(null);
  const [networkError, setNetworkError] = useState(null);
  const [portfolioValues, setPortfolioValues] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [withdrawAmounts, setWithdrawAmounts] = useState({
    0: "", // Low risk
    1: "", // Medium risk
    2: "", // High risk
  });
  const [assetAllocations, setAssetAllocations] = useState({});
  const [performanceHistory, setPerformanceHistory] = useState({
    0: generateMockPerformanceData(0),
    1: generateMockPerformanceData(1),
    2: generateMockPerformanceData(2),
  });
  const [portfolioManager, setPortfolioManager] = useState(null);
  const [managerAddress, setManagerAddress] = useState("");
  const [newAsset, setNewAsset] = useState({
    address: "",
    allocation: "",
    riskLevel: 0,
    symbol: "",
  });
  const [portfolioCompositions, setPortfolioCompositions] = useState({
    0: {
      assets: [],
      totalAllocation: "0%",
      description:
        "Low risk portfolio focused on capital preservation with stable returns",
    },
    1: {
      assets: [],
      totalAllocation: "0%",
      description:
        "Medium risk portfolio balanced between growth and stability",
    },
    2: {
      assets: [],
      totalAllocation: "0%",
      description: "High risk portfolio focused on maximum growth potential",
    },
  });
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success",
  });
  const [darkMode, setDarkMode] = useState(
    window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  // Generate mock performance data for the charts
  function generateMockPerformanceData(riskLevel) {
    const volatility = riskLevel === 0 ? 0.01 : riskLevel === 1 ? 0.02 : 0.04;
    const uptrend = riskLevel === 0 ? 0.001 : riskLevel === 1 ? 0.002 : 0.003;

    const dates = [];
    const values = [];
    let value = 100;

    // Generate 30 days of data
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split("T")[0]);

      // Add some randomness + slight uptrend based on risk level
      const change = (Math.random() - 0.45) * volatility + uptrend;
      value *= 1 + change;
      values.push(parseFloat(value.toFixed(2)));
    }

    return { dates, values };
  }

  // Show toast notification
  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ ...toast, visible: false }), 5000);
  };

  // Network check
  const checkCorrectNetwork = async () => {
    const targetChainId = parseInt(import.meta.env.VITE_NETWORK_ID || "31337");
    const isCorrectNetwork = await checkNetwork(targetChainId);

    if (!isCorrectNetwork) {
      const networkName = NETWORKS[targetChainId]?.name || "Localhost";
      setNetworkError(
        `Please connect to the ${networkName} network (Chain ID: ${targetChainId})`
      );
      return false;
    }

    setNetworkError(null);
    return true;
  };

  // Request account connection
  async function requestAccount() {
    if (!window.ethereum) {
      showToast("Please install MetaMask to use this application", "error");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Add retry logic
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          // Check network first
          const correctNetwork = await checkCorrectNetwork();
          if (!correctNetwork) {
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [
                {
                  chainId: `0x${parseInt(
                    import.meta.env.VITE_NETWORK_ID || "31337"
                  ).toString(16)}`,
                },
              ],
            });
          }

          const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
          });

          if (accounts.length > 0) {
            console.log("Connected account:", accounts[0]);
            setAccount(accounts[0]);
            await getBalance(accounts[0]);
            showToast("Wallet connected successfully", "success");
            return;
          }
        } catch (error) {
          retries++;

          if (error.code === -32603) {
            // Internal JSON-RPC error - wait and retry
            console.warn(
              `MetaMask RPC error, attempt ${retries} of ${maxRetries}`
            );
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1s between retries
            continue;
          }

          throw error; // Throw other errors
        }
      }

      throw new Error("Failed to connect after multiple attempts");
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
      let errorMessage = "Failed to connect to MetaMask";

      if (error.code === -32603) {
        errorMessage =
          "MetaMask connection error. Please try:\n1. Refresh the page\n2. Lock and unlock MetaMask\n3. Disable and re-enable MetaMask";
      } else {
        errorMessage = parseWeb3Error(error);
      }

      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  }

  // Get token balance
  async function getBalance(address) {
    if (!window.ethereum) return;

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      const mockTokenContract = new ethers.Contract(
        import.meta.env.VITE_MOCK_TOKEN_ADDRESS,
        MockERC20.abi,
        provider
      );

      const balance = await mockTokenContract.balanceOf(address);
      setBalance(ethers.utils.formatEther(balance));
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalance("Error");
    }
    setLoading(false);
  }

  // Mint test tokens
  async function mintTokens() {
    if (!window.ethereum) return;
    setLoading(true);

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const mockTokenContract = new ethers.Contract(
        import.meta.env.VITE_MOCK_TOKEN_ADDRESS,
        MockERC20.abi,
        signer
      );

      const amount = ethers.utils.parseEther("100");
      const tx = await mockTokenContract.mint(account, amount);

      showToast("Minting tokens... Please wait for confirmation", "info");
      await tx.wait();

      await getBalance(account);
      showToast("Successfully minted 100 tokens!", "success");
    } catch (error) {
      console.error("Error minting tokens:", error);
      showToast(parseWeb3Error(error), "error");
    }
    setLoading(false);
  }

  // Load portfolio data
  async function loadPortfolios() {
    if (!window.ethereum) return;
    setRefreshing(true);
    setError(null);

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const factory = new ethers.Contract(
        import.meta.env.VITE_FACTORY_ADDRESS,
        IntelliDeFiFactory.abi,
        provider
      );

      // Create portfolios if they don't exist
      const signer = provider.getSigner();
      const factoryWithSigner = factory.connect(signer);

      const portfolioData = {};
      const values = {};

      for (let i = 0; i < 3; i++) {
        try {
          let address = await factory.getPortfolio(i);

          // If portfolio doesn't exist, create it
          if (address === ethers.constants.AddressZero) {
            showToast(`Creating portfolio for risk level ${i}...`, "info");
            const tx = await factoryWithSigner.createPortfolio(i);
            await tx.wait();
            address = await factory.getPortfolio(i);
          }

          if (address !== ethers.constants.AddressZero) {
            const token = new ethers.Contract(
              address,
              IntelliDeFiToken.abi,
              provider
            );
            const price = await token.getTokenPrice();
            const value = await token.getCurrentPortfolioValue();

            portfolioData[i] = {
              address,
              price: ethers.utils.formatEther(price),
              value: ethers.utils.formatEther(value),
            };
            values[i] = ethers.utils.formatEther(value);
          }
        } catch (error) {
          console.error(`Error with portfolio ${i}:`, error);
          setError(`Error loading portfolio ${i}: ${parseWeb3Error(error)}`);
        }
      }

      setPortfolios(portfolioData);
      setPortfolioValues(values);
      showToast("Portfolios refreshed successfully", "success");
    } catch (error) {
      console.error("Error loading portfolios:", error);
      setError("Failed to load portfolios: " + parseWeb3Error(error));
      showToast("Failed to load portfolios", "error");
    }
    setRefreshing(false);
  }

  // Invest in selected portfolio
  async function invest() {
    if (!window.ethereum || !selectedRisk || !investAmount) return;
    setLoading(true);
    setError(null);

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const portfolio = portfolios[selectedRisk];

      if (!portfolio || !portfolio.address) {
        throw new Error("Selected portfolio not found");
      }

      const token = new ethers.Contract(
        portfolio.address,
        IntelliDeFiToken.abi,
        signer
      );

      showToast(`Investing ${investAmount} ETH into portfolio...`, "info");
      const tx = await token.invest({
        value: ethers.utils.parseEther(investAmount),
      });

      await tx.wait();

      await loadPortfolios();
      await loadPortfolioHoldings();
      setInvestAmount("");
      showToast("Investment successful!", "success");
    } catch (error) {
      console.error("Investment failed:", error);
      setError("Investment failed: " + parseWeb3Error(error));
      showToast(parseWeb3Error(error), "error");
    }
    setLoading(false);
  }

  // Load holdings data
  async function loadPortfolioHoldings() {
    if (!window.ethereum || !account) return;

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const holdings = {};

      for (const [risk, data] of Object.entries(portfolios)) {
        try {
          const token = new ethers.Contract(
            data.address,
            IntelliDeFiToken.abi,
            provider
          );

          const balance = await token.balanceOf(account);
          const value = await token.getExpectedEthAmount(balance);

          holdings[risk] = {
            tokens: ethers.utils.formatEther(balance),
            value: ethers.utils.formatEther(value),
          };
        } catch (error) {
          console.error(`Error loading holdings for risk ${risk}:`, error);
        }
      }

      setHoldings(holdings);
    } catch (error) {
      console.error("Error loading holdings:", error);
      showToast("Failed to load your holdings", "error");
    }
  }

  // Withdraw tokens
  async function withdraw(riskLevel) {
    if (!window.ethereum || !withdrawAmounts[riskLevel]) return;
    setLoading(true);

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const token = new ethers.Contract(
        portfolios[riskLevel].address,
        IntelliDeFiToken.abi,
        signer
      );

      showToast("Processing withdrawal... Please wait", "info");
      const tx = await token.withdraw(
        ethers.utils.parseEther(withdrawAmounts[riskLevel])
      );
      await tx.wait();

      await loadPortfolioHoldings();
      setWithdrawAmounts((prev) => ({
        ...prev,
        [riskLevel]: "",
      }));
      showToast("Withdrawal completed successfully!", "success");
    } catch (error) {
      console.error("Withdrawal failed:", error);
      showToast(parseWeb3Error(error), "error");
    }
    setLoading(false);
  }

  // Load portfolio manager
  async function loadPortfolioManager() {
    if (!window.ethereum) return;
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const manager = new ethers.Contract(
        import.meta.env.VITE_MANAGER_ADDRESS,
        IntelliDeFiPortfolioManager.abi,
        provider
      );
      setPortfolioManager(manager);
      setManagerAddress(manager.address); // Using address property directly
    } catch (error) {
      console.error("Error loading portfolio manager:", error);
      setError("Failed to load portfolio manager");
    }
  }

  // Load asset allocations
  async function loadAssetAllocations() {
    if (!portfolioManager) return;
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const allocations = {};

      // Create a cache for token symbols to avoid duplicate requests
      const symbolCache = {};

      for (let riskLevel = 0; riskLevel < 3; riskLevel++) {
        try {
          const assetCount = await portfolioManager.getAssetCount(riskLevel);
          allocations[riskLevel] = [];

          for (let i = 0; i < assetCount; i++) {
            try {
              const [address, allocation, isActive, symbol] =
                await portfolioManager.getAssetInfo(riskLevel, i);

              if (isActive) {
                // Use cached symbol if available, otherwise fetch and cache it
                let tokenSymbol = symbol;
                if (!tokenSymbol || tokenSymbol === "UNKNOWN") {
                  if (symbolCache[address]) {
                    tokenSymbol = symbolCache[address];
                  } else {
                    tokenSymbol = await getTokenSymbol(address, provider);
                    symbolCache[address] = tokenSymbol;
                  }
                }

                allocations[riskLevel].push({
                  address,
                  allocation: Number(allocation),
                  symbol: tokenSymbol,
                });
              }
            } catch (assetError) {
              console.error(
                `Error loading asset ${i} for risk level ${riskLevel}:`,
                assetError
              );
            }
          }
        } catch (error) {
          console.error(
            `Error loading allocations for risk level ${riskLevel}:`,
            error
          );
        }
      }

      setAssetAllocations(allocations);
    } catch (error) {
      console.error("Error loading asset allocations:", error);
    }
  }

  // Asset color helper - Move this function up before it's used
  function getAssetColor(index) {
    const colors = [
      "#4CAF50",
      "#2196F3",
      "#FF9800",
      "#E91E63",
      "#9C27B0",
      "#00BCD4",
      "#FFC107",
      "#3F51B5",
      "#795548",
      "#607D8B",
      "#8BC34A",
      "#FF5722",
    ];
    return colors[index % colors.length];
  }

  // Get token symbol with better error handling and caching
  async function getTokenSymbol(address, provider) {
    try {
      // Map known addresses to proper symbols for consistency with deployment
      const knownTokens = {
        [import.meta.env.VITE_MOCK_TOKEN_ADDRESS.toLowerCase()]: "USDT", // Use USDT for consistency
        "0x2279b7a0a67db372996a5fab50d91eaa73d2ebe6": "BTC",
        "0x0dcd1bf9a1b36ce34237eeafef220932846bcd82": "ETH",
        "0x5fc8d32690cc91d4c39d9d3abcbd16989f875707": "SOL",
        "0x8a791620dd6260079bf849dc5567adc3f2fdc318": "AVAX",
      };

      // Check if we have a known mapping for this address
      const lowercaseAddress = address.toLowerCase();
      if (knownTokens[lowercaseAddress]) {
        return knownTokens[lowercaseAddress];
      }

      // If not a known token, try to get from contract
      const token = new ethers.Contract(
        address,
        [
          "function symbol() view returns (string)",
          "function name() view returns (string)",
        ],
        provider
      );

      // Try to get symbol
      try {
        return await token.symbol();
      } catch (symbolError) {
        // If symbol fails, try name
        try {
          const name = await token.name();
          return name.split(" ")[0]; // Use first word of name as fallback
        } catch (nameError) {
          // If both fail, use address abbreviation
          return `${address.substring(0, 4)}...${address.substring(
            address.length - 4
          )}`;
        }
      }
    } catch (error) {
      console.error("Error getting token symbol:", error);
      return `${address.substring(0, 4)}...${address.substring(
        address.length - 4
      )}`;
    }
  }

  // Load portfolio compositions with improved handling
  async function loadPortfolioCompositions() {
    if (!window.ethereum || !portfolioManager) return;
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const compositions = { ...portfolioCompositions };

      // Create a cache for token symbols and data
      const tokenCache = {};

      for (let i = 0; i < 3; i++) {
        try {
          // Get portfolio assets
          const assetCount = await portfolioManager.getAssetCount(i);
          const assets = [];
          let totalAllocation = 0;

          for (let j = 0; j < assetCount; j++) {
            try {
              const [address, allocation, isActive, symbol] =
                await portfolioManager.getAssetInfo(i, j);

              if (isActive) {
                // Use cached token data if available, or create consistent symbols
                let tokenSymbol = symbol;
                const lowercaseAddress = address.toLowerCase();

                // First check our cache
                if (tokenCache[lowercaseAddress]) {
                  tokenSymbol = tokenCache[lowercaseAddress];
                }
                // Then check the address against known tokens
                else {
                  const fetchedSymbol = await getTokenSymbol(address, provider);
                  tokenCache[lowercaseAddress] = fetchedSymbol;
                  tokenSymbol = fetchedSymbol;
                }

                totalAllocation += Number(allocation);

                assets.push({
                  address,
                  allocation: (Number(allocation) / 100).toFixed(2),
                  symbol: tokenSymbol,
                  percentage: (Number(allocation) / 100).toFixed(1) + "%",
                  shortAddress: `${address.substring(
                    0,
                    6
                  )}...${address.substring(address.length - 4)}`,
                });
              }
            } catch (assetError) {
              console.error(
                `Error loading asset ${j} for risk level ${i}:`,
                assetError
              );
            }
          }

          // Sort by allocation (highest first)
          assets.sort((a, b) => Number(b.allocation) - Number(a.allocation));

          // Try to get description from contract
          let description = getDefaultDescription(i);
          try {
            const contractDescription =
              await portfolioManager.getPortfolioDescription(i);
            if (contractDescription && contractDescription !== "") {
              description = contractDescription;
            }
          } catch (descError) {
            console.log(
              "Using default description, contract method not available"
            );
          }

          compositions[i] = {
            assets,
            totalAllocation: (totalAllocation / 100).toFixed(2) + "%",
            description: description,
          };
        } catch (error) {
          console.error(`Error loading composition for portfolio ${i}:`, error);
          // Keep existing composition if there's an error
        }
      }

      setPortfolioCompositions(compositions);
    } catch (error) {
      console.error("Error loading portfolio compositions:", error);
    }
  }

  // Get default descriptions
  function getDefaultDescription(riskLevel) {
    switch (Number(riskLevel)) {
      case 0:
        return "Low risk portfolio focused on capital preservation with stable returns";
      case 1:
        return "Medium risk portfolio balanced between growth and stability";
      case 2:
        return "High risk portfolio focused on maximum growth potential";
      default:
        return "Custom portfolio";
    }
  }

  // Add asset to portfolio with improved validation
  async function addAssetToPortfolio() {
    if (!window.ethereum || !portfolioManager) return;
    if (!newAsset.address || !newAsset.allocation) {
      showToast("Please enter valid asset address and allocation", "error");
      return;
    }

    // Validate address format
    if (!ethers.utils.isAddress(newAsset.address)) {
      showToast("Invalid token address format", "error");
      return;
    }

    // Validate allocation is a number between 0-100
    const allocation = Number(newAsset.allocation);
    if (isNaN(allocation) || allocation <= 0 || allocation > 100) {
      showToast("Allocation must be between 0 and 100", "error");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const managerWithSigner = portfolioManager.connect(signer);

      // Try to get the token symbol first to validate it's a real token
      let symbol = newAsset.symbol;
      if (!symbol) {
        try {
          symbol = await getTokenSymbol(newAsset.address, provider);
        } catch (error) {
          console.warn("Could not retrieve token symbol:", error);
          symbol = "UNKNOWN";
        }
      }

      showToast("Adding asset... Please confirm the transaction", "info");
      const tx = await managerWithSigner.addAsset(
        newAsset.riskLevel,
        newAsset.address,
        Math.floor(Number(newAsset.allocation) * 100), // Convert percentage to basis points
        symbol
      );
      await tx.wait();

      await loadAssetAllocations();
      await loadPortfolioCompositions();
      setNewAsset({ address: "", allocation: "", riskLevel: 0, symbol: "" });
      showToast("Asset added successfully to portfolio", "success");
    } catch (error) {
      console.error("Failed to add asset:", error);
      setError("Failed to add asset: " + parseWeb3Error(error));
      showToast(parseWeb3Error(error), "error");
    }
    setLoading(false);
  }

  // Initialize on load
  useEffect(() => {
    // Check if already connected
    if (window.ethereum) {
      window.ethereum.request({ method: "eth_accounts" }).then((accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          getBalance(accounts[0]);
          checkCorrectNetwork();
        }
      });

      // Listen for account changes
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          getBalance(accounts[0]);
        } else {
          setAccount("");
          setBalance(0);
        }
      });

      // Listen for network changes
      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }

    // Dark mode listener
    const darkModeMediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );
    darkModeMediaQuery.addEventListener("change", (e) =>
      setDarkMode(e.matches)
    );

    return () => {
      // Cleanup listeners
      if (window.ethereum) {
        window.ethereum.removeAllListeners("accountsChanged");
        window.ethereum.removeAllListeners("chainChanged");
      }
      darkModeMediaQuery.removeEventListener("change", (e) =>
        setDarkMode(e.matches)
      );
    };
  }, []);

  // Load data when account changes
  useEffect(() => {
    if (account) {
      loadPortfolios();
      loadPortfolioManager();
    }
  }, [account]);

  // Load portfolio data after manager is loaded
  useEffect(() => {
    if (account && portfolioManager) {
      loadPortfolioHoldings();
      loadAssetAllocations();
      loadPortfolioCompositions();
    }
  }, [account, portfolioManager]);

  return (
    <div className={`app-container ${darkMode ? "dark-mode" : ""}`}>
      <Header
        account={account}
        balance={balance}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {networkError && (
        <div className="error-message network-error">
          <strong>Network Error:</strong> {networkError}
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {!account ? (
        <WalletConnect onConnect={requestAccount} loading={loading} />
      ) : (
        <>
          <section className="section">
            <div className="section-header">
              <h2>Investment Portfolios</h2>
              <button
                onClick={loadPortfolios}
                className={`btn btn-refresh ${refreshing ? "refreshing" : ""}`}
                disabled={refreshing}
              >
                {refreshing ? (
                  <>
                    <span className="spinner-small"></span>
                    <span>Refreshing...</span>
                  </>
                ) : (
                  "Refresh Portfolios"
                )}
              </button>
            </div>

            <div className="portfolio-grid">
              {Object.entries(portfolios).map(([risk, data]) => (
                <PortfolioCard
                  key={risk}
                  risk={risk}
                  data={data}
                  selectedRisk={selectedRisk}
                  composition={portfolioCompositions[risk]}
                  onSelect={() => setSelectedRisk(Number(risk))}
                  getAssetColor={getAssetColor}
                />
              ))}
            </div>

            <InvestmentForm
              investAmount={investAmount}
              setInvestAmount={setInvestAmount}
              selectedRisk={selectedRisk}
              portfolios={portfolios}
              loading={loading}
              onInvest={invest}
            />
          </section>

          <section className="section performance">
            <h2>Portfolio Performance</h2>
            <div className="performance-grid">
              {Object.entries(portfolios).map(([risk, data]) => (
                <div
                  key={risk}
                  className={`performance-card risk-border-${
                    ["low", "medium", "high"][risk]
                  }`}
                >
                  <div
                    className={`performance-header risk-bg-${
                      ["low", "medium", "high"][risk]
                    }`}
                  >
                    <h3>{["Low", "Medium", "High"][risk]} Risk Performance</h3>
                  </div>
                  <div className="performance-metrics">
                    <div className="performance-metric">
                      <span className="metric-label">Current Value</span>
                      <span className="metric-value">
                        {Number(data.value).toFixed(4)} ETH
                      </span>
                    </div>
                    <div className="performance-metric">
                      <span className="metric-label">Token Price</span>
                      <span className="metric-value">
                        {Number(data.price).toFixed(4)} ETH
                      </span>
                    </div>
                    <div className="performance-chart-container">
                      <PerformanceChart
                        data={performanceHistory[risk]}
                        riskLevel={risk}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <Suspense fallback={<Loader />}>
            <PortfolioManagement
              assetAllocations={assetAllocations}
              newAsset={newAsset}
              setNewAsset={setNewAsset}
              addAssetToPortfolio={addAssetToPortfolio}
              loading={loading}
              getAssetColor={getAssetColor}
            />
          </Suspense>

          {account && Object.keys(holdings).length > 0 && (
            <Suspense fallback={<Loader />}>
              <Holdings
                holdings={holdings}
                withdrawAmounts={withdrawAmounts}
                setWithdrawAmounts={setWithdrawAmounts}
                withdraw={withdraw}
                loading={loading}
                loadPortfolioHoldings={loadPortfolioHoldings}
              />
            </Suspense>
          )}
        </>
      )}

      {toast.visible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, visible: false })}
        />
      )}
    </div>
  );
}

export default App;
