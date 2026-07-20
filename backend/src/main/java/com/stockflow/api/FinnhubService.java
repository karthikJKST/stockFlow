package com.stockflow.api;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.util.*;

/**
 * Service that fetches real stock market data from Finnhub API.
 * Falls back gracefully to simulated data if the API key is not configured
 * or if the API is unavailable.
 */
@Service
class FinnhubService {

    private static final Logger log = LoggerFactory.getLogger(FinnhubService.class);
    private static final String BASE_URL = "https://finnhub.io/api/v1";

    private final RestTemplate rest;
    private final String apiKey;
    private final PriceSimulator simulator;
    private final boolean enabled;

    FinnhubService(@Value("${finnhub.api-key:}") String apiKey, PriceSimulator simulator) {
        this.apiKey = apiKey;
        this.simulator = simulator;
        this.enabled = apiKey != null && !apiKey.isBlank();
        this.rest = new RestTemplateBuilder()
                .rootUri(BASE_URL)
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofSeconds(10))
                .build();
        if (enabled) {
            log.info("Finnhub API integration ENABLED (key: {}...{})",
                    apiKey.substring(0, 4), apiKey.substring(apiKey.length() - 4));
        } else {
            log.info("Finnhub API integration DISABLED — set FINNHUB_API_KEY env var or finnhub.api-key property. Using simulated data.");
        }
    }

    /**
     * Fetch real-time quote for a stock symbol.
     * Returns a map with: currentPrice, changePercent, high, low, open, previousClose, volume
     */
    Optional<Map<String, Object>> fetchQuote(String symbol) {
        if (!enabled) return Optional.empty();
        try {
            var response = rest.getForObject("/quote?symbol={symbol}&token={token}", Map.class, symbol, apiKey);
            if (response == null || response.get("c") == null) return Optional.empty();

            Map<String, Object> result = new HashMap<>();
            result.put("currentPrice", toBigDecimal(response.get("c")));   // Current price
            result.put("changePercent", toBigDecimal(response.get("dp"))); // Change percent
            result.put("high", toBigDecimal(response.get("h")));           // Day high
            result.put("low", toBigDecimal(response.get("l")));            // Day low
            result.put("open", toBigDecimal(response.get("o")));           // Day open
            result.put("previousClose", toBigDecimal(response.get("pc"))); // Previous close
            result.put("volume", toLong(response.get("v")));               // Volume
            return Optional.of(result);
        } catch (Exception e) {
            log.warn("Finnhub quote fetch failed for {}: {}", symbol, e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Fetch company profile (name, market cap, sector, logo)
     */
    Optional<Map<String, Object>> fetchCompanyProfile(String symbol) {
        if (!enabled) return Optional.empty();
        try {
            var response = rest.getForObject("/stock/profile2?symbol={symbol}&token={token}", Map.class, symbol, apiKey);
            if (response == null || response.get("name") == null) return Optional.empty();

            Map<String, Object> result = new HashMap<>();
            result.put("name", response.get("name"));
            result.put("sector", response.get("sector") != null ? response.get("sector") : "N/A");
            // Finnhub returns marketCap in millions; convert to raw dollars
            BigDecimal rawMarketCap = toBigDecimal(response.get("marketCapitalization"));
            result.put("marketCap", rawMarketCap.multiply(BigDecimal.valueOf(1_000_000)));
            result.put("logo", response.get("logo"));
            return Optional.of(result);
        } catch (Exception e) {
            log.warn("Finnhub profile fetch failed for {}: {}", symbol, e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Fetch historical candlestick data.
     * @param symbol Stock symbol
     * @param resolution 'D'=daily, '60'=60min, '30'=30min, '15'=15min, '5'=5min, '1'=1min
     * @param from unix timestamp (seconds)
     * @param to unix timestamp (seconds)
     */
    Optional<List<Map<String, Object>>> fetchCandles(String symbol, String resolution, long from, long to) {
        if (!enabled) return Optional.empty();
        try {
            var response = rest.getForObject(
                    "/stock/candle?symbol={symbol}&resolution={res}&from={from}&to={to}&token={token}",
                    Map.class, symbol, resolution, from, to, apiKey);
            if (response == null || response.get("s") == null || !"ok".equals(response.get("s"))) {
                return Optional.empty();
            }

            List<Number> timestamps = (List<Number>) response.get("t");
            List<Number> opens = (List<Number>) response.get("o");
            List<Number> highs = (List<Number>) response.get("h");
            List<Number> lows = (List<Number>) response.get("l");
            List<Number> closes = (List<Number>) response.get("c");
            List<Number> volumes = (List<Number>) response.get("v");

            if (timestamps == null || timestamps.isEmpty()) return Optional.empty();

            List<Map<String, Object>> candles = new ArrayList<>();
            for (int i = 0; i < timestamps.size(); i++) {
                Map<String, Object> candle = new HashMap<>();
                candle.put("timestamp", timestamps.get(i).longValue() * 1000L); // Convert to ms
                candle.put("open", toBigDecimal(opens.get(i)));
                candle.put("high", toBigDecimal(highs.get(i)));
                candle.put("low", toBigDecimal(lows.get(i)));
                candle.put("close", toBigDecimal(closes.get(i)));
                candle.put("volume", volumes.get(i).longValue());
                candles.add(candle);
            }
            return Optional.of(candles);
        } catch (Exception e) {
            log.warn("Finnhub candle fetch failed for {}: {}", symbol, e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Fetch market news for a specific symbol or general market news
     */
    Optional<List<Map<String, Object>>> fetchNews(String symbol, int limit) {
        if (!enabled) return Optional.empty();
        try {
            String endpoint = symbol != null && !symbol.isBlank()
                    ? "/company-news?symbol={symbol}&from={from}&to={to}&token={token}"
                    : "/news?category=general&token={token}";

            Map<String, Object> params = new HashMap<>();
            params.put("token", apiKey);
            if (symbol != null && !symbol.isBlank()) {
                params.put("symbol", symbol);
                // Last 7 days
                long to = System.currentTimeMillis() / 1000;
                long from = to - 7 * 86400;
                params.put("from", from);
                params.put("to", to);
            }

            var response = rest.getForObject(endpoint, List.class, params);
            if (response == null) return Optional.empty();

            List<Map<String, Object>> newsList = new ArrayList<>();
            for (int i = 0; i < Math.min(response.size(), limit); i++) {
                Map<String, Object> item = (Map<String, Object>) response.get(i);
                Map<String, Object> newsItem = new HashMap<>();
                newsItem.put("headline", item.get("headline"));
                newsItem.put("source", item.get("source"));
                newsItem.put("summary", item.get("summary"));
                newsItem.put("sentiment", classifySentiment(item.get("sentimentScore")));
                newsItem.put("symbol", item.get("related") != null ? item.get("related") : "");
                newsItem.put("timestamp", item.get("datetime") != null
                        ? ((Number) item.get("datetime")).longValue() * 1000L
                        : System.currentTimeMillis());
                newsList.add(newsItem);
            }
            return Optional.of(newsList);
        } catch (Exception e) {
            log.warn("Finnhub news fetch failed: {}", e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Update a stock entity with real-time data from Finnhub.
     * Returns true if the update was successful, false if fallback was used.
     */
    boolean updateStockWithRealData(Stock stock) {
        Optional<Map<String, Object>> quote = fetchQuote(stock.symbol);
        Optional<Map<String, Object>> profile = fetchCompanyProfile(stock.symbol);

        boolean updated = false;

        if (profile.isPresent()) {
            Map<String, Object> p = profile.get();
            if (p.get("name") != null) stock.name = (String) p.get("name");
            if (p.get("sector") != null) stock.sector = (String) p.get("sector");
            if (p.get("marketCap") != null) stock.marketCap = (BigDecimal) p.get("marketCap");
            updated = true;
        }

        if (quote.isPresent()) {
            Map<String, Object> q = quote.get();
            if (q.get("currentPrice") != null) {
                stock.previousClose = stock.currentPrice;
                stock.currentPrice = (BigDecimal) q.get("currentPrice");
            }
            if (q.get("changePercent") != null) stock.changePercent = (BigDecimal) q.get("changePercent");
            if (q.get("volume") != null) stock.volume = (Long) q.get("volume");
            updated = true;
        }

        return updated;
    }

    /**
     * Fetch or generate candles for a stock. Tries Finnhub first, falls back to simulation.
     */
    List<StockPrice> getOrGenerateCandles(Stock stock, int days) {
        // Try Finnhub daily candles (last N days)
        long to = System.currentTimeMillis() / 1000;
        long from = to - (long) days * 86400L;

        Optional<List<Map<String, Object>>> finnhubCandles = fetchCandles(stock.symbol, "D", from, to);

        if (finnhubCandles.isPresent() && !finnhubCandles.get().isEmpty()) {
            List<StockPrice> candles = new ArrayList<>();
            for (Map<String, Object> c : finnhubCandles.get()) {
                candles.add(new StockPrice(
                        stock,
                        (Long) c.get("timestamp"),
                        (BigDecimal) c.get("open"),
                        (BigDecimal) c.get("high"),
                        (BigDecimal) c.get("low"),
                        (BigDecimal) c.get("close"),
                        (Long) c.get("volume")
                ));
            }
            log.info("Fetched {} daily candles from Finnhub for {}", candles.size(), stock.symbol);
            return candles;
        }

        // Fallback: generate simulated intraday candles
        log.info("Falling back to simulated candles for {}", stock.symbol);
        return simulator.generateHistoricalCandles(stock, days, stock.currentPrice);
    }

    boolean isEnabled() { return enabled; }

    // ── Helpers ──

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal) return (BigDecimal) value;
        if (value instanceof Number) return BigDecimal.valueOf(((Number) value).doubleValue())
                .setScale(2, RoundingMode.HALF_UP);
        try { return new BigDecimal(value.toString()).setScale(2, RoundingMode.HALF_UP); }
        catch (Exception e) { return BigDecimal.ZERO; }
    }

    private long toLong(Object value) {
        if (value == null) return 0;
        if (value instanceof Number) return ((Number) value).longValue();
        try { return Long.parseLong(value.toString()); }
        catch (Exception e) { return 0; }
    }

    private String classifySentiment(Object score) {
        if (score == null) return "neutral";
        double val;
        if (score instanceof Number) val = ((Number) score).doubleValue();
        else try { val = Double.parseDouble(score.toString()); } catch (Exception e) { return "neutral"; }
        if (val > 0.2) return "positive";
        if (val < -0.2) return "negative";
        return "neutral";
    }
}
