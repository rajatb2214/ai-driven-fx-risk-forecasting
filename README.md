# AI-Driven FX Risk Forecasting and Exotic Option Pricing

This project implements the PDF brief as working R code plus a running web dashboard.

## What It Does

- Loads historical EUR/USD data from `data/eurusd_sample.csv`
- Calculates log returns, annualized drift, and annualized volatility
- Simulates future EUR/USD paths using Geometric Brownian Motion
- Estimates terminal distribution risk and 95% Value at Risk
- Prices down-and-in call and put barrier options with Monte Carlo pricing
- Provides an R Shiny dashboard in `app.R`
- Provides a browser-ready dashboard in `public/` for machines without R installed

## Run The Website

```powershell
npm start
```

Open:

```text
http://localhost:3000
```

## Run The R Analysis

Install R, then run:

```powershell
Rscript run_analysis.R
```

## Run The Shiny App

Install the Shiny package once:

```r
install.packages("shiny")
```

Then run:

```powershell
Rscript -e "shiny::runApp('.', host='127.0.0.1', port=3838)"
```

Open:

```text
http://127.0.0.1:3838
```

## Main Files

- `R/fx_engine.R`: reusable R functions for GBM simulation, VaR, and barrier pricing
- `app.R`: R Shiny website
- `run_analysis.R`: command-line R analysis
- `data/eurusd_sample.csv`: sample EUR/USD monthly prices
- `public/index.html`, `public/app.js`, `public/styles.css`: local runnable dashboard
- `server.js`: small Node static server

## Note

R is not currently available on this machine's PATH, so the included Node website is the immediately runnable dashboard. The R files are complete and ready to run once R is installed or added to PATH.
