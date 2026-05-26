# NeuroChain Architecture

## Modules

1. Frontend Dashboard
   - Market overview
   - AI prediction panel
   - Buy/sell simulator
   - Wallet status
   - Token launch form

2. Backend API
   - `/market` returns coin data
   - `/predict/{symbol}` returns price prediction, signal, confidence, sentiment, and risk score
   - `/trade` records a simulated trade and transaction hash
   - `/tokens/plan` generates an ERC-20 deployment plan

3. AI Prediction Engine
   - MVP uses deterministic LSTM-style scoring based on momentum, volatility, and sentiment
   - Production version can replace this with TensorFlow or PyTorch LSTM training
   - Inputs: historical close price, volume, volatility, market cap, social sentiment
   - Outputs: future price, BUY/SELL/HOLD signal, confidence, risk score

4. Blockchain Layer
   - MetaMask wallet connection in frontend
   - Polygon testnet target
   - Solidity token factory contract for ERC-20 creation
   - Future work: deploy through Hardhat and store real transaction receipts

## Production Upgrade Path

1. Add CoinGecko or Binance historical market ingestion.
2. Train an LSTM model on rolling windows of OHLCV data.
3. Store users, predictions, trades, and tokens in PostgreSQL or MongoDB.
4. Deploy `TokenFactory.sol` with Hardhat on Polygon Amoy testnet.
5. Replace simulated transaction hashes with real contract calls through ethers.js.
