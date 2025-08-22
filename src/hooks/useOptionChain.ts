import { useState, useEffect, useCallback, useRef } from 'react';
import { Symbol, OptionChainResponse } from '../types';
import { ApiService } from '../services/ApiService';
import { useSocket } from '../services/SocketService';

interface UseOptionChainOptions {
  symbol: Symbol;
  expiry?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useOptionChain = ({
  symbol,
  expiry,
  autoRefresh = true,
  refreshInterval = 1000,
}: UseOptionChainOptions) => {
  const [data, setData] = useState<OptionChainResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  // Track latest request to avoid race conditions updating state with stale symbol data
  const lastRequestIdRef = useRef(0);
  const activeSymbolRef = useRef<Symbol>(symbol);
  const inFlightRef = useRef(false);

  const { subscribeToSymbol, unsubscribeFromSymbol, isConnected } = useSocket();

  const fetchOptionChain = useCallback(async () => {
    if (!symbol) return;
    if (inFlightRef.current) {
      // Skip starting another fetch while one is in progress to avoid perpetual stale discards
      return;
    }
    const requestId = ++lastRequestIdRef.current; // increment and capture
    const symbolAtRequest = symbol; // snapshot
    try {
      inFlightRef.current = true;
      setLoading(true);
      setError(null);
      console.log(`🔄 Fetching option chain for ${symbolAtRequest}${expiry ? ` with expiry ${expiry}` : ''} (req #${requestId})`);
      const response = await ApiService.getOptionChain(symbolAtRequest, expiry);
      // Ignore if a newer request has started or symbol changed
      if (requestId !== lastRequestIdRef.current || symbolAtRequest !== activeSymbolRef.current) {
        console.log(`⏭️ Stale response discarded for ${symbolAtRequest} (req #${requestId})`);
        return;
      }
      console.log(`✅ Option chain response:`, response);
      if (response && typeof response === 'object') {
        setData(response);
        setLastUpdate(new Date());
        console.log(`📊 Option chain data applied for ${symbolAtRequest}`);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      if (requestId !== lastRequestIdRef.current) return; // suppress errors from stale requests
      const errorMessage = ApiService.handleApiError(err);
      setError(errorMessage);
      console.error('❌ Error fetching option chain:', err, 'Error message:', errorMessage);
    } finally {
      if (requestId === lastRequestIdRef.current) setLoading(false);
      inFlightRef.current = false;
    }
  }, [symbol, expiry]);

  // When symbol / expiry changes, immediately clear existing data to prevent visual overlap
  useEffect(() => {
    activeSymbolRef.current = symbol;
    // Keep previous data until new arrives (prevents blank screen) but mark loading
    setLoading(true);
  }, [symbol, expiry]);

  // Handle real-time updates
  useEffect(() => {
    const handleOptionChainUpdate = (event: CustomEvent) => {
      const updateData = event.detail as OptionChainResponse & { symbol?: Symbol };
      // Guard: only update if matches current active symbol (prevents cross-symbol bleed)
      if (updateData && !updateData.error && (!updateData.symbol || updateData.symbol === activeSymbolRef.current)) {
        setData(updateData);
        setLastUpdate(new Date());
      }
    };

    window.addEventListener('optionChainUpdate', handleOptionChainUpdate as EventListener);

    return () => {
      window.removeEventListener('optionChainUpdate', handleOptionChainUpdate as EventListener);
    };
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    let currentSymbol = symbol;
    
    if (currentSymbol && isConnected && autoRefresh) {
      console.log(`🔔 Subscribing to ${currentSymbol} for real-time updates`);
      subscribeToSymbol(currentSymbol);
    }

    return () => {
      if (currentSymbol) {
        console.log(`🔕 Unsubscribing from ${currentSymbol}`);
        unsubscribeFromSymbol(currentSymbol);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, isConnected, autoRefresh]); // Disable exhaustive deps check to avoid infinite loops

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchOptionChain();

    let interval: NodeJS.Timeout;
    if (autoRefresh && refreshInterval > 0) {
      interval = setInterval(fetchOptionChain, refreshInterval);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [fetchOptionChain, autoRefresh, refreshInterval]);

  const refresh = useCallback(() => {
    fetchOptionChain();
  }, [fetchOptionChain]);

  return {
    data,
    loading,
    error,
    lastUpdate,
    refresh,
  };
};
