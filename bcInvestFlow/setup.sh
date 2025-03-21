#!/bin/bash

echo "Setting up IntelliDeFi project..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Compile contracts
echo "Compiling contracts..."
npm run compile

# Run tests
echo "Running tests..."
npm test

echo "Setup complete! Here are some commands you can run:"
echo "npm run node - Start a local Hardhat node"
echo "npm run deploy - Deploy contracts to local network"
echo "npm test - Run tests"
echo "npm run compile - Compile contracts"

chmod +x setup.sh
