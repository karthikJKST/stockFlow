package com.stockflow.api;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Pushes live stock prices and market data to WebSocket clients every 3 seconds.
 * This replaces the old 10-second polling approach.
 */
@Service
@EnableScheduling
class PricePublisher {

    private static final Logger log = LoggerFactory.getLogger(PricePublisher.class);

    @Autowired private SimpMessagingTemplate messaging;
    @Autowired private StockRepository stocks;
    @Autowired private StockPriceRepository prices;
    @Autowired private MarketIndexRepository indices;
    @Autowired private PriceSimulator simulator;

    private boolean running = false;

    /** Start/stop control called from the frontend */
    void setRunning(boolean r) { this.running = r; }
    boolean isRunning() { return running; }

    /**
     * Every 3 seconds: simulate price changes for all stocks
     * and push the updated snapshot to all connected WebSocket clients.
     */
    @Scheduled(fixedRate = 3000)
    void publishPriceUpdates() {
        if (!running) return;

        try {
            List<Stock> allStocks = stocks.findAll();

            // Simulate new candle for each stock
            for (Stock stock : allStocks) {
                StockPrice latest = prices.findTop1ByStockIdOrderByTimestampDesc(stock.id).orElse(null);
                BigDecimal lastClose = latest != null ? latest.close : stock.currentPrice;
                StockPrice newCandle = simulator.generateNextCandle(stock, lastClose);
                simulator.updateStockPrice(stock, newCandle);
                stocks.save(stock);
                prices.save(newCandle);
            }

            // Update market indices
            updateIndices(allStocks);

            // Build the price snapshot
            Map<String, Object> snapshot = buildSnapshot(allStocks);

            // Push to all subscribed clients
            messaging.convertAndSend("/topic/prices", snapshot);

        } catch (Exception e) {
            log.error("Error pushing price update: {}", e.getMessage());
        }
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
