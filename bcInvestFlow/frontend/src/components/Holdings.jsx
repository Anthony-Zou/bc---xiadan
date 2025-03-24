import React from "react";

const Holdings = ({
  holdings,
  withdrawAmounts,
  setWithdrawAmounts,
  withdraw,
  loading,
  loadPortfolioHoldings,
}) => {
  const getPercentage = (risk) => {
    const tokens = parseFloat(holdings[risk]?.tokens || 0);
    const max = Math.max(
      ...Object.values(holdings).map((h) => parseFloat(h.tokens || 0))
    );
    return max > 0 ? (tokens / max) * 100 : 0;
  };

  return (
    <div className="section holdings">
      <div className="section-header">
        <h2>Your Portfolio Holdings</h2>
        <button
          onClick={loadPortfolioHoldings}
          className="btn btn-refresh-holdings"
        >
          Refresh Holdings
        </button>
      </div>

      <div className="holdings-grid">
        {Object.entries(holdings).map(([risk, data]) => (
          <div key={risk} className="holdings-card">
            <div
              className={`holdings-header risk-bg-${
                ["low", "medium", "high"][risk]
              }`}
            >
              <h3>{["Low", "Medium", "High"][risk]} Risk Portfolio</h3>
            </div>

            <div className="holdings-metrics">
              <div className="holdings-chart">
                <div className="holdings-progress">
                  <div
                    className={`holdings-bar risk-bg-${
                      ["low", "medium", "high"][risk]
                    }`}
                    style={{ width: `${getPercentage(risk)}%` }}
                  ></div>
                </div>
              </div>

              <div className="holdings-detail">
                <div className="holdings-metric">
                  <span className="metric-label">Tokens Held</span>
                  <span className="metric-value">
                    {parseFloat(data.tokens).toFixed(6)}
                  </span>
                </div>
                <div className="holdings-metric">
                  <span className="metric-label">Value in ETH</span>
                  <span className="metric-value">
                    {parseFloat(data.value).toFixed(6)}
                  </span>
                </div>
              </div>
            </div>

            <div className="withdraw-form">
              <div className="withdraw-group">
                <label htmlFor={`withdraw-${risk}`} className="withdraw-label">
                  Withdraw Amount
                </label>
                <div className="input-group">
                  <input
                    id={`withdraw-${risk}`}
                    type="number"
                    value={withdrawAmounts[risk]}
                    onChange={(e) =>
                      setWithdrawAmounts((prev) => ({
                        ...prev,
                        [risk]: e.target.value,
                      }))
                    }
                    placeholder="Enter amount"
                    className="form-input"
                    min="0"
                    max={data.tokens}
                    step="0.000001"
                  />
                  <button
                    onClick={() => withdraw(Number(risk))}
                    disabled={
                      !withdrawAmounts[risk] ||
                      loading ||
                      Number(withdrawAmounts[risk]) <= 0
                    }
                    className={`btn btn-withdraw ${
                      !withdrawAmounts[risk] ||
                      loading ||
                      Number(withdrawAmounts[risk]) <= 0
                        ? "disabled"
                        : ""
                    }`}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-small"></span>
                        <span>Processing...</span>
                      </>
                    ) : (
                      "Withdraw"
                    )}
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  setWithdrawAmounts((prev) => ({
                    ...prev,
                    [risk]: data.tokens,
                  }));
                }}
                className="btn btn-link withdraw-max"
                disabled={parseFloat(data.tokens) <= 0}
              >
                Withdraw Max
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Holdings;
