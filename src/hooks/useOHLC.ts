import { useState, useEffect, useCallback } from 'react';
import { Symbol, OHLCResponse } from '../types';
import { ApiService } from '../services/ApiService';

interface UseOHLCOptions {
  symbol: Symbol;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useOHLC = ({
  symbol,
  autoRefresh = true,
  refreshInterval = 10000,
}: UseOHLCOptions) => {
  const [data, setData] = useState<OHLCResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchOHLCData = useCallback(async () => {
    if (!symbol) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await ApiService.getOHLCData(symbol);
      setData(response);
      setLastUpdate(new Date());
    } catch (err) {
      setError(ApiService.handleApiError(err));
      console.error('Error fetching OHLC data:', err);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  // Handle real-time updates
  useEffect(() => {
    const handleOHLCUpdate = (event: CustomEvent) => {
      const updateData = event.detail as OHLCResponse;
      if (updateData && !updateData.error) {
        setData(updateData);
        setLastUpdate(new Date());
      }
    };

    window.addEventListener('ohlcUpdate', handleOHLCUpdate as EventListener);

    return () => {
      window.removeEventListener('ohlcUpdate', handleOHLCUpdate as EventListener);
    };
  }, []);

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchOHLCData();

    let interval: NodeJS.Timeout;
    if (autoRefresh && refreshInterval > 0) {
      interval = setInterval(fetchOHLCData, refreshInterval);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [fetchOHLCData, autoRefresh, refreshInterval]);

  const refresh = useCallback(() => {
    fetchOHLCData();
  }, [fetchOHLCData]);

  return {
    data,
    loading,
    error,
    lastUpdate,
    refresh,
  };
};
