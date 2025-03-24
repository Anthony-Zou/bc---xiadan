# IntelliDeFi Investment Platform

A blockchain-based investment platform that enables users to invest in diversified portfolios with different risk levels.

## Features

- Invest ETH into risk-based portfolios
- Receive ERC20 tokens representing your investment
- Withdraw your investment at any time
- Automated portfolio rebalancing
- Customizable asset allocation

## Getting Started

### Prerequisites

- Node.js (>= 18.0.0)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd bcInvestFlow

# Install dependencies
npm install
```

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
npm test
```

### Local Deployment

```bash
# Start a local blockchain
npm run node

# In a new terminal, deploy contracts
npm run deploy
```

## Frontend Development

### Setup Frontend

```bash
# Install frontend dependencies
cd frontend
npm install
```

### Run Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Testing with Frontend

1. Start your local blockchain node:

```bash
npm run node
```

2. Deploy contracts:

```bash
npm run deploy
```

3. Start the frontend development server:

```bash
cd frontend
npm run dev
```

4. Connect your MetaMask wallet to localhost:8545

## Project Structure

- `contracts/`: Solidity smart contracts
- `test/`: Test files
- `scripts/`: Deployment scripts

## License

ISC
