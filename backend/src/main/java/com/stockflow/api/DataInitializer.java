package com.stockflow.api;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Configuration
class DataInitializer {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private static final List<StockDef> STOCK_DEFS = List.of(
        new StockDef("AAPL", "Apple Inc.", "Technology", 178.72, 2780000000000L),
        new StockDef("GOOGL", "Alphabet Inc.", "Technology", 141.80, 1780000000000L),
        new StockDef("MSFT", "Microsoft Corporation", "Technology", 378.91, 2820000000000L),
        new StockDef("AMZN", "Amazon.com Inc.", "Consumer Cyclical", 178.25, 1850000000000L),
        new StockDef("TSLA", "Tesla Inc.", "Automotive", 248.48, 790000000000L),
        new StockDef("NVDA", "NVIDIA Corporation", "Technology", 682.23, 1680000000000L),
        new StockDef("META", "Meta Platforms Inc.", "Technology", 474.11, 1210000000000L),
        new StockDef("JPM", "JPMorgan Chase & Co.", "Financial", 183.27, 528000000000L),
        new StockDef("V", "Visa Inc.", "Financial", 275.46, 565000000000L),
        new StockDef("JNJ", "Johnson & Johnson", "Healthcare", 156.81, 378000000000L),
        new StockDef("WMT", "Walmart Inc.", "Consumer Defensive", 165.31, 445000000000L),
        new StockDef("PG", "Procter & Gamble Co.", "Consumer Defensive", 158.94, 375000000000L),
        new StockDef("MA", "Mastercard Inc.", "Financial", 451.23, 420000000000L),
        new StockDef("UNH", "UnitedHealth Group Inc.", "Healthcare", 527.34, 487000000000L),
        new StockDef("HD", "The Home Depot Inc.", "Consumer Cyclical", 345.67, 343000000000L)
    );

    @Bean
    CommandLineRunner seedData(StockRepository stocks, StockPriceRepository prices,
                               MarketIndexRepository indices, NewsItemRepository news,
                               PortfolioRepository portfolios, PortfolioHoldingRepository holdings,
                               TradeRepository trades, PriceSimulator simulator,
                               FinnhubService finnhub, UserRepository users,
                               PasswordEncoder passwordEncoder) {
        return args -> {
            if (stocks.count() > 0) return;

            boolean useFinnhub = finnhub.isEnabled();
            log.info("Seeding data (Finnhub: {})...", useFinnhub ? "ENABLED" : "DISABLED");

            // ── Create Demo Users ──
            User demo = users.save(new User("demo", passwordEncoder.encode("demo123"), "Alex Kumar"));
            User alice = users.save(new User("alice", passwordEncoder.encode("alice123"), "Alice Chen"));
            User bob = users.save(new User("bob", passwordEncoder.encode("bob123"), "Bob Smith"));
            log.info("Created users: demo/demo123, alice/alice123, bob/bob123");

            // ── Create Stocks ──
            List<Stock> stockEntities = STOCK_DEFS.stream().map(def -> {
                Stock stock = new Stock(def.symbol, def.name, def.sector,
                        BigDecimal.valueOf(def.price), BigDecimal.valueOf(def.marketCap));
                if (useFinnhub) {
                    try { finnhub.updateStockWithRealData(stock); }
                    catch (Exception e) { log.warn("Finnhub update failed for {}", def.symbol); }
                }
                return stocks.save(stock);
            }).toList();

            // ── Generate Price History ──
            stockEntities.forEach(stock -> {
                List<StockPrice> candles = finnhub.getOrGenerateCandles(stock, 365);
                prices.saveAll(candles);
                if (!candles.isEmpty()) {
                    StockPrice last = candles.get(candles.size() - 1);
                    simulator.updateStockPrice(stock, last);
                    stocks.save(stock);
                }
            });

            // ── Market Indices ──
            indices.save(new MarketIndex("S&P 500", "SPX", new BigDecimal("5130.45"), new BigDecimal("12.78"), new BigDecimal("0.25")));
            indices.save(new MarketIndex("NASDAQ", "IXIC", new BigDecimal("16274.94"), new BigDecimal("89.52"), new BigDecimal("0.55")));
            indices.save(new MarketIndex("Dow Jones", "DJI", new BigDecimal("38796.38"), new BigDecimal("-65.82"), new BigDecimal("-0.17")));
            indices.save(new MarketIndex("SENSEX", "SENSEX", new BigDecimal("72831.94"), new BigDecimal("352.61"), new BigDecimal("0.49")));
            indices.save(new MarketIndex("NIFTY 50", "NIFTY", new BigDecimal("22112.45"), new BigDecimal("108.75"), new BigDecimal("0.49")));

            // ── News ──
            seedNews(news);

            // ── Portfolio for Demo user ──
            Portfolio portfolio = portfolios.save(new Portfolio(demo, "Main Account", new BigDecimal("100000.00")));

            Stock aapl = stockEntities.stream().filter(s -> "AAPL".equals(s.symbol)).findFirst().orElse(null);
            Stock msft = stockEntities.stream().filter(s -> "MSFT".equals(s.symbol)).findFirst().orElse(null);
            Stock nvda = stockEntities.stream().filter(s -> "NVDA".equals(s.symbol)).findFirst().orElse(null);

            if (aapl != null) {
                holdings.save(new PortfolioHolding(portfolio, aapl, 50, aapl.currentPrice));
                trades.save(new Trade(portfolio, aapl, TradeType.BUY, 50, aapl.currentPrice));
            }
            if (msft != null) {
                holdings.save(new PortfolioHolding(portfolio, msft, 20, msft.currentPrice));
                trades.save(new Trade(portfolio, msft, TradeType.BUY, 20, msft.currentPrice));
            }
            if (nvda != null) {
                holdings.save(new PortfolioHolding(portfolio, nvda, 15, nvda.currentPrice));
                trades.save(new Trade(portfolio, nvda, TradeType.BUY, 15, nvda.currentPrice));
            }

            // Portfolios for Alice and Bob (empty, just cash)
            portfolios.save(new Portfolio(alice, "Main Account", new BigDecimal("100000.00")));
            portfolios.save(new Portfolio(bob, "Main Account", new BigDecimal("100000.00")));

            log.info("Data seeding complete — {} stocks, 3 users", stockEntities.size());
        };
    }

    private void seedNews(NewsItemRepository news) {
        news.save(new NewsItem("Apple announces record Q2 revenue", "Bloomberg", "positive", "Apple reported quarterly revenue of $94.8 billion.", "AAPL"));
        news.save(new NewsItem("NVIDIA unveils next-gen AI chip architecture", "Reuters", "positive", "NVIDIA's new Blackwell platform promises 4x training performance.", "NVDA"));
        news.save(new NewsItem("Tesla deliveries miss estimates", "Financial Times", "negative", "Tesla delivered 386,810 vehicles in Q1.", "TSLA"));
        news.save(new NewsItem("Microsoft Azure cloud revenue grows 31%", "CNBC", "positive", "Microsoft's Intelligent Cloud segment generated $26.7 billion.", "MSFT"));
        news.save(new NewsItem("Fed holds rates steady, signals potential cuts", "Wall Street Journal", "neutral", "The Fed maintained rates at 5.25%-5.50%.", ""));
        news.save(new NewsItem("Amazon expands same-day delivery to 50 cities", "TechCrunch", "positive", "Amazon's network now reaches 95% of US households.", "AMZN"));
        news.save(new NewsItem("Meta posts $3.8B quarterly loss in Reality Labs", "The Verge", "negative", "Despite losses, Meta's overall revenue grew 27%.", "META"));
        news.save(new NewsItem("JPMorgan reports record $13.4B profit", "Bloomberg", "positive", "Higher interest rates drove record quarterly earnings.", "JPM"));
    }

    private record StockDef(String symbol, String name, String sector, double price, long marketCap) {}
}
