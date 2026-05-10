const samplePrices = [
  1.0818, 1.0836, 1.0791, 1.0714, 1.0848, 1.0712, 1.0823,
  1.1047, 1.1164, 1.0885, 1.0576, 1.0354, 1.0395, 1.0398,
  1.0812, 1.1327, 1.1349, 1.1784, 1.1416, 1.1681, 1.1732,
  1.1537, 1.1596, 1.1722, 1.1624, 1.1587, 1.0821, 1.1156
];

const $ = id => document.getElementById(id);

let seed = 123456789;
function rand() {
  seed = (1664525 * seed + 1013904223) >>> 0;
  return seed / 4294967296;
}

function normal() {
  const u = Math.max(rand(), 1e-12);
  const v = Math.max(rand(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function mean(values) {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function sd(values) {
  const m = mean(values);
  return Math.sqrt(values.reduce((a, b) => a + (b - m) ** 2, 0) / (values.length - 1));
}

function quantile(values, q) {
  const sorted = [...values].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sorted[base + 1] === undefined ? sorted[base] : sorted[base] + rest * (sorted[base + 1] - sorted[base]);
}

function estimateParams(prices) {
  const returns = [];
  for (let i = 1; i < prices.length; i++) returns.push(Math.log(prices[i] / prices[i - 1]));
  const sigmaPeriod = sd(returns);
  const meanPeriod = mean(returns);
  return {
    mu: (meanPeriod + 0.5 * sigmaPeriod ** 2) * 12,
    sigma: sigmaPeriod * Math.sqrt(12),
    returns
  };
}

function simulateGbm(S0, mu, sigma, horizon, steps, paths) {
  const dt = horizon / steps;
  const matrix = Array.from({ length: steps + 1 }, () => new Float64Array(paths));
  matrix[0].fill(S0);
  for (let i = 1; i <= steps; i++) {
    for (let j = 0; j < paths; j++) {
      matrix[i][j] = matrix[i - 1][j] * Math.exp((mu - 0.5 * sigma ** 2) * dt + sigma * Math.sqrt(dt) * normal());
    }
  }
  return matrix;
}

function barrierPrice(type, S0, K, barrier, rd, rf, T, vol, paths = 12000, steps = 126) {
  const dt = T / steps;
  let total = 0;
  let totalSq = 0;
  let touchedCount = 0;
  for (let p = 0; p < paths; p++) {
    let S = S0;
    let minS = S0;
    for (let i = 1; i <= steps; i++) {
      S *= Math.exp((rd - rf - 0.5 * vol ** 2) * dt + vol * Math.sqrt(dt) * normal());
      if (S < minS) minS = S;
    }
    const touched = minS <= barrier;
    if (touched) touchedCount++;
    const intrinsic = type === "call" ? Math.max(S - K, 0) : Math.max(K - S, 0);
    const payoff = touched ? intrinsic : 0;
    total += payoff;
    totalSq += payoff ** 2;
  }
  const disc = Math.exp(-rd * T);
  const avg = total / paths;
  const variance = Math.max(totalSq / paths - avg ** 2, 0);
  return {
    price: disc * avg,
    standardError: disc * Math.sqrt(variance / paths),
    activationProbability: touchedCount / paths
  };
}

function drawPaths(canvas, matrix, expected, varRate) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const pad = 42;
  ctx.clearRect(0, 0, width, height);
  const paths = Math.min(90, matrix[0].length);
  const all = [];
  for (let i = 0; i < matrix.length; i++) {
    for (let p = 0; p < paths; p++) all.push(matrix[i][p]);
  }
  all.push(expected, varRate);
  const minY = Math.min(...all) * 0.985;
  const maxY = Math.max(...all) * 1.015;
  const x = i => pad + (i / (matrix.length - 1)) * (width - pad * 1.5);
  const y = v => height - pad - ((v - minY) / (maxY - minY)) * (height - pad * 1.6);

  ctx.strokeStyle = "#d7dee9";
  ctx.lineWidth = 1;
  for (let g = 0; g < 5; g++) {
    const gy = pad / 2 + g * ((height - pad) / 5);
    ctx.beginPath();
    ctx.moveTo(pad, gy);
    ctx.lineTo(width - pad / 2, gy);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(40,100,216,0.13)";
  for (let p = 0; p < paths; p++) {
    ctx.beginPath();
    for (let i = 0; i < matrix.length; i++) {
      if (i === 0) ctx.moveTo(x(i), y(matrix[i][p]));
      else ctx.lineTo(x(i), y(matrix[i][p]));
    }
    ctx.stroke();
  }

  ctx.strokeStyle = "#c43d4b";
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < matrix.length; i++) {
    const avg = mean(Array.from(matrix[i]));
    if (i === 0) ctx.moveTo(x(i), y(avg));
    else ctx.lineTo(x(i), y(avg));
  }
  ctx.stroke();
}

function drawHistogram(canvas, values, varRate) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const pad = 40;
  ctx.clearRect(0, 0, width, height);
  const bins = 34;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const counts = Array(bins).fill(0);
  values.forEach(v => {
    const idx = Math.min(bins - 1, Math.floor(((v - min) / (max - min)) * bins));
    counts[idx]++;
  });
  const maxCount = Math.max(...counts);
  const barW = (width - pad * 1.5) / bins;
  counts.forEach((c, i) => {
    const h = (c / maxCount) * (height - pad * 1.7);
    ctx.fillStyle = "#79a9ee";
    ctx.fillRect(pad + i * barW, height - pad - h, Math.max(1, barW - 2), h);
  });
  const vx = pad + ((varRate - min) / (max - min)) * (width - pad * 1.5);
  ctx.strokeStyle = "#c43d4b";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(vx, pad / 2);
  ctx.lineTo(vx, height - pad);
  ctx.stroke();
}

function fmt(value, digits = 4) {
  return Number(value).toFixed(digits);
}

function setTable(rows) {
  $("table").innerHTML = rows.map(([label, value]) => `
    <div class="row"><span>${label}</span><strong>${value}</strong></div>
  `).join("");
}

function run() {
  seed = 123456789;
  const S0 = Number($("spot").value);
  const horizon = Number($("horizon").value);
  const steps = Number($("steps").value);
  const paths = Number($("paths").value);
  const strike = Number($("strike").value);
  const barrierCall = Number($("barrierCall").value);
  const barrierPut = Number($("barrierPut").value);
  const prices = [...samplePrices.slice(0, -1), S0];
  const params = estimateParams(prices);
  const matrix = simulateGbm(S0, params.mu, params.sigma, horizon, steps, paths);
  const terminal = Array.from(matrix[matrix.length - 1]);
  const expected = mean(terminal);
  const varRate = quantile(terminal, 0.05);
  const worst = Math.min(...terminal);
  const best = Math.max(...terminal);
  const probLoss = terminal.filter(v => v < S0).length / terminal.length;
  const rd = 0.0375;
  const rf = 0.035;
  const call = barrierPrice("call", S0, strike, barrierCall, rd, rf, 1, params.sigma);
  const put = barrierPrice("put", S0, strike, barrierPut, rd, rf, 1, params.sigma);

  $("expected").textContent = fmt(expected);
  $("varRate").textContent = fmt(varRate);
  $("callPrice").textContent = fmt(call.price, 5);
  $("putPrice").textContent = fmt(put.price, 5);
  $("modelStats").textContent = `Drift ${(params.mu * 100).toFixed(2)}% | Vol ${(params.sigma * 100).toFixed(2)}% | ${paths.toLocaleString()} paths`;

  drawPaths($("pathsChart"), matrix, expected, varRate);
  drawHistogram($("histChart"), terminal, varRate);
  setTable([
    ["Annualized drift", `${(params.mu * 100).toFixed(2)}%`],
    ["Annualized volatility", `${(params.sigma * 100).toFixed(2)}%`],
    ["Worst terminal case", fmt(worst)],
    ["Best terminal case", fmt(best)],
    ["95% VaR loss from spot", fmt(Math.max(S0 - varRate, 0))],
    ["Probability terminal loss", `${(probLoss * 100).toFixed(2)}%`],
    ["Call barrier activation", `${(call.activationProbability * 100).toFixed(2)}%`],
    ["Put barrier activation", `${(put.activationProbability * 100).toFixed(2)}%`]
  ]);
}

$("run").addEventListener("click", run);
run();
