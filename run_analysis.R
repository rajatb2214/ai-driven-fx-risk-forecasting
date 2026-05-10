source("R/fx_engine.R")

result <- run_fx_project()

cat("AI-Driven FX Risk Forecasting and Exotic Option Pricing\n")
cat("--------------------------------------------------------\n")
cat(sprintf("Latest EUR/USD: %.4f\n", tail(result$data$Price, 1)))
cat(sprintf("Annualized drift: %.2f%%\n", result$params$mu * 100))
cat(sprintf("Annualized volatility: %.2f%%\n", result$params$sigma * 100))
cat(sprintf("Expected 3-year EUR/USD: %.4f\n", result$risk$expected_terminal))
cat(sprintf("95%% VaR rate: %.4f\n", result$risk$var_95_rate))
cat(sprintf("Down-and-in call price: %.5f\n", result$down_in_call$price))
cat(sprintf("Down-and-in put price: %.5f\n", result$down_in_put$price))
