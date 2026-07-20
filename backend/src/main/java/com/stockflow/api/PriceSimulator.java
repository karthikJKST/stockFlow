package com.stockflow.api;

import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@Service
class PriceSimulator {

    private static final long ONE_HOUR_MS = 3600_000L;
    private static final long ONE_DAY_MS = 86_400_000L;
    private static final long MARKET_OPEN = 9 * ONE_HOUR_MS + 30 * 60_000L; // 9:30 AM
    private static final long MARKET_CLOSE = 16 * ONE_HOUR_MS; // 4:00 PM

    /**
     * Generate candlestick data for the past N days (intraday 1-hour candles during market hours)
     */
    List<StockPrice> generateHistoricalCandles(Stock stock, int days, BigDecimal basePrice) {
        List<StockPrice> candles = new ArrayList<>();
        ThreadLocalRandom rand = ThreadLocalRandom.current();
        long now = System.currentTimeMillis();
        long dayStart = now - (days * ONE_DAY_MS);
        dayStart = alignToMarketOpen(dayStart);

        BigDecimal price = basePrice;

        // Generate hourly candles only during market hours (9:30 AM - 4:00 PM = 6.5 hours)
        for (long t = dayStart; t < now; t += ONE_HOUR_MS) {
            long timeOfDay = t % ONE_DAY_MS;
            // Only generate candles during market hours (skip weekends too)
            if (timeOfDay >= MARKET_OPEN && timeOfDay <= MARKET_CLOSE && !isWeekend(t)) {
                BigDecimal change = BigDecimal.valueOf(rand.nextGaussian() * 0.008 + 0.0002)
                        .setScale(4, RoundingMode.HALF_UP);
                BigDecimal open = price;
                BigDecimal close = open.multiply(BigDecimal.ONE.add(change))
                        .setScale(2, RoundingMode.HALF_UP);
                if (close.compareTo(BigDecimal.ONE) < 0) close = BigDecimal.ONE;
                BigDecimal high = open.max(close).multiply(BigDecimal.valueOf(1 + Math.abs(rand.nextGaussian() * 0.003)))
                        .setScale(2, RoundingMode.HALF_UP);
                BigDecimal low = open.min(close).multiply(BigDecimal.valueOf(1 - Math.abs(rand.nextGaussian() * 0.003)))
                        .setScale(2, RoundingMode.HALF_UP);
                long volume = (long) (rand.nextInt(500_000, 10_000_000) * (1 + Math.abs(change.doubleValue()) * 10));

                candles.add(new StockPrice(stock, t, open, high, low, close, volume));
                price = close;
            }
        }
        return candles;
    }

    /**
     * Generate a single new price candle (for "live" simulation)
     */
    StockPrice generateNextCandle(Stock stock, BigDecimal lastClose) {
        ThreadLocalRandom rand = ThreadLocalRandom.current();
        BigDecimal change = BigDecimal.valueOf(rand.nextGaussian() * 0.006 + 0.0001)
                .setScale(4, RoundingMode.HALF_UP);
        BigDecimal open = lastClose;
        BigDecimal close = open.multiply(BigDecimal.ONE.add(change))
                .setScale(2, RoundingMode.HALF_UP);
        if (close.compareTo(BigDecimal.ONE) < 0) close = BigDecimal.ONE;
        BigDecimal high = open.max(close).multiply(BigDecimal.valueOf(1 + Math.abs(rand.nextGaussian() * 0.002)))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal low = open.min(close).multiply(BigDecimal.valueOf(1 - Math.abs(rand.nextGaussian() * 0.002)))
                .setScale(2, RoundingMode.HALF_UP);
        long volume = (long) (rand.nextInt(100_000, 5_000_000));

        return new StockPrice(stock, System.currentTimeMillis(), open, high, low, close, volume);
    }

    /**
     * Calculate current day's change percent for a stock
     */
    void updateStockPrice(Stock stock, StockPrice latestCandle) {
        stock.previousClose = stock.currentPrice;
        stock.currentPrice = latestCandle.close;
        if (stock.previousClose.compareTo(BigDecimal.ZERO) > 0) {
            stock.changePercent = latestCandle.close.subtract(stock.previousClose)
                    .divide(stock.previousClose, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(2, RoundingMode.HALF_UP);
        }
        stock.volume = latestCandle.volume;
    }

    private long alignToMarketOpen(long timestamp) {
        Calendar cal = Calendar.getInstance();
        cal.setTimeInMillis(timestamp);
        cal.set(Calendar.HOUR_OF_DAY, 9);
        cal.set(Calendar.MINUTE, 30);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        return cal.getTimeInMillis();
    }

    private boolean isWeekend(long timestamp) {
        Calendar cal = Calendar.getInstance();
        cal.setTimeInMillis(timestamp);
        int day = cal.get(Calendar.DAY_OF_WEEK);
        return day == Calendar.SATURDAY || day == Calendar.SUNDAY;
    }
}
