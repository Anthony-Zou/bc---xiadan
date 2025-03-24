import React from "react";

const InvestmentForm = ({
  investAmount,
  setInvestAmount,
  selectedRisk,
  portfolios,
  loading,
  onInvest,
}) => {
  const riskLabels = ["Low", "Medium", "High"];

  return (
    <div className="investment-form">
      <div className="invest-amount-group">
        <label htmlFor="invest-amount" className="form-label">
          Investment Amount (ETH):
        </label>
        <div className="input-group">
          <input
            id="invest-amount"
            type="number"
            value={investAmount}
            onChange={(e) => setInvestAmount(e.target.value)}
            placeholder="Enter amount"
            className="form-input"
            min="0"
            step="0.01"
          />
          <span className="input-suffix">ETH</span>
        </div>
      </div>

      <button
        onClick={onInvest}
        disabled={
          !selectedRisk || !investAmount || loading || Number(investAmount) <= 0
        }
        className={`btn btn-invest ${
          !selectedRisk || !investAmount || loading || Number(investAmount) <= 0
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
          "Invest Now"
        )}
      </button>

      {selectedRisk !== null && (
        <div className="selected-info">
          <p>
            Selected Portfolio:{" "}
            <span className="selected-risk">
              {riskLabels[selectedRisk]} Risk
            </span>
          </p>
          <p className="selected-address">
            Portfolio Address:{" "}
            <span>{portfolios[selectedRisk]?.address || "Not created"}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default InvestmentForm;
