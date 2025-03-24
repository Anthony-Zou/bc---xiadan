import React from "react";

const PortfolioCard = ({
  risk,
  data,
  selectedRisk,
  composition,
  onSelect,
  getAssetColor,
}) => {
  const riskLabels = ["Low", "Medium", "High"];
  const riskDescriptions = ["Conservative", "Balanced", "Aggressive"];
  const riskStyles = ["low", "medium", "high"];

  return (
    <div
      className={`portfolio-card ${
        selectedRisk === Number(risk) ? "selected" : ""
      }`}
      onClick={onSelect}
    >
      <div className="portfolio-header">
        <h3>{riskLabels[risk]} Risk Portfolio</h3>
        <div className={`risk-badge risk-${riskStyles[risk]}`}>
          {riskDescriptions[risk]}
        </div>
      </div>

      <p className="portfolio-description">
        {composition?.description ||
          "Portfolio with automated asset allocation and rebalancing"}
      </p>

      <div className="portfolio-metrics">
        <div className="metric">
          <span className="metric-label">Token Price</span>
          <span className="metric-value">
            {Number(data.price).toFixed(6)} ETH
          </span>
        </div>
        <div className="metric">
          <span className="metric-label">Total Value</span>
          <span className="metric-value">
            {Number(data.value).toFixed(6)} ETH
          </span>
        </div>
      </div>

      <div className="composition-container">
        <div className="composition-header">
          <span>Portfolio Composition</span>
          <span className="total-allocation">
            {composition?.totalAllocation || "0%"}
          </span>
        </div>

        {composition?.assets?.length > 0 ? (
          <div className="asset-list">
            {composition.assets.map((asset, index) => (
              <div key={index} className="asset-item">
                <div className="asset-info">
                  <div
                    className="asset-color"
                    style={{ backgroundColor: getAssetColor(index) }}
                  ></div>
                  <span className="asset-symbol">{asset.symbol}</span>
                </div>
                <span className="asset-percentage">{asset.percentage}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-message">No assets configured</p>
        )}
      </div>
    </div>
  );
};

export default PortfolioCard;
