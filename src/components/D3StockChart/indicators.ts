import { StockDataPoint, IndicatorDataPoint, BollingerBandsData } from './types';

/**
 * Calculate Simple Moving Average (SMA)
 */
export function calculateSMA(
  data: StockDataPoint[],
  period: number
): IndicatorDataPoint[] {
  const result: IndicatorDataPoint[] = [];

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const sum = slice.reduce((acc, point) => acc + point.value, 0);
    const average = sum / period;

    result.push({
      date: data[i].date,
      value: average,
    });
  }

  return result;
}

/**
 * Calculate Exponential Moving Average (EMA)
 */
export function calculateEMA(
  data: StockDataPoint[],
  period: number
): IndicatorDataPoint[] {
  const result: IndicatorDataPoint[] = [];
  const multiplier = 2 / (period + 1);

  // Start with SMA for the first value
  let ema = 0;
  for (let i = 0; i < period; i++) {
    ema += data[i].value;
  }
  ema = ema / period;

  result.push({
    date: data[period - 1].date,
    value: ema,
  });

  // Calculate EMA for remaining values
  for (let i = period; i < data.length; i++) {
    ema = (data[i].value - ema) * multiplier + ema;
    result.push({
      date: data[i].date,
      value: ema,
    });
  }

  return result;
}

/**
 * Calculate Standard Deviation
 */
function calculateStandardDeviation(values: number[]): number {
  const mean = values.reduce((acc, val) => acc + val, 0) / values.length;
  const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Calculate Bollinger Bands
 * Middle band: 20-period SMA
 * Upper band: Middle band + (2 × standard deviation)
 * Lower band: Middle band - (2 × standard deviation)
 */
export function calculateBollingerBands(
  data: StockDataPoint[],
  period: number = 20,
  stdDevMultiplier: number = 2
): BollingerBandsData[] {
  const result: BollingerBandsData[] = [];

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const values = slice.map((point) => point.value);

    // Calculate middle band (SMA)
    const sum = values.reduce((acc, val) => acc + val, 0);
    const middle = sum / period;

    // Calculate standard deviation
    const stdDev = calculateStandardDeviation(values);

    // Calculate upper and lower bands
    const upper = middle + stdDevMultiplier * stdDev;
    const lower = middle - stdDevMultiplier * stdDev;

    result.push({
      date: data[i].date,
      middle,
      upper,
      lower,
    });
  }

  return result;
}
