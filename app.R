library(shiny)

source("R/fx_engine.R")

ui <- fluidPage(
  tags$head(
    tags$title("AI-Driven FX Risk Forecasting"),
    tags$style(HTML("
      body { background: #f7f8fb; color: #18212f; }
      .wrap { max-width: 1180px; margin: 0 auto; }
      .hero { padding: 24px 0 12px; }
      .hero h1 { font-size: 30px; margin: 0 0 6px; }
      .panel { background: white; border: 1px solid #dfe4ec; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
      .metric { font-size: 24px; font-weight: 700; }
      .label { color: #667085; font-size: 12px; text-transform: uppercase; }
    "))
  ),
  div(class = "wrap",
    div(class = "hero",
      h1("AI-Driven FX Risk Forecasting"),
      p("EUR/USD GBM forecasting, Monte Carlo VaR, and down-and-in barrier option pricing.")
    ),
    sidebarLayout(
      sidebarPanel(
        numericInput("paths", "Monte Carlo paths", 10000, min = 1000, max = 50000, step = 1000),
        numericInput("steps", "Forecast steps", 36, min = 12, max = 120, step = 12),
        numericInput("horizon", "Horizon in years", 3, min = 1, max = 10, step = 1),
        numericInput("strike", "Option strike", 1.17, min = 0.5, max = 2, step = 0.01),
        numericInput("barrier_call", "Call barrier", 1.07, min = 0.5, max = 2, step = 0.01),
        numericInput("barrier_put", "Put barrier", 1.03, min = 0.5, max = 2, step = 0.01),
        actionButton("rerun", "Run simulation")
      ),
      mainPanel(
        fluidRow(
          column(3, div(class = "panel", div(class = "label", "Expected terminal"), div(class = "metric", textOutput("expected")))),
          column(3, div(class = "panel", div(class = "label", "95% VaR rate"), div(class = "metric", textOutput("var")))),
          column(3, div(class = "panel", div(class = "label", "Down-in call"), div(class = "metric", textOutput("call")))),
          column(3, div(class = "panel", div(class = "label", "Down-in put"), div(class = "metric", textOutput("put"))))
        ),
        div(class = "panel", plotOutput("paths_plot", height = 310)),
        div(class = "panel", plotOutput("distribution_plot", height = 280)),
        div(class = "panel", tableOutput("summary_table"))
      )
    )
  )
)

server <- function(input, output, session) {
  result <- eventReactive(input$rerun, {
    run_fx_project(
      horizon_years = input$horizon,
      steps = input$steps,
      paths = input$paths,
      strike = input$strike,
      barrier_call = input$barrier_call,
      barrier_put = input$barrier_put
    )
  }, ignoreNULL = FALSE)

  output$expected <- renderText(sprintf("%.4f", result()$risk$expected_terminal))
  output$var <- renderText(sprintf("%.4f", result()$risk$var_95_rate))
  output$call <- renderText(sprintf("%.5f", result()$down_in_call$price))
  output$put <- renderText(sprintf("%.5f", result()$down_in_put$price))

  output$paths_plot <- renderPlot({
    S <- result()$paths
    matplot(S[, 1:min(80, ncol(S))], type = "l", lty = 1, col = rgb(0.1, 0.3, 0.7, 0.12),
            xlab = "Step", ylab = "EUR/USD", main = "Simulated GBM Paths")
    lines(rowMeans(S), col = "#d1495b", lwd = 3)
  })

  output$distribution_plot <- renderPlot({
    ST <- result()$paths[nrow(result()$paths), ]
    hist(ST, breaks = 40, col = "#86b6f6", border = "white",
         main = "Terminal EUR/USD Distribution", xlab = "Terminal EUR/USD")
    abline(v = result()$risk$var_95_rate, col = "#d1495b", lwd = 3)
  })

  output$summary_table <- renderTable({
    r <- result()
    data.frame(
      Metric = c("Annualized drift", "Annualized volatility", "Worst case",
                 "Best case", "Probability terminal loss", "Call activation probability",
                 "Put activation probability"),
      Value = c(
        sprintf("%.2f%%", r$params$mu * 100),
        sprintf("%.2f%%", r$params$sigma * 100),
        sprintf("%.4f", r$risk$worst_case),
        sprintf("%.4f", r$risk$best_case),
        sprintf("%.2f%%", r$risk$probability_loss * 100),
        sprintf("%.2f%%", r$down_in_call$activation_probability * 100),
        sprintf("%.2f%%", r$down_in_put$activation_probability * 100)
      )
    )
  })
}

shinyApp(ui, server)
