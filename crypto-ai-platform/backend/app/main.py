from datetime import datetime, timezone
from hashlib import sha256
from typing import Literal

from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(
    title="NeuroChain AI Crypto API",
    description="Backend API for crypto forecasts, virtual trades, and token launch planning.",
    version="1.0.0",
)


MARKET = {
    "BTC": {"price": 67240.0, "sentiment": 0.72, "volatility": 0.045},
    "ETH": {"price": 3580.0, "sentiment": 0.64, "volatility": 0.052},
    "SOL": {"price": 152.0, "sentiment": 0.58, "volatility": 0.071},
    "MATIC": {"price": 0.92, "sentiment": 0.68, "volatility": 0.061},
}


class PredictionResponse(BaseModel):
    coin: str
    current_price: float
    predicted_price: float
    signal: Literal["BUY", "SELL", "HOLD"]
    confidence: int
    sentiment: Literal["Bullish", "Bearish", "Neutral"]
    risk_score: int
    generated_at: datetime


class TradeRequest(BaseModel):
    coin: str = Field(..., examples=["BTC"])
    side: Literal["BUY", "SELL"]
    amount: float = Field(..., gt=0)
    wallet_address: str | None = None


class TradeResponse(BaseModel):
    coin: str
    side: str
    amount: float
    notional_usd: float
    tx_hash: str
    status: Literal["SIMULATED"]


class TokenRequest(BaseModel):
    name: str = Field(..., min_length=2)
    symbol: str = Field(..., min_length=2, max_length=8)
    total_supply: int = Field(..., ge=1000)
    owner_address: str | None = None


class TokenPlan(BaseModel):
    name: str
    symbol: str
    total_supply: int
    network: str
    contract_template: str
    deployment_status: Literal["READY_FOR_TESTNET"]


def make_prediction(symbol: str) -> PredictionResponse:
    coin = MARKET.get(symbol.upper(), MARKET["BTC"])
    drift = (coin["sentiment"] - 0.5) * 0.08 - coin["volatility"] * 0.08
    predicted_price = coin["price"] * (1 + drift)
    confidence = round(max(52, min(93, 62 + coin["sentiment"] * 25 - coin["volatility"] * 110)))
    risk_score = round(min(99, coin["volatility"] * 900 + (1 - coin["sentiment"]) * 35))
    signal = "BUY" if drift > 0.012 and confidence > 68 else "SELL" if drift < -0.01 else "HOLD"
    sentiment = "Bullish" if coin["sentiment"] > 0.66 else "Bearish" if coin["sentiment"] < 0.46 else "Neutral"

    return PredictionResponse(
        coin=symbol.upper(),
        current_price=coin["price"],
        predicted_price=round(predicted_price, 4),
        signal=signal,
        confidence=confidence,
        sentiment=sentiment,
        risk_score=risk_score,
        generated_at=datetime.now(timezone.utc),
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "neurochain-api"}


@app.get("/market")
def market() -> dict[str, dict[str, float]]:
    return MARKET


@app.get("/predict/{symbol}", response_model=PredictionResponse)
def predict(symbol: str) -> PredictionResponse:
    return make_prediction(symbol)


@app.post("/trade", response_model=TradeResponse)
def trade(payload: TradeRequest) -> TradeResponse:
    symbol = payload.coin.upper()
    price = MARKET.get(symbol, MARKET["BTC"])["price"]
    tx_seed = f"{symbol}:{payload.side}:{payload.amount}:{datetime.now(timezone.utc).isoformat()}"
    tx_hash = "0x" + sha256(tx_seed.encode("utf-8")).hexdigest()[:48]

    return TradeResponse(
        coin=symbol,
        side=payload.side,
        amount=payload.amount,
        notional_usd=round(payload.amount * price, 2),
        tx_hash=tx_hash,
        status="SIMULATED",
    )


@app.post("/tokens/plan", response_model=TokenPlan)
def token_plan(payload: TokenRequest) -> TokenPlan:
    symbol = payload.symbol.upper()
    contract_template = f'''contract {symbol}Token is ERC20 {{
    constructor() ERC20("{payload.name}", "{symbol}") {{
        _mint(msg.sender, {payload.total_supply} * 10 ** decimals());
    }}
}}'''

    return TokenPlan(
        name=payload.name,
        symbol=symbol,
        total_supply=payload.total_supply,
        network="Polygon Mumbai",
        contract_template=contract_template,
        deployment_status="READY_FOR_TESTNET",
    )
