package com.stockflow.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@RestController @RequestMapping("/api") @CrossOrigin(origins = "http://localhost:5173")
class ApiController {
    private final StockRepository stocks;
    private final StockPriceRepository prices;
    private final MarketIndexRepository indices;
    private final NewsItemRepository news;
    private final PortfolioRepository portfolios;
    private final PortfolioHoldingRepository holdings;
    private final TradeRepository trades;
    private final PriceSimulator simulator;
    private final IndicatorsService indicators;
    private final PricePublisher pricePublisher;

    ApiController(StockRepository stocks, StockPriceRepository prices, MarketIndexRepository indices,
                  NewsItemRepository news, PortfolioRepository portfolios,
                  PortfolioHoldingRepository holdings, TradeRepository trades,
                  PriceSimulator simulator, IndicatorsService indicators,
                  PricePublisher pricePublisher) {
        this.stocks = stocks; this.prices = prices; this.indices = indices;
        this.news = news; this.portfolios = portfolios; this.holdings = holdings;
        this.trades = trades; this.simulator = simulator; this.indicators = indicators; this.pricePublisher = pricePublisher;
    }

    // ── Market Overview ──

    @GetMapping("/market/overview")
    Map<String, Object> marketOverview() {
        List<Stock> all = stocks.findAll();
        List<Stock> gainers = all.stream()
                .sorted((a, b) -> b.changePercent.compareTo(a.changePercent))
                .limit(5).collect(Collectors.toList());
        List<Stock> losers = all.stream()
                .sorted((a, b) -> a.changePercent.compareTo(b.changePercent))
                .limit(5).collect(Collectors.toList());
        BigDecimal totalVolume = all.stream().map(s -> BigDecimal.valueOf(s.volume)).reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> result = new HashMap<>();
        List<MarketIndex> idxList = indices.findAll();
        result.put("indices", idxList.stream().map(i -> {
            Map<String, Object> m = new HashMap<>();
            m.put("name", i.name);
            m.put("symbol", i.symbol);
            m.put("value", i.value);
            m.put("change", i.change);
            m.put("changePercent", i.changePercent);
            return m;
        }).collect(Collectors.toList()));
        result.put("totalStocks", all.size());
        result.put("totalVolume", totalVolume);
        result.put("advancers", all.stream().filter(s -> s.changePercent != null && s.changePercent.compareTo(BigDecimal.ZERO) > 0).count());
        result.put("decliners", all.stream().filter(s -> s.changePercent != null && s.changePercent.compareTo(BigDecimal.ZERO) < 0).count());
        result.put("topGainers", gainers.stream().map(this::stockToBrief).collect(Collectors.toList()));
        result.put("topLosers", losers.stream().map(this::stockToBrief).collect(Collectors.toList()));
        return result;
    }

    // ── Stocks ──

    @GetMapping("/stocks")
    List<Map<String, Object>> listStocks() {
        return stocks.findAll().stream().map(this::stockToBrief).collect(Collectors.toList());
    }

    @GetMapping("/stocks/search")
    List<Map<String, Object>> searchStocks(@RequestParam String q) {
        return stocks.findByNameContainingIgnoreCaseOrSymbolContainingIgnoreCase(q, q)
                .stream().map(this::stockToBrief).collect(Collectors.toList());
    }

    @GetMapping("/stocks/{id}")
    Map<String, Object> stockDetail(@PathVariable Long id) {
        Stock stock = stocks.findById(id).orElseThrow(() -> new NoSuchElementException("Stock not found"));
        List<StockPrice> priceHistory = prices.findByStockIdOrderByTimestampAsc(id);
        Map<String, Object> detail = new LinkedHashMap<>(stockToBrief(stock));
        detail.put("sector", stock.sector);
        detail.put("marketCap", stock.marketCap);
        detail.put("volume", stock.volume);
        detail.put("priceHistory", priceHistory.stream().map(this::candleToMap).collect(Collectors.toList()));
        return detail;
    }

    @GetMapping("/stocks/{id}/indicators")
    Map<String, Object> stockIndicators(@PathVariable Long id) {
        Stock stock = stocks.findById(id).orElseThrow(() -> new NoSuchElementException("Stock not found"));
        List<StockPrice> priceHistory = prices.findByStockIdOrderByTimestampAsc(id);
        if (priceHistory.isEmpty()) return Map.of();
        return indicators.computeAll(priceHistory);
    }

    @GetMapping("/stocks/{id}/orderbook")
    Map<String, Object> orderBook(@PathVariable Long id) {
        Stock stock = stocks.findById(id).orElseThrow(() -> new NoSuchElementException("Stock not found"));
        BigDecimal price = stock.currentPrice;
        java.util.concurrent.ThreadLocalRandom rand = java.util.concurrent.ThreadLocalRandom.current();

        List<Map<String, Object>> bids = new ArrayList<>();
        List<Map<String, Object>> asks = new ArrayList<>();

        // Simulate 10 levels of bids and asks around current price
        for (int i = 1; i <= 10; i++) {
            BigDecimal bidPrice = price.subtract(BigDecimal.valueOf(i * rand.nextDouble(0.02, 0.15)))
                    .setScale(2, RoundingMode.HALF_UP);
            BigDecimal askPrice = price.add(BigDecimal.valueOf(i * rand.nextDouble(0.02, 0.15)))
                    .setScale(2, RoundingMode.HALF_UP);
            int bidSize = rand.nextInt(100, 5000);
            int askSize = rand.nextInt(100, 5000);

            Map<String, Object> bid = new HashMap<>();
            bid.put("price", bidPrice);
            bid.put("size", bidSize);
            bid.put("total", bidPrice.multiply(BigDecimal.valueOf(bidSize)).setScale(0, RoundingMode.HALF_UP));
            bids.add(bid);

            Map<String, Object> ask = new HashMap<>();
            ask.put("price", askPrice);
            ask.put("size", askSize);
            ask.put("total", askPrice.multiply(BigDecimal.valueOf(askSize)).setScale(0, RoundingMode.HALF_UP));
            asks.add(ask);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("symbol", stock.symbol);
        result.put("currentPrice", price);
        result.put("bidAskSpread", asks.get(0).get("price").toString() + " - " + bids.get(0).get("price").toString());
        result.put("bids", bids);
        result.put("asks", asks);
        return result;
    }

    @GetMapping("/stocks/compare")
    List<Map<String, Object>> compareStocks(@RequestParam String ids) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (String idStr : ids.split(",")) {
            try {
                Long id = Long.parseLong(idStr.trim());
                Stock stock = stocks.findById(id).orElse(null);
                if (stock != null) {
                    List<StockPrice> priceHistory = prices.findByStockIdOrderByTimestampAsc(id);
                    Map<String, Object> detail = new LinkedHashMap<>(stockToBrief(stock));
                    detail.put("priceHistory", priceHistory.stream().map(this::candleToMap).collect(Collectors.toList()));
                    detail.put("high52w", priceHistory.stream().map(p -> p.high).max(BigDecimal::compareTo).orElse(BigDecimal.ZERO));
                    detail.put("low52w", priceHistory.stream().map(p -> p.low).min(BigDecimal::compareTo).orElse(BigDecimal.ZERO));
                    result.add(detail);
                }
            } catch (NumberFormatException ignored) {}
        }
        return result;
    }

    @GetMapping("/stocks/{id}/prices")
    List<Map<String, Object>> stockPrices(@PathVariable Long id, @RequestParam(required = false) String range) {
        long since;
        if ("1W".equals(range)) since = System.currentTimeMillis() - 7L * 86400000L;
        else if ("1M".equals(range)) since = System.currentTimeMillis() - 30L * 86400000L;
        else if ("3M".equals(range)) since = System.currentTimeMillis() - 90L * 86400000L;
        else if ("1Y".equals(range)) since = System.currentTimeMillis() - 365L * 86400000L;
        else since = 0;
        return prices.findByStockIdAndTimestampAfter(id, since)
                .stream().map(this::candleToMap).collect(Collectors.toList());
    }

    // ── Portfolio ──

    @GetMapping("/portfolio")
    Map<String, Object> getPortfolio(@AuthenticationPrincipal User user) {
        Portfolio portfolio = portfolios.findByUserId(user.id)
                .orElseGet(() -> portfolios.save(new Portfolio(user, "Main Account", new BigDecimal("100000.00"))));
        List<PortfolioHolding> holdingEntities = holdings.findByPortfolioId(portfolio.id);
        List<Trade> recentTrades = trades.findByPortfolioIdOrderByTimestampDesc(portfolio.id)
                .stream().limit(20).collect(Collectors.toList());

        BigDecimal totalValue = portfolio.cashBalance;
        BigDecimal totalPL = BigDecimal.ZERO;
        List<Map<String, Object>> holdingList = new ArrayList<>();
        for (PortfolioHolding h : holdingEntities) {
            BigDecimal currentPrice = h.stock.currentPrice;
            BigDecimal marketValue = currentPrice.multiply(BigDecimal.valueOf(h.shares));
            BigDecimal costBasis = h.averagePrice.multiply(BigDecimal.valueOf(h.shares));
            BigDecimal pl = marketValue.subtract(costBasis);
            BigDecimal plPercent = costBasis.compareTo(BigDecimal.ZERO) > 0
                    ? pl.divide(costBasis, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            totalValue = totalValue.add(marketValue);
            totalPL = totalPL.add(pl);

            Map<String, Object> holdingMap = new HashMap<>();
            holdingMap.put("stockId", h.stock.id);
            holdingMap.put("symbol", h.stock.symbol);
            holdingMap.put("name", h.stock.name);
            holdingMap.put("shares", h.shares);
            holdingMap.put("avgPrice", h.averagePrice);
            holdingMap.put("currentPrice", currentPrice);
            holdingMap.put("marketValue", marketValue.setScale(2, RoundingMode.HALF_UP));
            holdingMap.put("pl", pl.setScale(2, RoundingMode.HALF_UP));
            holdingMap.put("plPercent", plPercent);
            holdingList.add(holdingMap);
        }

        // Calculate portfolio allocation percentages
        BigDecimal finalTotalValue = totalValue;
        holdingList.forEach(h -> {
            BigDecimal mv = (BigDecimal) h.get("marketValue");
            BigDecimal pct = finalTotalValue.compareTo(BigDecimal.ZERO) > 0
                    ? mv.divide(finalTotalValue, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).setScale(1, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            h.put("allocation", pct);
        });

        BigDecimal totalReturnPct = portfolio.cashBalance.compareTo(BigDecimal.ZERO) > 0
                ? totalPL.divide(new BigDecimal("100000.00"), 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        Map<String, Object> portfolioResult = new HashMap<>();
        portfolioResult.put("cashBalance", portfolio.cashBalance);
        portfolioResult.put("totalValue", totalValue.setScale(2, RoundingMode.HALF_UP));
        portfolioResult.put("totalPL", totalPL.setScale(2, RoundingMode.HALF_UP));
        portfolioResult.put("totalReturnPercent", totalReturnPct);
        portfolioResult.put("holdings", holdingList);
        portfolioResult.put("recentTrades", recentTrades.stream().map(t -> {
            Map<String, Object> tradeMap = new HashMap<>();
            tradeMap.put("id", t.id);
            tradeMap.put("symbol", t.stock.symbol);
            tradeMap.put("type", t.type);
            tradeMap.put("shares", t.shares);
            tradeMap.put("price", t.price);
            tradeMap.put("timestamp", t.timestamp);
            return tradeMap;
        }).collect(Collectors.toList()));
        return portfolioResult;
    }

    @PostMapping("/trade")
    @ResponseStatus(HttpStatus.CREATED)
    Map<String, Object> executeTrade(@AuthenticationPrincipal User user, @RequestBody TradeInput input) {
        Portfolio portfolio = portfolios.findByUserId(user.id)
                .orElseGet(() -> portfolios.save(new Portfolio(user, "Main Account", new BigDecimal("100000.00"))));
        Stock stock = stocks.findById(input.stockId)
                .orElseThrow(() -> new NoSuchElementException("Stock not found"));

        BigDecimal cost = stock.currentPrice.multiply(BigDecimal.valueOf(input.shares));

        if (input.type == TradeType.BUY) {
            if (portfolio.cashBalance.compareTo(cost) < 0) {
                throw new IllegalArgumentException("Insufficient funds");
            }
            portfolio.cashBalance = portfolio.cashBalance.subtract(cost);
            portfolios.save(portfolio);

            Optional<PortfolioHolding> existing = holdings.findByPortfolioIdAndStockId(portfolio.id, stock.id);
            if (existing.isPresent()) {
                PortfolioHolding h = existing.get();
                int totalShares = h.shares + input.shares;
                BigDecimal totalCost = h.averagePrice.multiply(BigDecimal.valueOf(h.shares)).add(cost);
                h.averagePrice = totalCost.divide(BigDecimal.valueOf(totalShares), 2, RoundingMode.HALF_UP);
                h.shares = totalShares;
                holdings.save(h);
            } else {
                holdings.save(new PortfolioHolding(portfolio, stock, input.shares, stock.currentPrice));
            }
        } else {
            Optional<PortfolioHolding> existing = holdings.findByPortfolioIdAndStockId(portfolio.id, stock.id);
            if (existing.isEmpty() || existing.get().shares < input.shares) {
                throw new IllegalArgumentException("Insufficient shares");
            }
            PortfolioHolding h = existing.get();
            h.shares -= input.shares;
            portfolio.cashBalance = portfolio.cashBalance.add(cost);
            portfolios.save(portfolio);
            if (h.shares == 0) holdings.delete(h);
            else holdings.save(h);
        }

        Trade trade = trades.save(new Trade(portfolio, stock, input.type, input.shares, stock.currentPrice));
        return Map.of("success", true, "tradeId", trade.id, "message",
            (input.type == TradeType.BUY ? "Bought" : "Sold") + " " + input.shares + " shares of " + stock.symbol);
    }

    // ── News ──

    @GetMapping("/news")
    List<Map<String, Object>> getNews(@RequestParam(required = false) String symbol) {
        List<NewsItem> items;
        if (symbol != null && !symbol.isEmpty()) {
            items = news.findByRelatedSymbolOrderByTimestampDesc(symbol);
        } else {
            items = news.findTop15ByOrderByTimestampDesc();
        }
        return items.stream().map(n -> {
            Map<String, Object> newsMap = new HashMap<>();
            newsMap.put("id", n.id);
            newsMap.put("headline", n.headline);
            newsMap.put("source", n.source);
            newsMap.put("sentiment", n.sentiment);
            newsMap.put("summary", n.summary);
            newsMap.put("symbol", n.relatedSymbol != null ? n.relatedSymbol : "");
            newsMap.put("timestamp", n.timestamp);
            return newsMap;
        }).collect(Collectors.toList());
    }

    // ── WebSocket control ──

    @PostMapping("/ws/start")
    Map<String, Object> startWebSocket() {
        pricePublisher.setRunning(true);
        return Map.of("success", true, "mode", "websocket", "message", "Real-time streaming started");
    }

    @PostMapping("/ws/stop")
    Map<String, Object> stopWebSocket() {
        pricePublisher.setRunning(false);
        return Map.of("success", true, "mode", "paused", "message", "Real-time streaming stopped");
    }

    @GetMapping("/ws/status")
    Map<String, Object> wsStatus() {
        return Map.of("streaming", pricePublisher.isRunning());
    }

    // ── Simulate price update (fallback, kept for backward compatibility) ──

    @PostMapping("/simulate/tick")
    Map<String, Object> simulateTick() {
        List<Stock> allStocks = stocks.findAll();
        for (Stock stock : allStocks) {
            StockPrice latest = prices.findTop1ByStockIdOrderByTimestampDesc(stock.id).orElse(null);
            BigDecimal lastClose = latest != null ? latest.close : stock.currentPrice;
            StockPrice newCandle = simulator.generateNextCandle(stock, lastClose);
            simulator.updateStockPrice(stock, newCandle);
            stocks.save(stock);
            prices.save(newCandle);
        }

        // Update indices based on stock movements
        updateIndices();

        return Map.of("success", true, "timestamp", System.currentTimeMillis());
    }

    // ── Helpers ──

    private Map<String, Object> stockToBrief(Stock s) {
        return Map.of(
            "id", s.id,
            "symbol", s.symbol,
            "name", s.name,
            "currentPrice", s.currentPrice,
            "changePercent", s.changePercent != null ? s.changePercent : BigDecimal.ZERO,
            "marketCap", s.marketCap
        );
    }

    private Map<String, Object> candleToMap(StockPrice p) {
        Map<String, Object> m = new HashMap<>();
        m.put("timestamp", p.timestamp);
        m.put("open", p.open);
        m.put("high", p.high);
        m.put("low", p.low);
        m.put("close", p.close);
        m.put("volume", p.volume);
        return m;
    }

    private void updateIndices() {
        List<Stock> all = stocks.findAll();
        List<MarketIndex> indexList = indices.findAll();
        for (MarketIndex index : indexList) {
            if ("SENSEX".equals(index.symbol)) {
                BigDecimal avgChange = all.stream()
                        .map(s -> s.changePercent != null ? s.changePercent : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                        .divide(BigDecimal.valueOf(all.size()), 2, RoundingMode.HALF_UP);
                BigDecimal move = index.value.multiply(avgChange).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                index.value = index.value.add(move);
                index.change = move;
                index.changePercent = avgChange;
                indices.save(index);
            } else if ("NIFTY".equals(index.symbol)) {
                BigDecimal avgChange = all.stream()
                        .map(s -> s.changePercent != null ? s.changePercent : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                        .divide(BigDecimal.valueOf(all.size()), 2, RoundingMode.HALF_UP);
                BigDecimal move = index.value.multiply(avgChange).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                index.value = index.value.add(move);
                index.change = move;
                index.changePercent = avgChange;
                indices.save(index);
            }
        }
    }

    record TradeInput(Long stockId, TradeType type, int shares) {}
}
