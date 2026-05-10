# AI-Driven FX Risk Forecasting and Exotic Option Pricing System

## Presentation Document

This project is a quantitative finance and analytics system for forecasting EUR/USD foreign exchange risk and valuing exotic barrier options. It combines classical financial engineering with an AI-ready forecasting design.

## 1. Project Objective

The main objective is to build a practical system that can analyze EUR/USD exchange rate risk, simulate possible future market paths, estimate downside exposure, and price exotic options used in foreign exchange hedging.

The system focuses on five goals:

- Forecast future EUR/USD movement using stochastic modelling.
- Simulate thousands of future exchange-rate paths using Monte Carlo simulation.
- Estimate market risk with Value at Risk.
- Price down-and-in European barrier call and put options.
- Provide a working dashboard for interactive analysis and presentation.

## 2. Business Problem

Companies, banks, exporters, importers, and investors are exposed to currency movements. If EUR/USD changes unexpectedly, profits, costs, and portfolio values can change quickly. A forecasting and risk dashboard helps decision makers understand possible future outcomes instead of relying on one fixed prediction.

This project answers practical questions:

- What could EUR/USD look like over the next few years?
- What is the expected future exchange rate under current assumptions?
- What is the downside risk at a 95% confidence level?
- What is the value of a barrier option used for hedging?
- How likely is a barrier level to be touched?

## 3. Technologies Used

The project was implemented with:

- R programming for the financial model source code.
- R Shiny for the R-based dashboard.
- JavaScript and HTML/CSS for the immediately runnable browser dashboard.
- Monte Carlo simulation for path generation and option pricing.
- Geometric Brownian Motion for exchange-rate dynamics.
- Value at Risk for risk measurement.
- An AI-ready architecture that can later add LSTM or transformer forecasting.

## 4. System Architecture

The project is divided into seven modules:

1. Historical EUR/USD data collection.
2. Log return calculation.
3. GBM parameter estimation.
4. Monte Carlo risk simulation.
5. AI-based forecasting extension design.
6. Barrier option pricing.
7. Interactive visualization dashboard.

The R file `R/fx_engine.R` is the financial modelling engine. The file `app.R` provides the Shiny dashboard. The `public` folder contains a browser-ready dashboard that runs with `npm start`.

## 5. Data

The project uses a sample EUR/USD monthly price dataset stored in `data/eurusd_sample.csv`. The dataset contains two columns:

- `Date`: the observation date.
- `Price`: the EUR/USD exchange rate.

The application sorts the data by date, validates that all prices are positive, and uses the price series to calculate log returns.

## 6. Log Returns

Financial models usually work with returns instead of raw prices. This project uses log returns:

`r(t) = log(S(t) / S(t-1))`

where:

- `S(t)` is the current exchange rate.
- `S(t-1)` is the previous exchange rate.

Log returns are useful because they are additive over time and fit naturally with the GBM model.

## 7. Geometric Brownian Motion

Geometric Brownian Motion models exchange rates as a continuous stochastic process:

`dS(t) = mu * S(t) * dt + sigma * S(t) * dW(t)`

where:

- `S(t)` is the EUR/USD exchange rate.
- `mu` is the drift.
- `sigma` is the volatility.
- `dW(t)` is Brownian motion.

The discrete simulation formula used in the project is:

`S(t) = S(t-1) * exp((mu - 0.5 * sigma^2) * dt + sigma * sqrt(dt) * Z)`

where `Z` is a random standard normal variable.

## 8. Parameter Estimation

The system estimates drift and volatility from historical log returns.

Monthly volatility is calculated as the standard deviation of log returns. It is annualized using:

`annualized volatility = monthly volatility * sqrt(12)`

The annualized drift is calculated from the mean log return and volatility adjustment.

These estimated parameters are then used as inputs to the Monte Carlo simulation.

## 9. Monte Carlo Simulation

Monte Carlo simulation generates many possible future paths for EUR/USD. Instead of producing only one forecast, it produces a distribution of possible outcomes.

In this project, the user can control:

- Forecast horizon.
- Number of time steps.
- Number of simulation paths.
- Latest EUR/USD spot value.

The dashboard plots sample paths and highlights the average simulated path.

## 10. Risk Metrics

The system calculates:

- Expected terminal EUR/USD value.
- Terminal standard deviation.
- Worst-case and best-case terminal outcomes.
- Probability that the terminal exchange rate is below the current spot.
- 95% Value at Risk.

The 95% VaR rate is the 5th percentile of the terminal distribution. It represents a downside threshold: under the model assumptions, only 5% of simulated outcomes are worse than this value.

## 11. Exotic Barrier Option Pricing

The project prices down-and-in European call and put options.

A down-and-in option becomes active only if the exchange rate touches or falls below a barrier level before maturity. If the barrier is never reached, the option does not activate.

These products are useful in FX markets because they can be cheaper than vanilla options and can be designed around specific hedging views.

## 12. Option Pricing Method

The PDF brief mentions the Reiner-Rubinstein analytical model. This implementation includes a robust Monte Carlo barrier option pricer in R so the project can run without requiring specialized external pricing libraries.

For each simulated option path:

1. Simulate the EUR/USD path under risk-neutral drift.
2. Check whether the minimum path value touches the down barrier.
3. If the barrier is touched, calculate the call or put payoff.
4. Discount the average payoff back to present value.

The model also reports the barrier activation probability.

## 13. AI Forecasting Integration

The project is AI-ready. The current implementation uses GBM and Monte Carlo simulation as the working quantitative core. The AI extension can add an LSTM model or transformer-based time-series model later.

The planned AI pipeline is:

1. Load and clean historical EUR/USD data.
2. Normalize the price or return series.
3. Create rolling input sequences.
4. Train an LSTM model.
5. Forecast future exchange rates.
6. Compare AI forecasts against GBM simulation results.

This structure allows the project to compare classical finance models with machine learning models.

## 14. Website Dashboard

The dashboard provides interactive controls for:

- Latest EUR/USD value.
- Forecast horizon.
- Monthly steps.
- Simulation paths.
- Option strike.
- Call barrier.
- Put barrier.

It displays:

- Expected future EUR/USD.
- 95% VaR rate.
- Down-and-in call price.
- Down-and-in put price.
- Monte Carlo FX paths.
- Terminal distribution histogram.
- Risk metrics table.

## 15. How To Run

To run the browser dashboard:

`npm start`

Then open:

`http://localhost:3000`

To run the R command-line analysis after R is installed:

`Rscript run_analysis.R`

To run the R Shiny app:

`Rscript -e "shiny::runApp('.', host='127.0.0.1', port=3838)"`

Then open:

`http://127.0.0.1:3838`

## 16. Project Files

Important files:

- `R/fx_engine.R`: R modelling engine.
- `app.R`: R Shiny dashboard.
- `run_analysis.R`: command-line R analysis.
- `data/eurusd_sample.csv`: sample EUR/USD data.
- `public/index.html`: web dashboard page.
- `public/app.js`: browser simulation and chart logic.
- `public/styles.css`: dashboard styling.
- `server.js`: local website server.

## 17. Results Interpretation

The dashboard should be interpreted as a scenario and risk analysis tool. The expected terminal value gives the average simulated outcome, but the terminal distribution is more important because it shows the range of possible outcomes.

The VaR value gives a downside threshold. The barrier option prices show the model value of hedging contracts that only activate when the exchange rate touches a chosen lower barrier.

If volatility increases, the simulated distribution becomes wider, VaR becomes more severe, and barrier activation probabilities usually increase.

## 18. Limitations

The model has important limitations:

- GBM assumes constant drift and volatility.
- Real FX markets can have jumps, regime changes, and volatility clustering.
- The sample dataset is small and should be replaced with live or larger historical data for production use.
- Monte Carlo pricing has simulation error.
- The AI model is designed as an extension but not trained in the current version.

## 19. Future Enhancements

Future improvements can include:

- Real-time forex API integration.
- LSTM forecasting in R with Keras.
- Transformer-based financial forecasting.
- Multi-currency support.
- More option types such as up-and-out, up-and-in, and double-barrier options.
- Backtesting of forecast accuracy.
- Stress testing with crisis scenarios.

## 20. Conclusion

This project demonstrates how artificial intelligence concepts, stochastic modelling, Monte Carlo simulation, Value at Risk, and exotic option pricing can be combined into one practical financial risk dashboard.

It is suitable for presentation because it includes a working website, complete R source code, clear financial formulas, interactive scenario controls, and explainable outputs for EUR/USD risk forecasting.
