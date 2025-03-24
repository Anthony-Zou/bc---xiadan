import React from "react";

const AssetAllocation = ({ assets, getAssetColor }) => {
  if (!assets || assets.length === 0) {
    return <p className="empty-message">No assets configured</p>;
  }

  const totalAllocation = assets.reduce(
    (sum, asset) => sum + parseFloat(asset.allocation),
    0
  );

  return (
    <div className="asset-allocation">
      <div className="allocation-summary">
        <div className="allocation-header">
          <span>Asset Allocation</span>
          <span className="total-allocation">
            {totalAllocation.toFixed(2)}%
          </span>
        </div>

        <div className="allocation-chart">
          <div className="pie-container">
            {assets.map((asset, index) => {
              const startPercent = assets
                .slice(0, index)
                .reduce((sum, a) => sum + parseFloat(a.allocation), 0);
              const percent = parseFloat(asset.allocation);

              return (
                <div
                  key={index}
                  className="pie-slice"
                  style={{
                    backgroundColor: getAssetColor(index),
                    clipPath: `conic-gradient(from 0deg, transparent 0% ${startPercent}%, currentColor ${startPercent}% ${
                      startPercent + percent
                    }%, transparent ${startPercent + percent}% 100%)`,
                  }}
                  title={`${asset.symbol}: ${percent.toFixed(1)}%`}
                />
              );
            })}
            <div className="pie-center"></div>
          </div>
        </div>

        <div className="allocation-list">
          {assets.map((asset, index) => (
            <div key={index} className="allocation-item">
              <div className="asset-info">
                <div
                  className="asset-color"
                  style={{ backgroundColor: getAssetColor(index) }}
                />
                <span className="asset-symbol">{asset.symbol}</span>
              </div>
              <span className="asset-allocation">{asset.percentage}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AssetAllocation;
