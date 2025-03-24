import React from "react";

const WalletConnect = ({ onConnect, loading }) => {
  return (
    <div className="connect-wallet-container">
      <div className="connect-card">
        <div className="connect-card-header">
          <h2>Welcome to IntelliDeFi</h2>
          <p className="subtitle">The intelligent DeFi investment platform</p>
        </div>

        <div className="connect-card-content">
          <p>
            Invest in professionally managed crypto portfolios with different
            risk profiles.
          </p>

          <div className="feature-list">
            <div className="feature-item">
              <div className="feature-icon">🔒</div>
              <div className="feature-text">
                <h3>Secure</h3>
                <p>
                  Smart contract powered investments with full custody control
                </p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">📊</div>
              <div className="feature-text">
                <h3>Diversified</h3>
                <p>Optimized asset allocation based on your risk tolerance</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">⚙️</div>
              <div className="feature-text">
                <h3>Automated</h3>
                <p>Portfolio rebalancing to maintain optimal performance</p>
              </div>
            </div>
          </div>
        </div>

        <div className="connect-card-footer">
          <button
            onClick={onConnect}
            className="btn btn-connect-large"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-small"></span>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <span className="metamask-icon">🦊</span>
                <span>Connect with MetaMask</span>
              </>
            )}
          </button>

          <p className="wallet-helper">
            Don't have a wallet?{" "}
            <a
              href="https://metamask.io/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get MetaMask
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default WalletConnect;
