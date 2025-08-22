import axios from 'axios';
import {
  Symbol,
  OptionChainResponse,
  OHLCResponse,
  ApiResponse,
  Timeframe,
  CandleData,
  EarthLogicData,
  SharpeData,
  MultiSharpeResult,
  DashboardData,
  StrikeAnalysis,
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://backend-15-ie19.onrender.com';

// Cache for API responses
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

// Helper function to get cached data
const getCachedData = (key: string) => {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

// Helper function to set cached data
const setCachedData = (key: string, data: any) => {
  apiCache.set(key, { data, timestamp: Date.now() });
};

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export class ApiService {
  // Additional Sharp Pro signals
  static async getTodayAspSignals(): Promise<{ signals: any[] }>{
    const resp = await api.get('/api/sharp-pro/signals/today');
    const data = resp.data?.data ?? resp.data;
    return data as { signals: any[] };
  }
  // Additional SHARP PRO Logic API
  static async additionalSharpPro(symbol: Symbol = 'NIFTY', expiry?: string): Promise<any> {
    const cacheKey = `asp_${symbol}_${expiry || 'nearest'}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const payload: any = { symbol };
    if (expiry) payload.expiry = expiry;
    try {
      const resp = await api.post('/api/sharp-pro/additional', payload);
      const data = resp.data?.data ?? resp.data;
      setCachedData(cacheKey, data);
      return data;
    } catch (err: any) {
      // Fallback to GET alias if POST not available or blocked
      const isMethodOrNotFound = [404, 405].includes(err?.response?.status);
      if (!isMethodOrNotFound) throw err;
      const params = new URLSearchParams({ symbol: String(symbol) });
      if (expiry) params.append('expiry', expiry);
      const resp2 = await api.get(`/api/additional-sharp-pro?${params}`);
      const data2 = resp2.data?.data ?? resp2.data;
      setCachedData(cacheKey, data2);
      return data2;
    }
  }

  static async additionalSharpProBatch(symbols: Symbol[], expiry?: string): Promise<{ results: Record<string, any>; errors: Record<string, any> }>{
    const cacheKey = `asp_batch_${symbols.sort().join(',')}_${expiry || 'nearest'}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const payload: any = { symbols };
    if (expiry) payload.expiry = expiry;
    const resp = await api.post('/api/sharp-pro/additional/batch', payload);
    const data = (resp.data?.data ?? resp.data) as { results: Record<string, any>; errors: Record<string, any> };
    setCachedData(cacheKey, data);
    return data;
  }

  // SMD Key Buy APIs
  static async smdCalculate(symbol: Symbol = 'NIFTY', expiry?: string): Promise<any> {
    const payload: any = { symbol };
    if (expiry) payload.expiry = expiry;
    const resp = await api.post('/api/smd-key-buy/calculate', payload);
    return resp.data?.data ?? resp.data;
  }

  static async smdFetch(hours: number = 24): Promise<any> {
    const resp = await api.get(`/api/smd-key-buy/fetch?hours=${hours}`);
    return resp.data?.data ?? resp.data;
  }

  // Option Chain APIs
  static async getOptionChain(symbol: Symbol, expiry?: string): Promise<OptionChainResponse> {
    try {
      const params = new URLSearchParams();
      if (expiry) params.append('expiry', expiry);
      
      const url = params.toString() 
        ? `/api/real-data/option-chain/${symbol}?${params}`
        : `/api/real-data/option-chain/${symbol}`;
      
      const response = await api.get(url);
      
      // The real API returns data nested under response.data.data
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      // Fallback to direct data access for backwards compatibility
      return response.data;
    } catch (error) {
      console.error('Error fetching option chain:', error);
      throw error;
    }
  }

  static async getCustomOptionChain(
    symbol: Symbol,
    stockSymbol?: string,
    expiry?: string
  ): Promise<OptionChainResponse> {
    try {
      const params = new URLSearchParams({ index: symbol });
      if (stockSymbol) params.append('symbol', stockSymbol);
      if (expiry) params.append('expiry', expiry);
      
      const response = await api.get(`/api/custom_option_chain?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching custom option chain:', error);
      throw error;
    }
  }

  // OHLC Data APIs
  static async getOHLCData(symbol: Symbol): Promise<OHLCResponse> {
    try {
      // Primary (correct) endpoint as implemented in backend: /api/ohlc_data/<symbol>
      try {
        const response = await api.get(`/api/ohlc_data/${symbol}`);
        return response.data;
      } catch (innerErr: any) {
        // Fallback to legacy/query style if backend changes (kept for resilience)
        if (innerErr?.response?.status === 404) {
          const legacy = await api.get(`/api/get_ohlc_data?symbol=${symbol}`);
          return legacy.data;
        }
        throw innerErr;
      }
    } catch (error) {
      console.error('Error fetching OHLC data:', error);
      throw error;
    }
  }

  static async getUnderlyingOHLC(symbol: Symbol): Promise<OHLCResponse> {
    try {
      const response = await api.get(`/api/underlying_ohlc/${symbol}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching underlying OHLC:', error);
      throw error;
    }
  }

  static async getHistoricalOHLC(
    symbol: Symbol,
    from: string,
    to: string,
    interval: string = 'day'
  ): Promise<CandleData[]> {
    try {
      const params = new URLSearchParams({
        symbol,
        from,
        to,
        interval,
      });
      
      const response = await api.get(`/api/ohlc_data/${symbol}?${params}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching historical OHLC:', error);
      throw error;
    }
  }

  // Dashboard APIs
  static async getDashboardData(symbol: Symbol): Promise<DashboardData> {
    try {
      const response = await api.get(`/api/dashboard_data?symbol=${symbol}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }

  // Symbol APIs
  static async getAvailableSymbols(): Promise<{ indices: Symbol[]; stocks: Symbol[] }> {
    try {
      const response = await api.get('/api/real-data/all-symbols');
      const data = response.data?.data || response.data || {};
      const indices = (data.indices || ['NIFTY','BANKNIFTY','FINNIFTY','MIDCPNIFTY','SENSEX']) as Symbol[];
      const stocks = (data.stocks_with_options || data.stocks || []) as Symbol[];
      return { indices, stocks };
    } catch (error) {
      console.error('Error fetching available symbols:', error);
      throw error;
    }
  }

  // Full symbols listing including indices, stocks, commodities, and stocks with options
  static async getAllSymbolsFull(): Promise<{ indices: Symbol[]; stocks: Symbol[]; commodities: Symbol[]; stocks_with_options: Symbol[] }>{
    try {
      const response = await api.get('/api/real-data/all-symbols');
      const data = response.data?.data || response.data || {};
      return {
        indices: (data.indices || []) as Symbol[],
        stocks: (data.stocks || []) as Symbol[],
        commodities: (data.commodities || []) as Symbol[],
        stocks_with_options: (data.stocks_with_options || []) as Symbol[]
      };
    } catch (error) {
      console.error('Error fetching full symbols list:', error);
      // Fallback minimal set
      return {
        indices: ['NIFTY','BANKNIFTY','FINNIFTY','MIDCPNIFTY','SENSEX'] as Symbol[],
        stocks: [],
        commodities: ['COPPER','CRUDEOIL','GOLD','SILVER'] as Symbol[],
        stocks_with_options: []
      };
    }
  }

  static async getExpiryDates(symbol: Symbol): Promise<string[]> {
    try {
      // Check cache first
      const cacheKey = `expiries_${symbol}`;
      const cached = getCachedData(cacheKey);
      if (cached) {
        console.log(`📦 Using cached expiry dates for ${symbol}`);
        return cached;
      }

      const response = await api.get(`/api/real-data/expiries/${symbol}`);
      const data = response.data.data?.expiry_dates || [];
      
      // Cache the result
      setCachedData(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error('Error fetching expiry dates:', error);
      throw error;
    }
  }

  // Alias for backward compatibility
  static async getExpiries(symbol: Symbol): Promise<ApiResponse<string[]>> {
    try {
      const data = await this.getExpiryDates(symbol);
      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleApiError(error)
      };
    }
  }

  // Get all stocks with options
  static async getAllStocks(): Promise<ApiResponse<string[]>> {
    try {
      // Check cache first
      const cacheKey = 'all_stocks';
      const cached = getCachedData(cacheKey);
      if (cached) {
        console.log('📦 Using cached stocks data');
        return cached;
      }

      const response = await api.get('/api/real-data/all-symbols');
      const stocks = response.data.data?.stocks_with_options || [];
      
      const result = {
        success: true,
        data: stocks
      };

      // Cache the result
      setCachedData(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Error fetching all stocks:', error);
      return {
        success: false,
        error: this.handleApiError(error)
      };
    }
  }

  // Earth Logic APIs
  static async calculateEarthLogic(
    symbol: Symbol,
    timeframe: Timeframe = 'day'
  ): Promise<EarthLogicData> {
    try {
      const response = await api.post('/api/calculate_earth_logic', {
        symbol,
        timeframe,
      });
      return response.data;
    } catch (error) {
      console.error('Error calculating Earth Logic:', error);
      throw error;
    }
  }

  static async getEarthLogicChart(
    symbol: Symbol,
    timeframe: Timeframe = 'day'
  ): Promise<CandleData[]> {
    try {
      const response = await api.get(
        `/api/earth_logic_chart?symbol=${symbol}&timeframe=${timeframe}`
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching Earth Logic chart:', error);
      throw error;
    }
  }

  // SHARPE Logic APIs
  static async calculateSharpe(
    symbol: Symbol,
    expiry?: string,
    timeframe: Timeframe = 'day',
    inputMode: 'auto' | 'manual' = 'auto',
    manualData?: { otmCallPrice?: number; otmPutPrice?: number }
  ): Promise<SharpeData> {
    try {
      const payload: any = {
        symbol,
        timeframe,
        input_mode: inputMode,
      };

      if (expiry) payload.expiry = expiry;
      if (manualData) payload.manual_data = manualData;

      const response = await api.post('/api/calculate_sharpe', payload);
      return response.data;
    } catch (error) {
      console.error('Error calculating SHARPE:', error);
      throw error;
    }
  }

  static async calculateMultiSharpe(
    expiry: string,
    timeframe: 'post_market' | 'pre_market' | 'intraday' | 'all' = 'all',
    exportFormat: 'csv' | 'pdf' | 'both' = 'csv'
  ): Promise<MultiSharpeResult> {
    try {
      const response = await api.post('/api/calculate_multi_sharpe', {
        expiry,
        timeframe,
        export_format: exportFormat,
      });
      return response.data;
    } catch (error) {
      console.error('Error calculating multi-SHARPE:', error);
      throw error;
    }
  }

  // Advanced Analysis APIs
  static async getAdvancedStrikeAnalysis(
    symbol: Symbol,
    expiry?: string
  ): Promise<StrikeAnalysis> {
    try {
      const params = new URLSearchParams({ symbol });
      if (expiry) params.append('expiry', expiry);
      
      const response = await api.get(`/api/advanced_strike_analysis?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching advanced strike analysis:', error);
      throw error;
    }
  }

  static async getGreeksData(
    symbol: Symbol,
    expiry?: string
  ): Promise<any> {
    try {
      const params = new URLSearchParams({ symbol });
      if (expiry) params.append('expiry', expiry);
      
      const response = await api.get(`/api/greeks_data?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching Greeks data:', error);
      throw error;
    }
  }

  // Export APIs
  static async exportToPDF(
    symbol: Symbol,
    data: any,
    filename?: string
  ): Promise<Blob> {
    try {
      const response = await api.post('/api/export_pdf', {
        symbol,
        data,
        filename,
      }, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw error;
    }
  }

  static async exportToExcel(
    symbol: Symbol,
    data: any,
    filename?: string
  ): Promise<Blob> {
    try {
      const response = await api.post('/api/export_excel', {
        symbol,
        data,
        filename,
      }, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw error;
    }
  }

  // Status and Health APIs

  // Test Kite API connection
  static async testKiteConnection(): Promise<ApiResponse<any>> {
    try {
      console.log('🔄 Testing Kite API connection...');
      const response = await api.get('/api/real-data/test-connection');
      console.log('✅ Kite API connection test result:', response.data);
      
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error('❌ Kite API connection test failed:', error);
      return {
        success: false,
        error: this.handleApiError(error)
      };
    }
  }

  // Test WebSocket connection
  static async testWebSocketConnection(): Promise<ApiResponse<any>> {
    try {
      console.log('🔄 Testing WebSocket connection...');
      const response = await api.post('/api/websocket/test');
      console.log('✅ WebSocket connection test result:', response.data);
      
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error('❌ WebSocket connection test failed:', error);
      return {
        success: false,
        error: this.handleApiError(error)
      };
    }
  }

  // General health check
  static async getHealthStatus(): Promise<ApiResponse<any>> {
    try {
      // Prefer namespaced health under /api when backend is mounted on /api
      const response = await api.get('/health').catch(async () => await api.get('/api/health'));
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error('Error checking health status:', error);
      return {
        success: false,
        error: this.handleApiError(error)
      };
    }
  }

  static async getApiStatus(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await api.get('/api/status');
      return response.data;
    } catch (error) {
      console.error('Error checking API status:', error);
      throw error;
    }
  }

  static async getMarketStatus(): Promise<{
    isOpen: boolean;
    phase: string;
    nextChange: string;
  }> {
    try {
      const response = await api.get('/api/market_status');
      return response.data;
    } catch (error) {
      console.error('Error checking market status:', error);
      throw error;
    }
  }

  // Get current spot price for a symbol
  static async getSpotPrice(symbol: Symbol): Promise<ApiResponse<{
    price: number;
    change: number;
    changePercent: number;
  }>> {
    try {
      console.log(`🔄 API Request: GET /api/spot_price/${symbol}`);
      const response = await api.get(`/api/spot_price/${symbol}`);
      console.log(`✅ API Response for ${symbol}:`, response.data);
      
      return {
        success: true,
        data: {
          price: response.data.spot_price || response.data.price || 0,
          change: response.data.change || 0,
          changePercent: response.data.change_percent || 0,
        }
      };
    } catch (error) {
      console.error(`❌ Error fetching spot price for ${symbol}:`, error);
      return {
        success: false,
        error: this.handleApiError(error)
      };
    }
  }

  // Utility methods
  static async ping(): Promise<{ success: boolean; latency: number }> {
    try {
      const start = Date.now();
      await api.get('/api/ping');
      const latency = Date.now() - start;
      return { success: true, latency };
    } catch (error) {
      console.error('Error pinging API:', error);
      return { success: false, latency: -1 };
    }
  }

  static downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Error handling helper
  static handleApiError(error: any): string {
    try {
      // Prefer a top-level message if provided by backend formatter, but append details if available
      const resp = error?.response?.data;
      const baseMsg = resp?.message || error?.message;
      const detailsObj = resp?.error?.details || resp?.details || {};
      const exceptionDetail = typeof detailsObj?.exception === 'string' ? detailsObj.exception : undefined;
      const composed = exceptionDetail && baseMsg
        ? `${baseMsg} (${exceptionDetail})`
        : baseMsg;
      if (typeof composed === 'string' && composed.length) return composed;

      // Fallback: backend may send { error: { code, details } }
      const errObj = error?.response?.data?.error;
      if (errObj && typeof errObj === 'object') {
        const code = errObj.code || 'ERROR';
        const details = errObj.details || {};
        // Try to extract common validation shape { field, message }
        const field = details.field;
        const dmsg = details.message || details.detail || '';
        if (field && dmsg) return `${code}: ${field} - ${dmsg}`;
        if (typeof details.exception === 'string' && details.exception.length) {
          return `${code}: ${details.exception}`;
        }
        // As a last resort, stringify details succinctly
        const detailsStr = Object.keys(details).length ? `: ${JSON.stringify(details)}` : '';
        return `${code}${detailsStr}`;
      }
    } catch {}
    return 'An unexpected error occurred';
  }
}
