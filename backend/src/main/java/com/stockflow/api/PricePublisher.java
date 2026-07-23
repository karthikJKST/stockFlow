package com.stockflow.api;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

/**
 * Pushes live stock prices and market data to WebSocket clients every 3 seconds.
 * Uses real Finnhub market data when available, falls back to simulation gracefully.
 */
@Service
@EnableScheduling
class PricePublisher {

    private static final Logger log = LoggerFactory.getLogger(PricePublisher.class);

    private static final int FINNHUB_STOCKS_PER_TICK = 3;
    private static final int MAX_CONSECUTIVE_FAILURES = 5;

    @Autowired private SimpMessagingTemplate messaging;
    @Autowired private StockRepository stocks;
    @Autowired private StockPriceRepository prices;
    @Autowired private MarketIndexRepository indices;
    @Autowired private PriceSimulator simulator;
    @Autowired private FinnhubService finnhub;

    private boolean running = false;

    /** Rotating index for Finnhub stock subset updates (avoids rate limit) */
    private int stockIndex = 0;
    private int consecutiveFinnhubFailures = 0;
    private boolean finnhubWarned = false;
    private long finnhubBackoffUntil = 0;

    /** Start/stop control called from the frontend */
    void setRunning(boolean r) { this.running = r; }
    boolean isRunning() { return running; }

    /**
     * Every 3 seconds: update stock prices using Finnhub (if available) or simulation.
     * Pushes the updated snapshot to all connected WebSocket clients.
     */
    @Scheduled(fixedRate = 3000)
    void publishPriceUpdates() {
        if (!running) return;

        try {
            List<Stock> allStocks = stocks.findAll();
            if (allStocks.isEmpty()) return;

            String dataSource = updateStockPrices(allStocks);

            updateIndices(allStocks);

            Map<String, Object> snapshot = buildSnapshot(allStocks);
            snapshot.put("dataSource", dataSource);

            messaging.convertAndSend("/topic/prices", snapshot);

        } catch (Exception e) {
            log.error("Error pushing price update: {}", e.getMessage());
        }
    }

    /**
     * Updates stock prices using the best available data source.
     * Returns the data source label for the frontend.
     */
    private String updateStockPrices(List<Stock> allStocks) {
        boolean finnhubAvailable = finnhub.isEnabled()
                && System.currentTimeMillis() >= finnhubBackoffUntil;

        if (finnhubAvailable && consecutiveFinnhubFailures >= MAX_CONSECUTIVE_FAILURES) {
            // Backoff expired — reset and try again
            log.info("Finnhub backoff expired, retrying...");
            consecutiveFinnhubFailures = 0;
            finnhubWarned = false;
        }

        if (!finnhubAvailable) {
            boolean backoffActive = System.currentTimeMillis() < finnhubBackoffUntil;
            if (backoffActive && !finnhubWarned) {
                log.warn("Finnhub rate limit backoff active — using simulated data");
                finnhubWarned = true;
            }
            simulateAllStocks(allStocks);
            if (consecutiveFinnhubFailures >= MAX_CONSECUTIVE_FAILURES) return "rate_limited";
            if (!finnhub.isEnabled()) return "simulated";
            return "simulated_fallback";
        }

        // Update a rotating subset from Finnhub, simulate the rest
        int updated = 0;
        int failures = 0;
        int total = allStocks.size();

        for (int i = 0; i < total && updated < FINNHUB_STOCKS_PER_TICK; i++) {
            int idx = (stockIndex + i) % total;
            Stock stock = allStocks.get(idx);

            boolean success = finnhub.updateStockWithRealData(stock);
            if (success) {
                generateCandleFromPrice(stock);
                stocks.save(stock);
                updated++;
            } else {
                failures++;
                simulateSingleStock(stock);
            }
        }

        // Simulate remaining stocks not updated this tick
        for (int i = FINNHUB_STOCKS_PER_TICK; i < total; i++) {
            int idx = (stockIndex + i) % total;
            simulateSingleStock(allStocks.get(idx));
        }

        stockIndex = (stockIndex + FINNHUB_STOCKS_PER_TICK) % total;

        if (updated == 0 && failures > 0) {
            consecutiveFinnhubFailures++;
            if (consecutiveFinnhubFailures >= MAX_CONSECUTIVE_FAILURES) {
                finnhubBackoffUntil = System.currentTimeMillis() + 60_000;
                log.warn("Finnhub consecutive failures={}, backing off for 60s", consecutiveFinnhubFailures);
                return "rate_limited";
            }
        } else if (updated > 0) {
            consecutiveFinnhubFailures = Math.max(0, consecutiveFinnhubFailures - 1);
        }

        return "live";
    }

    /** Simulate all stocks in the list */
    private void simulateAllStocks(List<Stock> allStocks) {
        for (Stock stock : allStocks) {
            simulateSingleStock(stock);
        }
    }

    /** Simulate a single stock price update */
    private void simulateSingleStock(Stock stock) {
        StockPrice latest = prices.findTop1ByStockIdOrderByTimestampDesc(stock.id).orElse(null);
        BigDecimal lastClose = latest != null ? latest.close : stock.currentPrice;
        StockPrice newCandle = simulator.generateNextCandle(stock, lastClose);
        simulator.updateStockPrice(stock, newCandle);
        stocks.save(stock);
        prices.save(newCandle);
    }

    /** Generate a candle from the stock's current price (used after Finnhub update) */
    private void generateCandleFromPrice(Stock stock) {
        StockPrice latest = prices.findTop1ByStockIdOrderByTimestampDesc(stock.id).orElse(null);
        BigDecimal previousClose = latest != null ? latest.close : stock.currentPrice;
        ThreadLocalRandom rand = ThreadLocalRandom.current();
        BigDecimal open = previousClose;
        BigDecimal close = stock.currentPrice;
        BigDecimal high = open.max(close).multiply(BigDecimal.valueOf(1 + Math.abs(rand.nextGaussian() * 0.002)))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal low = open.min(close).multiply(BigDecimal.valueOf(1 - Math.abs(rand.nextGaussian() * 0.002)))
                .setScale(2, RoundingMode.HALF_UP);
        long volume = stock.volume > 0 ? stock.volume : (long) (rand.nextInt(100_000, 5_000_000));
        StockPrice candle = new StockPrice(stock, System.currentTimeMillis(), open, high, low, close, volume);
        prices.save(candle);
    }

    /** Build the full market snapshot for WebSocket push */
    private Map<String, Object> buildSnapshot(List<Stock> allStocks) {
        List<Stock> gainers = allStocks.stream()
                .sorted((a, b) -> b.changePercent.compareTo(a.changePercent))
                .limit(5).collect(Collectors.toList());
        List<Stock> losers = allStocks.stream()
                .sorted((a, b) -> a.changePercent.compareTo(b.changePercent))
                .limit(5).collect(Collectors.toList());
        BigDecimal totalVolume = BigDecimal.ZERO;
        for (Stock s : allStocks) {
            totalVolume = totalVolume.add(BigDecimal.valueOf(s.volume));
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("timestamp", System.currentTimeMillis());
        payload.put("stocks", allStocks.stream().map(this::stockToBrief).collect(Collectors.toList()));
        payload.put("indices", indices.findAll().stream().map(i -> {
            Map<String, Object> m = new HashMap<>();
            m.put("name", i.name); m.put("symbol", i.symbol);
            m.put("value", i.value); m.put("change", i.change); m.put("changePercent", i.changePercent);
            return m;
        }).collect(Collectors.toList()));
        payload.put("totalVolume", totalVolume);
        payload.put("advancers", allStocks.stream().filter(s -> s.changePercent != null && s.changePercent.compareTo(BigDecimal.ZERO) > 0).count());
        payload.put("decliners", allStocks.stream().filter(s -> s.changePercent != null && s.changePercent.compareTo(BigDecimal.ZERO) < 0).count());
        payload.put("topGainers", gainers.stream().map(this::stockToBrief).collect(Collectors.toList()));
        payload.put("topLosers", losers.stream().map(this::stockToBrief).collect(Collectors.toList()));
        return payload;
    }

    private void updateIndices(List<Stock> all) {
        List<MarketIndex> idxList = indices.findAll();
        for (MarketIndex index : idxList) {
            BigDecimal sumChange = BigDecimal.ZERO;
            for (Stock s : all) {
                sumChange = sumChange.add(s.changePercent != null ? s.changePercent : BigDecimal.ZERO);
            }
            BigDecimal avgChange = sumChange.divide(BigDecimal.valueOf(all.size()), 2, java.math.RoundingMode.HALF_UP);
            BigDecimal move = index.value.multiply(avgChange).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
            index.value = index.value.add(move);
            index.change = move;
            index.changePercent = avgChange;
            indices.save(index);
        }
    }

    private Map<String, Object> stockToBrief(Stock s) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", s.id); m.put("symbol", s.symbol); m.put("name", s.name);
        m.put("currentPrice", s.currentPrice);
        m.put("changePercent", s.changePercent != null ? s.changePercent : BigDecimal.ZERO);
        m.put("marketCap", s.marketCap);
        return m;
    }
}
