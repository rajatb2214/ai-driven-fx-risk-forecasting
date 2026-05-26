# NeuroChain: AI-Driven Cryptocurrency Prediction and Blockchain Trading Platform

NeuroChain is a demo-ready project for crypto forecasting, AI trading signals, virtual portfolio simulation, wallet connection, and ERC-20 coin launch planning.

## What Is Built

- AI crypto dashboard with BTC, ETH, SOL, and MATIC
- LSTM-style forecast simulation with BUY, SELL, and HOLD recommendations
- Canvas-based price and forecast chart
- Virtual trading simulator with portfolio tracking
- Demo blockchain transaction ledger
- MetaMask wallet connection
- Coin creator module for ERC-20 token planning
- FastAPI backend scaffold
- Solidity token factory contract

## Run Frontend

```bash
npm start
```

Open:

```text
http://localhost:4000
```

## Website Pages

- Home: `/`
- Dashboard: `/dashboard.html`
- AI Signals: `/predictions.html`
- Trading Simulator: `/trading.html`
- Blockchain: `/blockchain.html`
- Coin Creator: `/coin-creator.html`
- Architecture: `/architecture.html`
- Full Project Explanation: `docs/full_project_explanation.md`

## GitHub Pages Hosting

The repository includes `.github/workflows/deploy-neurochain-pages.yml`.
After pushing to GitHub, the workflow publishes `crypto-ai-platform/public` as the hosted website.

## Run Backend

```bash
cd backend
pip install -r requirements.txt
cd ..
npm run backend
```

Backend URL:

```text
http://localhost:8000
```

## API Endpoints

- `GET /health`
- `GET /market`
- `GET /predict/BTC`
- `POST /trade`
- `POST /tokens/plan`

## Suggested Final Year Project Phases

1. Build the dashboard and simulator.
2. Add real CoinGecko or Binance data.
3. Train a real LSTM model with TensorFlow or PyTorch.
4. Store users, predictions, trades, and tokens in a database.
5. Deploy the token factory contract on Polygon testnet.
6. Add NLP sentiment analysis using crypto news or social posts.
