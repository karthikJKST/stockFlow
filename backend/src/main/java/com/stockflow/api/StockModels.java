package com.stockflow.api;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;

@Entity @Table(name = "stocks")
class Stock {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) Long id;
    @Column(nullable = false, unique = true) String symbol;
    @Column(nullable = false) String name;
    String sector;
    @Column(precision = 14, scale = 2) BigDecimal currentPrice;
    @Column(precision = 14, scale = 2) BigDecimal previousClose;
    @Column(precision = 8, scale = 2) BigDecimal changePercent;
    @Column(precision = 18, scale = 2) BigDecimal marketCap;
    long volume;
    String logoUrl;

    Stock() {}
    Stock(String symbol, String name, String sector, BigDecimal price, BigDecimal marketCap) {
        this.symbol = symbol; this.name = name; this.sector = sector;
        this.currentPrice = price; this.previousClose = price;
        this.changePercent = BigDecimal.ZERO; this.marketCap = marketCap;
        this.volume = 0;
    }
}

@Entity @Table(name = "stock_prices")
class StockPrice {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) Long id;
    @ManyToOne(optional = false) Stock stock;
    long timestamp;
    @Column(precision = 14, scale = 2) BigDecimal open;
    @Column(precision = 14, scale = 2) BigDecimal high;
    @Column(precision = 14, scale = 2) BigDecimal low;
    @Column(precision = 14, scale = 2) BigDecimal close;
    long volume;

    StockPrice() {}
    StockPrice(Stock stock, long timestamp, BigDecimal open, BigDecimal high, BigDecimal low, BigDecimal close, long volume) {
        this.stock = stock; this.timestamp = timestamp;
        this.open = open; this.high = high; this.low = low; this.close = close; this.volume = volume;
    }
}

@Entity @Table(name = "market_indices")
class MarketIndex {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) Long id;
    @Column(nullable = false) String name;
    @Column(nullable = false, unique = true) String symbol;
    @Column(name = "idx_value", precision = 14, scale = 2) BigDecimal value;
    @Column(name = "idx_change", precision = 8, scale = 2) BigDecimal change;
    @Column(name = "idx_change_pct", precision = 8, scale = 2) BigDecimal changePercent;

    MarketIndex() {}
    MarketIndex(String name, String symbol, BigDecimal value, BigDecimal change, BigDecimal changePercent) {
        this.name = name; this.symbol = symbol; this.value = value;
        this.change = change; this.changePercent = changePercent;
    }
}

@Entity @Table(name = "news_items")
class NewsItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) Long id;
    String headline;
    String source;
    String sentiment;
    @Column(length = 4000) String summary;
    String relatedSymbol;
    long timestamp = Instant.now().toEpochMilli();

    NewsItem() {}
    NewsItem(String headline, String source, String sentiment, String summary, String symbol) {
        this.headline = headline; this.source = source; this.sentiment = sentiment;
        this.summary = summary; this.relatedSymbol = symbol;
    }
}

@Entity @Table(name = "portfolios")
class Portfolio {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) Long id;
    @ManyToOne(optional = false) User user;
    @Column(nullable = false) String name = "Main Account";
    @Column(precision = 16, scale = 2) BigDecimal cashBalance = new BigDecimal("100000.00");

    Portfolio() {}
    Portfolio(User user, String name, BigDecimal cash) { this.user = user; this.name = name; this.cashBalance = cash; }
}

@Entity @Table(name = "portfolio_holdings")
class PortfolioHolding {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) Long id;
    @ManyToOne Portfolio portfolio;
    @ManyToOne Stock stock;
    int shares;
    @Column(precision = 14, scale = 2) BigDecimal averagePrice;

    PortfolioHolding() {}
    PortfolioHolding(Portfolio portfolio, Stock stock, int shares, BigDecimal avgPrice) {
        this.portfolio = portfolio; this.stock = stock;
        this.shares = shares; this.averagePrice = avgPrice;
    }
}

@Entity @Table(name = "trades")
class Trade {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) Long id;
    @ManyToOne Portfolio portfolio;
    @ManyToOne Stock stock;
    @Enumerated(EnumType.STRING) TradeType type;
    int shares;
    @Column(precision = 14, scale = 2) BigDecimal price;
    long timestamp = Instant.now().toEpochMilli();

    Trade() {}
    Trade(Portfolio portfolio, Stock stock, TradeType type, int shares, BigDecimal price) {
        this.portfolio = portfolio; this.stock = stock;
        this.type = type; this.shares = shares; this.price = price;
    }
}

enum TradeType { BUY, SELL }
