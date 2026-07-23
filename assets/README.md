# Screenshots

This directory contains screenshots of the live StockFlow application.

## Available Screenshots

| File | View |
|------|------|
| `dashboard.png` | Market Overview — indices, stat cards, top gainers/losers, and news sentiment |
| `stocks.png` | Stock List with search, sortable table, and price flash indicators |
| `stock-detail.png` | Stock Detail — candlestick chart, technical indicators (MA, RSI, MACD) |
| `portfolio.png` | Portfolio View — holdings table, performance chart, allocation pie chart |
| `compare.png` | Compare View — normalized performance overlay and side-by-side metrics |
| `news.png` | News Feed with sentiment badges and symbol filtering |

## Regenerating Screenshots

To regenerate screenshots, run:

```bash
cd frontend
npm install --no-save puppeteer
node ../scripts/screenshots.mjs
npm uninstall puppeteer
```
