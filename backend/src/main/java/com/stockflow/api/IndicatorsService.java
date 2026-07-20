package com.stockflow.api;

import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

/**
 * Computes technical indicators commonly used by stock traders.
 */
@Service
class IndicatorsService {

    /**
     * Simple Moving Average
     */
    List<BigDecimal> sma(List<BigDecimal> closes, int period) {
        List<BigDecimal> result = new ArrayList<>();
        for (int i = 0; i < closes.size(); i++) {
            if (i < period - 1) {
                result.add(null);
            } else {
                BigDecimal sum = BigDecimal.ZERO;
                for (int j = i - period + 1; j <= i; j++) {
                    sum = sum.add(closes.get(j));
                }
                result.add(sum.divide(BigDecimal.valueOf(period), 2, RoundingMode.HALF_UP));
            }
        }
        return result;
    }

    /**
     * Exponential Moving Average
     */
    List<BigDecimal> ema(List<BigDecimal> closes, int period) {
        List<BigDecimal> result = new ArrayList<>();
        BigDecimal multiplier = BigDecimal.valueOf(2.0 / (period + 1)).setScale(4, RoundingMode.HALF_UP);
        BigDecimal ema = BigDecimal.ZERO;

        for (int i = 0; i < closes.size(); i++) {
            if (i < period - 1) {
                result.add(null);
                ema = ema.add(closes.get(i));
            } else if (i == period - 1) {
                ema = ema.add(closes.get(i)).divide(BigDecimal.valueOf(period), 2, RoundingMode.HALF_UP);
                result.add(ema);
            } else {
                ema = closes.get(i).subtract(ema).multiply(multiplier).add(ema);
                result.add(ema.setScale(2, RoundingMode.HALF_UP));
            }
        }
        return result;
    }

    /**
     * Relative Strength Index (RSI)
     */
    List<BigDecimal> rsi(List<BigDecimal> closes, int period) {
        List<BigDecimal> result = new ArrayList<>();
        BigDecimal avgGain = BigDecimal.ZERO;
        BigDecimal avgLoss = BigDecimal.ZERO;

        for (int i = 0; i < closes.size(); i++) {
            if (i == 0) {
                result.add(null);
                continue;
            }
            BigDecimal change = closes.get(i).subtract(closes.get(i - 1));
            BigDecimal gain = change.compareTo(BigDecimal.ZERO) > 0 ? change : BigDecimal.ZERO;
            BigDecimal loss = change.compareTo(BigDecimal.ZERO) < 0 ? change.abs() : BigDecimal.ZERO;

            if (i <= period) {
                avgGain = avgGain.add(gain);
                avgLoss = avgLoss.add(loss);
                if (i == period) {
                    avgGain = avgGain.divide(BigDecimal.valueOf(period), 4, RoundingMode.HALF_UP);
                    avgLoss = avgLoss.divide(BigDecimal.valueOf(period), 4, RoundingMode.HALF_UP);
                    BigDecimal rs = avgLoss.compareTo(BigDecimal.ZERO) == 0
                            ? BigDecimal.valueOf(100)
                            : avgGain.divide(avgLoss, 4, RoundingMode.HALF_UP);
                    BigDecimal rsi = BigDecimal.valueOf(100).subtract(
                            BigDecimal.valueOf(100).divide(BigDecimal.ONE.add(rs), 2, RoundingMode.HALF_UP));
                    result.add(rsi);
                } else {
                    result.add(null);
                }
            } else {
                avgGain = avgGain.multiply(BigDecimal.valueOf(period - 1))
                        .add(gain).divide(BigDecimal.valueOf(period), 4, RoundingMode.HALF_UP);
                avgLoss = avgLoss.multiply(BigDecimal.valueOf(period - 1))
                        .add(loss).divide(BigDecimal.valueOf(period), 4, RoundingMode.HALF_UP);
                BigDecimal rs = avgLoss.compareTo(BigDecimal.ZERO) == 0
                        ? BigDecimal.valueOf(100)
                        : avgGain.divide(avgLoss, 4, RoundingMode.HALF_UP);
                BigDecimal rsi = BigDecimal.valueOf(100).subtract(
                        BigDecimal.valueOf(100).divide(BigDecimal.ONE.add(rs), 2, RoundingMode.HALF_UP));
                result.add(rsi);
            }
        }
        return result;
    }

    /**
     * MACD (Moving Average Convergence Divergence)
     * Returns MACD line, Signal line, and Histogram
     */
    Map<String, List<BigDecimal>> macd(List<BigDecimal> closes) {
        List<BigDecimal> ema12 = ema(closes, 12);
        List<BigDecimal> ema26 = ema(closes, 26);

        List<BigDecimal> macdLine = new ArrayList<>();
        for (int i = 0; i < closes.size(); i++) {
            if (ema12.get(i) == null || ema26.get(i) == null) {
                macdLine.add(null);
            } else {
                macdLine.add(ema12.get(i).subtract(ema26.get(i)));
            }
        }

        List<BigDecimal> signal = ema(macdLine.stream().map(v -> v == null ? BigDecimal.ZERO : v).toList(), 9);
        List<BigDecimal> histogram = new ArrayList<>();
        for (int i = 0; i < closes.size(); i++) {
            if (macdLine.get(i) == null || signal.get(i) == null) {
                histogram.add(null);
            } else {
                histogram.add(macdLine.get(i).subtract(signal.get(i)));
            }
        }

        Map<String, List<BigDecimal>> result = new HashMap<>();
        result.put("macd", macdLine);
        result.put("signal", signal);
        result.put("histogram", histogram);
        return result;
    }

    /**
     * Bollinger Bands (20-period SMA ± 2 standard deviations)
     */
    Map<String, List<BigDecimal>> bollingerBands(List<BigDecimal> closes, int period) {
        List<BigDecimal> smaLine = sma(closes, period);
        List<BigDecimal> upper = new ArrayList<>();
        List<BigDecimal> lower = new ArrayList<>();

        for (int i = 0; i < closes.size(); i++) {
            if (smaLine.get(i) == null) {
                upper.add(null);
                lower.add(null);
            } else {
                BigDecimal sumSq = BigDecimal.ZERO;
                int count = 0;
                for (int j = Math.max(0, i - period + 1); j <= i; j++) {
                    BigDecimal diff = closes.get(j).subtract(smaLine.get(i));
                    sumSq = sumSq.add(diff.multiply(diff));
                    count++;
                }
                BigDecimal stdDev = BigDecimal.valueOf(Math.sqrt(sumSq.divide(BigDecimal.valueOf(count), 4, RoundingMode.HALF_UP).doubleValue()))
                        .setScale(2, RoundingMode.HALF_UP);
                upper.add(smaLine.get(i).add(stdDev.multiply(BigDecimal.valueOf(2))));
                lower.add(smaLine.get(i).subtract(stdDev.multiply(BigDecimal.valueOf(2))));
            }
        }

        Map<String, List<BigDecimal>> result = new HashMap<>();
        result.put("upper", upper);
        result.put("middle", smaLine);
        result.put("lower", lower);
        return result;
    }

    /**
     * Compute all indicators for a stock's price history
     */
    Map<String, Object> computeAll(List<StockPrice> priceHistory) {
        List<BigDecimal> closes = priceHistory.stream().map(p -> p.close).toList();
        List<Long> timestamps = priceHistory.stream().map(p -> p.timestamp).toList();

        Map<String, Object> result = new HashMap<>();
        result.put("timestamps", timestamps);
        result.put("sma20", sma(closes, 20));
        result.put("sma50", sma(closes, 50));
        result.put("rsi14", rsi(closes, 14));
        result.put("macd", macd(closes));
        result.put("bollinger", bollingerBands(closes, 20));
        return result;
    }
}
