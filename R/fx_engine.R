read_fx_data <- function(path = "data/eurusd_sample.csv") {
  data <- read.csv(path, stringsAsFactors = FALSE)
  data$Date <- as.Date(data$Date)
  data <- data[order(data$Date), ]
  if (!all(c("Date", "Price") %in% names(data))) {
    stop("Input data must contain Date and Price columns.")
  }
  if (any(!is.finite(data$Price)) || any(data$Price <= 0)) {
    stop("All FX prices must be positive numeric values.")
  }
  data
}

estimate_gbm <- function(price, periods_per_year = 12) {
  log_returns <- diff(log(price))
  sigma_period <- sd(log_returns)
  mean_period <- mean(log_returns)
  list(
    log_returns = log_returns,
    mu = (mean_period + 0.5 * sigma_period^2) * periods_per_year,
    sigma = sigma_period * sqrt(periods_per_year),
    mean_return = mean_period * periods_per_year
  )
}

simulate_gbm <- function(S0, mu, sigma, horizon_years = 3, steps = 36,
                         paths = 10000, seed = 123) {
  set.seed(seed)
  dt <- horizon_years / steps
  S <- matrix(0, nrow = steps + 1, ncol = paths)
  S[1, ] <- S0
  for (i in 2:(steps + 1)) {
    Z <- rnorm(paths)
    S[i, ] <- S[i - 1, ] * exp((mu - 0.5 * sigma^2) * dt + sigma * sqrt(dt) * Z)
  }
  S
}

risk_summary <- function(S, S0) {
  ST <- S[nrow(S), ]
  list(
    expected_terminal = mean(ST),
    volatility_terminal = sd(ST),
    var_95_rate = as.numeric(quantile(ST, 0.05)),
    var_95_loss = S0 - as.numeric(quantile(ST, 0.05)),
    best_case = max(ST),
    worst_case = min(ST),
    probability_loss = mean(ST < S0)
  )
}

black_scholes_fx <- function(type, S, K, rd, rf, T, vol) {
  d1 <- (log(S / K) + (rd - rf + 0.5 * vol^2) * T) / (vol * sqrt(T))
  d2 <- d1 - vol * sqrt(T)
  if (type == "call") {
    S * exp(-rf * T) * pnorm(d1) - K * exp(-rd * T) * pnorm(d2)
  } else {
    K * exp(-rd * T) * pnorm(-d2) - S * exp(-rf * T) * pnorm(-d1)
  }
}

monte_carlo_down_in <- function(type, S0, K, barrier, rd, rf, T, vol,
                                steps = 252, paths = 30000, rebate = 0,
                                seed = 456) {
  set.seed(seed)
  dt <- T / steps
  S <- matrix(0, nrow = steps + 1, ncol = paths)
  S[1, ] <- S0
  for (i in 2:(steps + 1)) {
    Z <- rnorm(paths)
    S[i, ] <- S[i - 1, ] * exp((rd - rf - 0.5 * vol^2) * dt + vol * sqrt(dt) * Z)
  }
  touched <- apply(S, 2, min) <= barrier
  ST <- S[nrow(S), ]
  intrinsic <- if (type == "call") pmax(ST - K, 0) else pmax(K - ST, 0)
  payoff <- ifelse(touched, intrinsic, rebate)
  price <- exp(-rd * T) * mean(payoff)
  se <- exp(-rd * T) * sd(payoff) / sqrt(paths)
  list(price = price, standard_error = se, activation_probability = mean(touched))
}

run_fx_project <- function(data_path = "data/eurusd_sample.csv",
                           horizon_years = 3, steps = 36, paths = 10000,
                           strike = 1.17, barrier_call = 1.07,
                           barrier_put = 1.03, rd = 0.0375,
                           rf = 0.035, option_maturity = 1) {
  data <- read_fx_data(data_path)
  params <- estimate_gbm(data$Price)
  S0 <- tail(data$Price, 1)
  S <- simulate_gbm(S0, params$mu, params$sigma, horizon_years, steps, paths)
  risk <- risk_summary(S, S0)
  call <- monte_carlo_down_in("call", S0, strike, barrier_call, rd, rf,
                              option_maturity, params$sigma)
  put <- monte_carlo_down_in("put", S0, strike, barrier_put, rd, rf,
                             option_maturity, params$sigma)
  list(data = data, params = params, paths = S, risk = risk,
       down_in_call = call, down_in_put = put)
}
