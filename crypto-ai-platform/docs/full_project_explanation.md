# NeuroChain: AI-Driven Cryptocurrency Prediction and Blockchain Trading Platform

## Project Links

- GitHub Repository: https://github.com/rajatb2214/ai-driven-fx-risk-forecasting
- Live Website: https://raw.githack.com/rajatb2214/ai-driven-fx-risk-forecasting/main/crypto-ai-platform/public/index.html

## Project Overview

NeuroChain is an AI-driven cryptocurrency prediction and blockchain trading platform. The project combines artificial intelligence, crypto market analysis, virtual trading, wallet integration, blockchain transaction records, and ERC-20 token creation planning into one complete web-based system.

The platform is designed as a final year project prototype. It demonstrates how AI can support crypto price forecasting and trading recommendations, while blockchain technology can support secure wallet-based transactions and token launches.

## Problem Statement

Cryptocurrency markets are highly volatile and difficult for users to analyze manually. Prices can change quickly because of market demand, trading volume, investor sentiment, and news events. At the same time, blockchain-based trading platforms can be complex for beginners because they require wallet connection, transaction understanding, and smart contract knowledge.

This project solves the problem by providing one unified platform where users can:

1. View crypto market data.
2. See AI-based future price predictions.
3. Receive BUY, SELL, or HOLD trading recommendations.
4. Simulate trades without using real money.
5. Connect a wallet using MetaMask.
6. Generate a plan for launching a custom ERC-20 token.
7. Understand the full AI and blockchain project architecture.

## Objectives

- Build a clean and interactive cryptocurrency dashboard.
- Create an AI prediction engine concept for price forecasting.
- Generate trading signals based on price trend, sentiment, and volatility.
- Provide a trading simulator for virtual buy and sell decisions.
- Add blockchain wallet integration using MetaMask.
- Include a coin creator module based on the ERC-20 token standard.
- Provide backend API scaffolding for future real AI and blockchain integration.
- Host the project website and publish the source code on GitHub.

## Main Modules

### 1. Frontend Website

The frontend is a multi-page website built using HTML, CSS, and JavaScript. It is designed as a dashboard-style application rather than a simple static landing page.

Pages included:

- Home
- Dashboard
- AI Signals
- Trading Simulator
- Blockchain
- Coin Creator
- Architecture

The frontend includes charts, cards, forms, navigation, AI signal panels, wallet connection UI, and token launch forms.

### 2. AI Prediction Engine

The project includes an LSTM-style prediction concept. In the current MVP, the AI engine is simulated using market price movement, volatility, and sentiment values. This allows the website to demonstrate the complete AI workflow even before adding a trained TensorFlow or PyTorch model.

The AI engine produces:

- Current crypto price
- Predicted future price
- BUY, SELL, or HOLD signal
- Confidence score
- Market sentiment
- Risk score

In a production version, this module can be replaced with a real LSTM model trained on historical crypto data from APIs such as CoinGecko, Binance, or CoinMarketCap.

### 3. Trading Simulator

The trading simulator allows users to practice buying and selling cryptocurrencies using a virtual portfolio. It does not use real money.

Simulator features:

- Select coin
- Enter amount
- Buy virtual crypto
- Sell virtual crypto
- Track holdings
- Show portfolio value
- Generate demo transaction hashes

This module helps demonstrate trading logic without financial risk.

### 4. Blockchain Wallet Module

The blockchain module includes MetaMask wallet connection support. If MetaMask is installed, the frontend can request access to the user wallet and display a shortened wallet address.

Blockchain features planned:

- Wallet connection
- Polygon testnet support
- Transaction hash storage
- Smart contract interaction
- Token ownership records

The current version is demo-ready and prepared for real blockchain integration.

### 5. Coin Creator Module

The coin creator module allows users to enter:

- Token name
- Token symbol
- Total supply

The system then generates a token launch plan using the ERC-20 token standard. The project also includes a Solidity smart contract file named `TokenFactory.sol`, which can be extended and deployed using Hardhat.

### 6. Backend API

The backend is scaffolded using FastAPI. It provides routes for:

- Health check
- Market data
- AI predictions
- Trading simulation
- Token launch planning

Backend file:

```text
crypto-ai-platform/backend/app/main.py
```

Important API endpoints:

```text
GET /health
GET /market
GET /predict/{symbol}
POST /trade
POST /tokens/plan
```

## Technology Stack

### Frontend

- HTML
- CSS
- JavaScript
- Canvas chart rendering
- MetaMask browser wallet integration

### Backend

- Python
- FastAPI
- Pydantic
- Uvicorn

### AI and Machine Learning

- LSTM-ready architecture
- Time-series forecasting workflow
- Market trend classification
- Risk scoring
- Sentiment-ready model design

### Blockchain

- Solidity
- ERC-20 token standard
- Polygon testnet target
- MetaMask wallet connection
- Smart contract factory design

### Hosting and Version Control

- Git
- GitHub
- GitHub Actions workflow
- RawGitHack live website hosting link

## Project Architecture

The system follows this flow:

```text
User
  -> Frontend Website
  -> Backend API
  -> AI Prediction Engine
  -> Trading Signal
  -> Trading Simulator
  -> Blockchain Wallet / Smart Contract Layer
  -> Transaction or Token Record
```

## AI Workflow

1. Collect historical crypto price data.
2. Clean and preprocess the data.
3. Normalize price and volume values.
4. Train an LSTM model on previous price windows.
5. Predict future crypto prices.
6. Generate BUY, SELL, or HOLD signals.
7. Calculate risk and confidence scores.
8. Display results on the dashboard.

In the current MVP, the frontend uses a simulated prediction function to demonstrate this workflow interactively.

## Blockchain Workflow

1. User connects MetaMask wallet.
2. User performs a trade or creates a token plan.
3. The platform generates or stores a transaction record.
4. Future production version can send real transactions to Polygon.
5. Smart contracts can mint ERC-20 tokens and store launch events.

## Database Design

Recommended database tables for the full production version:

### Users

- id
- name
- email
- wallet_address
- created_at

### Predictions

- id
- coin
- current_price
- predicted_price
- confidence_score
- signal
- created_at

### Transactions

- id
- user_id
- coin
- side
- amount
- transaction_hash
- created_at

### Tokens

- id
- token_name
- symbol
- total_supply
- creator_wallet
- contract_address
- created_at

## Current Features Completed

- Multi-page website
- Home page
- Dashboard page
- AI Signals page
- Trading Simulator page
- Blockchain page
- Coin Creator page
- Architecture page
- Interactive crypto forecast chart
- AI signal generation
- Virtual trading simulator
- Demo transaction ledger
- MetaMask wallet button
- Token launch plan generator
- FastAPI backend scaffold
- Solidity ERC-20 token factory contract
- GitHub repository update
- Live hosted website link

## Future Enhancements

- Add real CoinGecko or Binance API data.
- Train a real TensorFlow or PyTorch LSTM model.
- Store users and transactions in MongoDB or PostgreSQL.
- Add authentication with JWT.
- Deploy smart contracts on Polygon Amoy testnet.
- Add real ethers.js contract calls.
- Add NLP sentiment analysis from news, Reddit, or X posts.
- Add AI chatbot for crypto assistance.
- Add portfolio profit/loss analysis.
- Add fraud detection for suspicious transactions.
- Add auto-trading bot logic.

## How to Run Locally

Open PowerShell and run:

```powershell
cd "C:\Users\RAJAT\Documents\New project\crypto-ai-platform"
.\start-project.bat
```

Then open:

```text
http://localhost:4000
```

## Conclusion

NeuroChain demonstrates a complete AI and blockchain-based crypto platform concept. It combines market forecasting, trading simulation, wallet interaction, and token launch planning in a single system. The project is suitable for academic presentation because it clearly includes artificial intelligence, blockchain, full-stack architecture, smart contracts, and a hosted web interface.
