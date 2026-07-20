package com.stockflow.api;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

interface StockRepository extends JpaRepository<Stock, Long> {
    Optional<Stock> findBySymbol(String symbol);
    List<Stock> findBySector(String sector);
    List<Stock> findTop10ByOrderByMarketCapDesc();
    List<Stock> findTop10ByOrderByChangePercentDesc();
    List<Stock> findTop10ByOrderByChangePercentAsc();
    List<Stock> findByNameContainingIgnoreCaseOrSymbolContainingIgnoreCase(String name, String symbol);
}

interface StockPriceRepository extends JpaRepository<StockPrice, Long> {
    List<StockPrice> findByStockIdOrderByTimestampAsc(Long stockId);
    Optional<StockPrice> findTop1ByStockIdOrderByTimestampDesc(Long stockId);
    @Query("SELECT sp FROM StockPrice sp WHERE sp.stock.id = :stockId AND sp.timestamp >= :since ORDER BY sp.timestamp ASC")
    List<StockPrice> findByStockIdAndTimestampAfter(@Param("stockId") Long stockId, @Param("since") long since);
}

interface MarketIndexRepository extends JpaRepository<MarketIndex, Long> {
    Optional<MarketIndex> findBySymbol(String symbol);
}

interface NewsItemRepository extends JpaRepository<NewsItem, Long> {
    List<NewsItem> findTop15ByOrderByTimestampDesc();
    List<NewsItem> findByRelatedSymbolOrderByTimestampDesc(String symbol);
}

interface PortfolioRepository extends JpaRepository<Portfolio, Long> {
    java.util.Optional<Portfolio> findByUserId(Long userId);
}

interface PortfolioHoldingRepository extends JpaRepository<PortfolioHolding, Long> {
    List<PortfolioHolding> findByPortfolioId(Long portfolioId);
    Optional<PortfolioHolding> findByPortfolioIdAndStockId(Long portfolioId, Long stockId);
}

interface TradeRepository extends JpaRepository<Trade, Long> {
    List<Trade> findByPortfolioIdOrderByTimestampDesc(Long portfolioId);
    List<Trade> findByPortfolioIdAndStockIdOrderByTimestampDesc(Long portfolioId, Long stockId);
}
