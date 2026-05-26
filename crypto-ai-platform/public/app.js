const coins = {
  BTC: {
    name: "Bitcoin",
    price: 67240,
    base: [64120, 64880, 65310, 64730, 65990, 66540, 67240],
    volatility: 0.045,
    sentiment: 0.72
  },
  ETH: {
    name: "Ethereum",
    price: 3580,
    base: [3340, 3415, 3490, 3440, 3520, 3562, 3580],
    volatility: 0.052,
    sentiment: 0.64
  },
  SOL: {
    name: "Solana",
    price: 152,
    base: [138, 143, 146, 141, 149, 151, 152],
    volatility: 0.071,
    sentiment: 0.58
  },
  MATIC: {
    name: "Polygon",
    price: 0.92,
    base: [0.84, 0.88, 0.86, 0.89, 0.9, 0.91, 0.92],
    volatility: 0.061,
    sentiment: 0.68
  }
};

const state = {
  selectedCoin: "BTC",
  cash: 25000,
  holdings: { BTC: 0, ETH: 0, SOL: 0, MATIC: 0 },
  ledger: []
};

const formatMoney = (value) => {
  const digits = Math.abs(value) < 10 ? 4 : 2;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);
};

function forecastCoin(symbol) {
  const coin = coins[symbol];
  const history = [...coin.base];
  const last = history[history.length - 1];
  const momentum = (last - history[0]) / history[0];
  const sentimentBoost = (coin.sentiment - 0.5) * 0.055;
  const drift = momentum * 0.4 + sentimentBoost;
  const prediction = last * (1 + drift);
  const confidence = Math.max(52, Math.min(93, 62 + coin.sentiment * 25 - coin.volatility * 110));
  const risk = Math.min(99, Math.round(coin.volatility * 900 + (1 - coin.sentiment) * 35));
  const signal = drift > 0.025 && confidence > 68 ? "BUY" : drift < -0.012 ? "SELL" : "HOLD";
  const forecast = Array.from({ length: 6 }, (_, index) => {
    const t = index + 1;
    const wave = Math.sin(index * 1.7 + last / 1000) * coin.volatility * last * 0.45;
    return last + ((prediction - last) / 6) * t + wave;
  });

  return {
    history,
    forecast,
    prediction,
    confidence: Math.round(confidence),
    risk,
    signal,
    sentiment: coin.sentiment > 0.66 ? "Bullish" : coin.sentiment < 0.46 ? "Bearish" : "Neutral",
    reason:
      signal === "BUY"
        ? "Momentum, sentiment, and model confidence support accumulation."
        : signal === "SELL"
          ? "Volatility is rising faster than expected upside."
          : "The model sees balanced upside and downside for this window."
  };
}

function drawChart() {
  const canvas = document.getElementById("priceChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const symbol = state.selectedCoin;
  const model = forecastCoin(symbol);
  const values = [...model.history, ...model.forecast];
  const padding = 42;
  const width = canvas.width;
  const height = canvas.height;
  const min = Math.min(...values) * 0.985;
  const max = Math.max(...values) * 1.015;
  const xStep = (width - padding * 2) / (values.length - 1);
  const y = (value) => height - padding - ((value - min) / (max - min)) * (height - padding * 2);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#e3e9f2";
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i += 1) {
    const gy = padding + i * ((height - padding * 2) / 4);
    ctx.beginPath();
    ctx.moveTo(padding, gy);
    ctx.lineTo(width - padding, gy);
    ctx.stroke();
  }

  ctx.strokeStyle = "#0f8b8d";
  ctx.lineWidth = 4;
  ctx.beginPath();
  model.history.forEach((value, index) => {
    const x = padding + index * xStep;
    if (index === 0) ctx.moveTo(x, y(value));
    else ctx.lineTo(x, y(value));
  });
  ctx.stroke();

  ctx.setLineDash([10, 8]);
  ctx.strokeStyle = "#c7821f";
  ctx.beginPath();
  model.forecast.forEach((value, index) => {
    const x = padding + (model.history.length + index) * xStep;
    if (index === 0) ctx.moveTo(padding + (model.history.length - 1) * xStep, y(model.history.at(-1)));
    ctx.lineTo(x, y(value));
  });
  ctx.stroke();
  ctx.setLineDash([]);

  values.forEach((value, index) => {
    ctx.fillStyle = index < model.history.length ? "#0f8b8d" : "#c7821f";
    ctx.beginPath();
    ctx.arc(padding + index * xStep, y(value), 5, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "#667085";
  ctx.font = "22px Inter, sans-serif";
  ctx.fillText(`${coins[symbol].name} historical price and AI forecast`, padding, 30);
  ctx.font = "16px Inter, sans-serif";
  ctx.fillText("Actual", padding, height - 10);
  ctx.fillStyle = "#c7821f";
  ctx.fillText("Forecast", padding + model.history.length * xStep, height - 10);
}

function renderPrediction() {
  if (!document.getElementById("signalText")) return;
  const symbol = state.selectedCoin;
  const coin = coins[symbol];
  const model = forecastCoin(symbol);
  const delta = ((model.prediction - coin.price) / coin.price) * 100;

  document.getElementById("selectedCoin").textContent = symbol;
  document.getElementById("signalText").textContent = model.signal;
  document.getElementById("signalReason").textContent = model.reason;
  document.getElementById("currentPrice").textContent = formatMoney(coin.price);
  document.getElementById("predictedPrice").textContent = formatMoney(model.prediction);
  document.getElementById("confidence").textContent = `${model.confidence}%`;
  document.getElementById("sentiment").textContent = model.sentiment;
  if (document.getElementById("bestSignal")) {
    document.getElementById("bestSignal").textContent = `${symbol} ${model.signal}`;
    document.getElementById("bestSignalMeta").textContent = `${model.confidence}% confidence, ${delta.toFixed(2)}% expected`;
  }
  if (document.getElementById("riskScore")) {
    document.getElementById("riskScore").textContent = model.risk > 65 ? "High" : model.risk > 38 ? "Medium" : "Low";
  }

  const signalCard = document.getElementById("signalCard");
  signalCard.className = "signal-card";
  if (model.signal === "SELL") signalCard.classList.add("sell");
  if (model.signal === "HOLD") signalCard.classList.add("hold");
}

function portfolioValue() {
  return Object.entries(state.holdings).reduce((sum, [symbol, amount]) => sum + amount * coins[symbol].price, state.cash);
}

function renderHoldings() {
  if (document.getElementById("portfolioValue")) {
    document.getElementById("portfolioValue").textContent = formatMoney(portfolioValue());
    document.getElementById("portfolioDelta").textContent = `${formatMoney(state.cash)} virtual cash`;
  }
  if (document.getElementById("holdings")) {
    document.getElementById("holdings").innerHTML = Object.entries(state.holdings)
      .map(([symbol, amount]) => {
        const value = amount * coins[symbol].price;
        return `<div class="holding-row"><div><strong>${symbol}</strong><small>${amount.toFixed(4)} coins</small></div><strong>${formatMoney(value)}</strong></div>`;
      })
      .join("");
  }
}

function renderLedger() {
  if (!document.getElementById("ledger")) return;
  const rows = state.ledger.slice(0, 6).map((entry) => {
    return `<div class="ledger-row"><div><strong>${entry.side} ${entry.amount} ${entry.symbol}</strong><small>${entry.time}</small><span>${entry.hash}</span></div><strong>${formatMoney(entry.value)}</strong></div>`;
  });
  document.getElementById("ledger").innerHTML =
    rows.join("") || '<div class="ledger-row"><div><strong>No transactions yet</strong><small>Trades will generate demo blockchain hashes here.</small></div></div>';
}

function recordTrade(side, symbol, amount) {
  const price = coins[symbol].price;
  const value = amount * price;

  if (side === "BUY" && value > state.cash) {
    alert("Not enough virtual cash for this trade.");
    return;
  }

  if (side === "SELL" && amount > state.holdings[symbol]) {
    alert("Not enough coin balance for this sell order.");
    return;
  }

  state.cash += side === "BUY" ? -value : value;
  state.holdings[symbol] += side === "BUY" ? amount : -amount;
  state.ledger.unshift({
    side,
    symbol,
    amount: amount.toFixed(4),
    value,
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    hash: `0x${crypto.getRandomValues(new Uint32Array(4)).join("").slice(0, 28)}`
  });

  renderHoldings();
  renderLedger();
}

async function connectWallet() {
  const walletStatus = document.getElementById("walletStatus");
  const walletAddress = document.getElementById("walletAddress");
  if (!walletStatus || !walletAddress) return;
  if (!window.ethereum) {
    walletStatus.textContent = "Demo wallet";
    walletAddress.textContent = "Install MetaMask for real wallet access";
    return;
  }

  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  const account = accounts[0];
  walletStatus.textContent = "Connected";
  walletAddress.textContent = `${account.slice(0, 6)}...${account.slice(-4)}`;
}

function renderTokenPreview(event) {
  event.preventDefault();
  const name = document.getElementById("tokenName").value.trim() || "Demo Token";
  const symbol = document.getElementById("tokenSymbol").value.trim().toUpperCase() || "DMT";
  const supply = Number(document.getElementById("tokenSupply").value || 1000000).toLocaleString();
  document.getElementById("tokenPreview").innerHTML = `
    <strong>${name} (${symbol}) launch plan generated</strong>
    <p>Deploy an ERC-20 token with ${supply} initial supply to the connected wallet on Polygon testnet.</p>
    <pre>constructor() ERC20("${name}", "${symbol}") {
  _mint(msg.sender, ${supply.replaceAll(",", "")} * 10 ** decimals());
}</pre>
  `;
}

function bindEvents() {
  document.querySelectorAll(".coin-tab").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".coin-tab").forEach((tab) => tab.classList.remove("active"));
      button.classList.add("active");
      state.selectedCoin = button.dataset.coin;
      if (document.getElementById("tradeCoin")) {
        document.getElementById("tradeCoin").value = state.selectedCoin;
      }
      drawChart();
      renderPrediction();
    });
  });

  const refreshModel = document.getElementById("refreshModel");
  if (refreshModel) refreshModel.addEventListener("click", () => {
    Object.values(coins).forEach((coin) => {
      const movement = (Math.random() - 0.42) * coin.volatility;
      coin.price = Math.max(0.01, coin.price * (1 + movement));
      coin.base.push(coin.price);
      coin.base.shift();
      coin.sentiment = Math.max(0.2, Math.min(0.9, coin.sentiment + (Math.random() - 0.5) * 0.08));
    });
    drawChart();
    renderPrediction();
    renderHoldings();
  });

  const tradeForm = document.getElementById("tradeForm");
  if (tradeForm) tradeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const submitter = event.submitter;
    const side = submitter.dataset.side;
    const symbol = document.getElementById("tradeCoin").value;
    const amount = Number(document.getElementById("tradeAmount").value);
    if (amount > 0) recordTrade(side, symbol, amount);
  });

  const connectWalletButton = document.getElementById("connectWallet");
  if (connectWalletButton) connectWalletButton.addEventListener("click", connectWallet);
  const tokenForm = document.getElementById("tokenForm");
  if (tokenForm) tokenForm.addEventListener("submit", renderTokenPreview);
}

bindEvents();
drawChart();
renderPrediction();
renderHoldings();
renderLedger();
