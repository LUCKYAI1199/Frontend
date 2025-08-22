// Types for frontend data structures

// Core option chain data types
export interface OptionData {
  strike_price: number;
  ce_bid_qty?: number;
  ce_bid_price?: number;
  ce_bid?: number;
  ce_ask_price?: number;
  ce_ask?: number;
  ce_ask_qty?: number;
  ce_last_price?: number;
  ce_ltp?: number;
  ce_volume?: number;
  ce_oi?: number;
  ce_oi_change?: number;
  ce_change?: number; // Price change
  ce_change_in_oi?: number; // Change in OI
  ce_iv?: number;
  ce_delta?: number;
  ce_gamma?: number;
  ce_theta?: number;
  ce_vega?: number;
  ce_rho?: number;
  ce_open?: number;
  ce_high?: number;
  ce_low?: number;
  ce_close?: number;
  ce_o?: number;
  ce_h?: number;
  ce_l?: number;
  ce_c?: number;
  ce_prev_high?: number;
  ce_prev_low?: number;
  ce_prev_close?: number;
  ce_prev_open?: number;
  
  pe_bid_qty?: number;
  pe_bid_price?: number;
  pe_bid?: number;
  pe_ask_price?: number;
  pe_ask?: number;
  pe_ask_qty?: number;
  pe_last_price?: number;
  pe_ltp?: number;
  pe_volume?: number;
  pe_oi?: number;
  pe_oi_change?: number;
  pe_change?: number; // Price change
  pe_change_in_oi?: number; // Change in OI
  pe_iv?: number;
  pe_delta?: number;
  pe_gamma?: number;
  pe_theta?: number;
  pe_vega?: number;
  pe_rho?: number;
  pe_open?: number;
  pe_high?: number;
  pe_low?: number;
  pe_close?: number;
  pe_o?: number;
  pe_h?: number;
  pe_l?: number;
  pe_c?: number;
  pe_prev_high?: number;
  pe_prev_low?: number;
  pe_prev_close?: number;
  pe_prev_open?: number;
  
  // Additional analysis fields
  ce_intrinsic?: number;
  ce_time_val?: number;
  ce_buy_percent?: number;
  ce_sell_percent?: number;
  ce_tp1?: number;
  ce_tp2?: number;
  ce_tp3?: number;
  ce_stop_loss?: number;
  ce_signal_type?: string;
  ce_signal_strength?: number;
  ce_signal_quality?: string;
  ce_signal_confidence?: string;
  
  pe_intrinsic?: number;
  pe_time_val?: number;
  pe_buy_percent?: number;
  pe_sell_percent?: number;
  pe_tp1?: number;
  pe_tp2?: number;
  pe_tp3?: number;
  pe_stop_loss?: number;
  pe_signal_type?: string;
  pe_signal_strength?: number;
  pe_signal_quality?: string;
  pe_signal_confidence?: string;
}

export interface OptionChainResponse {
  option_chain: OptionData[];
  spot_price: number;
  timestamp: string;
  total_ce_oi: number;
  total_pe_oi: number;
  total_ce_volume: number;
  total_pe_volume: number;
  pcr_oi: number;
  pcr_volume: number;
  atm_strike: number;
  max_pain: number;
  max_gain: number;
  error?: string;
}

// OHLC Data types
export interface OHLCData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  date?: string;
  ltp?: number;
}

export interface OHLCResponse {
  current_day: OHLCData;
  previous_day: OHLCData;
  reference_price: number;
  error?: string;
}

// Market and symbol types
export type MarketType = 'NSE & BSE' | 'MCX';
export type IndexSymbol = 'NIFTY' | 'BANKNIFTY' | 'FINNIFTY' | 'MIDCPNIFTY' | 'SENSEX';
export type StockSymbol = 'TATAMOTORS' | 'HDFCBANK' | 'SBIN' | 'AXISBANK' | 'ICICIBANK' | 'RELIANCE' | 'INFY' | 'TCS' | string;
export type CommoditySymbol = 'COPPER' | 'CRUDEOIL' | 'CRUDEOILM' | 'GOLD' | 'GOLDM' | 'NATGASMINI' | 'NATURALGAS' | 'SILVER' | 'SILVERM' | 'ZINC';
export type Symbol = IndexSymbol | StockSymbol | CommoditySymbol;

export type MarketPhase = 'PRE_MARKET' | 'MARKET_HOURS' | 'POST_MARKET' | 'CLOSED';
export type Timeframe = '5minute' | '15minute' | '60minute' | 'day';

// Dashboard and analysis types
export interface DashboardData {
  totalCEOI: number;
  totalPEOI: number;
  pcr: number;
  atmStrike: number;
  totalCEVolume: number;
  totalPEVolume: number;
  maxPain: number;
  maxGain: number;
  highRallyStrike: string;
  highBearDipStrike: string;
  dailySupport: number;
  weeklySupport: number;
  dailyResistance: number;
  weeklyResistance: number;
}

// Alert / Signal generation types
export type AlertSignalCategory = 'BUY_ZONE' | 'SELL_ZONE' | 'HERO_CE' | 'HERO_PE';
export interface AlertSignal {
  id: string;                 // unique id
  category: AlertSignalCategory;
  title: string;              // e.g. 🟢 BUY ZONE (Bullish)
  direction: 'bullish' | 'bearish';
  description: string;        // human readable explanation
  ceStrikes: number[];        // CE strikes involved (buy or sell depending on category)
  peStrikes: number[];        // PE strikes involved (buy or sell depending on category)
  entryPrice?: number;        // captured at signal creation (primary strike LTP)
  target?: number;            // optional target (not computed yet)
  targetHitTime?: Date | null;// only fill when actually hit – never default to now
  createdAt: Date;            // when signal formed
  meta?: Record<string, any> & {
    side?: 'CE' | 'PE';
    entryStrike?: number;
    targetRange?: [number, number];
  }; // additional calculated fields
  // Per strike details (new)
  ceDetails?: AlertSignalStrikeDetail[]; // one per CE strike
  peDetails?: AlertSignalStrikeDetail[]; // one per PE strike
}

export interface AlertSignalStrikeDetail {
  strike: number;
  side: 'CE' | 'PE';
  entry?: number;
  target?: number;
  hitTime?: Date | null;
  triggeredTime?: Date; // when this strike detail first triggered (persist across refresh)
}

// Strike analysis types
export interface StrikeData {
  strike: number;
  price: number;
  oi: number;
  volume: number;
  iv: number;
}

export interface StrikeAnalysis {
  atm: {
    strike: number;
    calls: StrikeData;
    puts: StrikeData;
  };
  itm_calls: StrikeData[];
  itm_puts: StrikeData[];
  otm_calls: StrikeData[];
  otm_puts: StrikeData[];
  highestOI: {
    calls: StrikeData;
    puts: StrikeData;
  };
  highestVolume: {
    calls: StrikeData;
    puts: StrikeData;
  };
}

// SHARPE Logic types
export interface SharpeData {
  spotPrice: number;
  atmStrike: number;
  otmCallStrike: number;
  otmPutStrike: number;
  otmCallPrice: number;
  otmPutPrice: number;
  sharpeValue: number;
  calculationTime: string;
  ohlcData?: OHLCResponse;
  detailedOHLCData?: DetailedOHLCData;
}

export interface DetailedOHLCData {
  atm: {
    strike: number;
    calls: OHLCData;
    puts: OHLCData;
  };
  otm: {
    calls: OHLCData & { strike: number };
    puts: OHLCData & { strike: number };
  };
  itm: {
    calls: {
      strikes: number[];
      data: (OHLCData & { strike: number })[];
    };
    puts: {
      strikes: number[];
      data: (OHLCData & { strike: number })[];
    };
  };
}

// Chart and candle data types
export interface CandleData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  o?: number;
  h?: number;
  l?: number;
  c?: number;
  v?: number;
}

export interface ChartState {
  zoom: number;
  panX: number;
  panY: number;
  crosshair: boolean;
  volume: boolean;
  indicators: {
    sma20: boolean;
    sma50: boolean;
    ema20: boolean;
    ema50: boolean;
    bollinger: boolean;
    rsi: boolean;
    macd: boolean;
  };
}

// Earth Logic types
export interface EarthLogicData {
  symbol: Symbol;
  timeframe: Timeframe;
  prevHigh: number;
  prevLow: number;
  currentOpen: number;
  earthLogic: number;
  diff: number;
  earthResistance: number;
  earthSupport: number;
  candleData: CandleData[];
}

// Screen mode types
export type ScreenMode = 'desktop' | 'tablet' | 'mobile';

// Notification types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: string;
}

// WebSocket types
export interface SocketSubscription {
  symbol: Symbol;
  clientId: string;
}

export interface SocketMessage {
  type: 'option_chain_update' | 'ohlc_update' | 'connection_status' | 'error';
  data?: any;
  symbol?: Symbol;
  timestamp?: string;
}

// Export and import types
export interface ExportData {
  symbol: Symbol;
  timestamp: string;
  data: any;
  format: 'json' | 'csv' | 'pdf' | 'excel';
}

// Greeks calculation types
export interface Greeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

// Multi-symbol SHARPE types
export interface MultiSharpeData {
  symbol: Symbol;
  sharpeValue: number;
  calculationTime: string;
  marketPhase: MarketPhase;
  status: 'success' | 'error' | 'calculating';
}

export interface MultiSharpeResult {
  results: MultiSharpeData[];
  summary: {
    highest: MultiSharpeData;
    lowest: MultiSharpeData;
    average: number;
    totalIndices: number;
  };
  exportFormat: 'csv' | 'pdf' | 'both';
}

// Component Props types
export interface ComponentProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

// Form types
export interface FormData {
  [key: string]: any;
}

// Advanced SHARPE Analysis types
export interface AdvancedSharpeAnalysis {
  marketPhase: MarketPhase;
  itmStrikes: StrikeData[];
  atmStrikes: StrikeData[];
  otmStrikes: StrikeData[];
  itmSharpe: number;
  atmSharpe: number;
  otmSharpe: number;
  enhancedSharpe: number;
  weights: {
    itm: number;
    atm: number;
    otm: number;
  };
}
