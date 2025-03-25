import React from "react";

const PortfolioManagement = ({
  assetAllocations,
  newAsset,
  setNewAsset,
  addAssetToPortfolio,
  loading,
  getAssetColor,
}) => {
  return (
    <div className="section portfolio-management">
      <h2>Portfolio Composition Management</h2>

      {/* <div className="panel add-asset">
        <h3>Add New Asset</h3>
        <div className="asset-form">
          <div className="form-group">
            <label htmlFor="asset-address" className="form-label">
              Asset Address
            </label>
            <input
              id="asset-address"
              type="text"
              value={newAsset.address}
              onChange={(e) =>
                setNewAsset((prev) => ({ ...prev, address: e.target.value }))
              }
              placeholder="Enter token contract address"
              className="form-input asset-address"
            />
          </div>

          <div className="form-group">
            <label htmlFor="asset-symbol" className="form-label">
              Token Symbol
            </label>
            <input
              id="asset-symbol"
              type="text"
              value={newAsset.symbol}
              onChange={(e) =>
                setNewAsset((prev) => ({ ...prev, symbol: e.target.value }))
              }
              placeholder="e.g. BTC, ETH"
              className="form-input asset-symbol"
            />
          </div>

          <div className="form-group">
            <label htmlFor="asset-allocation" className="form-label">
              Allocation %
            </label>
            <input
              id="asset-allocation"
              type="number"
              value={newAsset.allocation}
              onChange={(e) =>
                setNewAsset((prev) => ({ ...prev, allocation: e.target.value }))
              }
              placeholder="0-100"
              className="form-input asset-allocation"
              min="0"
              max="100"
              step="0.1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="asset-risk" className="form-label">
              Risk Level
            </label>
            <select
              id="asset-risk"
              value={newAsset.riskLevel}
              onChange={(e) =>
                setNewAsset((prev) => ({
                  ...prev,
                  riskLevel: Number(e.target.value),
                }))
              }
              className="form-select"
            >
              <option value={0}>Low Risk</option>
              <option value={1}>Medium Risk</option>
              <option value={2}>High Risk</option>
            </select>
          </div>

          <button
            onClick={addAssetToPortfolio}
            disabled={!newAsset.address || !newAsset.allocation || loading}
            className={`btn btn-add ${
              !newAsset.address || !newAsset.allocation || loading
                ? "disabled"
                : ""
            }`}
          >
            {loading ? (
              <>
                <span className="spinner-small"></span>
                <span>Adding...</span>
              </>
            ) : (
              "Add Asset"
            )}
          </button>
        </div>
      </div> */}

      <div className="portfolio-allocations">
        {Object.entries(assetAllocations).map(([risk, assets]) => (
          <div key={risk} className="allocation-section">
            <h3
              className={`risk-title risk-bg-${
                ["low", "medium", "high"][risk]
              }`}
            >
              {["Low", "Medium", "High"][risk]} Risk Portfolio Composition
            </h3>

            {assets.length > 0 ? (
              <div className="allocation-summary">
                <div className="allocation-pie-chart">
                  <div className="pie-container">
                    {assets.map((asset, index) => {
                      const startPercent = assets
                        .slice(0, index)
                        .reduce(
                          (sum, a) => sum + Number(a.allocation) / 100,
                          0
                        );
                      const percent = Number(asset.allocation) / 100;

                      return (
                        <div
                          key={index}
                          className="pie-slice"
                          style={{
                            backgroundColor: getAssetColor(index),
                            clipPath: `conic-gradient(from 0deg, transparent 0% ${
                              startPercent * 100
                            }%, currentColor ${startPercent * 100}% ${
                              (startPercent + percent) * 100
                            }%, transparent ${
                              (startPercent + percent) * 100
                            }% 100%)`,
                          }}
                          title={`${asset.symbol || "Unknown"}: ${(
                            percent * 100
                          ).toFixed(1)}%`}
                        />
                      );
                    })}
                    <div className="pie-center"></div>
                  </div>
                </div>

                <div className="allocation-grid">
                  {assets.map((asset, index) => (
                    <div key={index} className="allocation-card">
                      <div className="asset-header">
                        <span
                          className="asset-color-indicator"
                          style={{ backgroundColor: getAssetColor(index) }}
                        />
                        <span className="asset-symbol-display">
                          {asset.symbol || "Unknown"}
                        </span>
                      </div>

                      <p className="asset-address-display">
                        {asset.address.slice(0, 6)}...{asset.address.slice(-4)}
                      </p>

                      <div className="allocation-bar-container">
                        <div
                          className="allocation-bar"
                          style={{
                            width: `${(Number(asset.allocation) / 100).toFixed(
                              2
                            )}%`,
                          }}
                        ></div>
                        <p className="allocation-percentage">
                          {(Number(asset.allocation) / 100).toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="empty-message">
                No assets configured for this risk level
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PortfolioManagement;
